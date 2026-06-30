// AI Recruiter Copilot API — powered by GROQ (no Claude / no API key needed).
//
// This is a genuine MCP client: Groq is the "brain" (function-calling) and the
// DevSpark MCP server is the "hands" (tools). The two are linked IN-PROCESS via
// the MCP SDK's InMemoryTransport, so every tool call goes through the real MCP
// protocol — the same server Claude Desktop / the HTTP /api/mcp route expose —
// just driven by Groq instead of Claude.
//
// Frugal by design: capped rounds, small max_tokens, and every MCP tool is
// itself zero-Groq (Prisma + NLP). A user message costs ~1-3 Groq completions.
import Groq from "groq-sdk";
import { Role } from "@prisma/client";
import { Client } from "@modelcontextprotocol/sdk/client";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { getAuthSession } from "@/lib/auth";
import { createDevSparkMcpServer } from "@/mcp-server/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "llama-3.1-8b-instant";
const MAX_ROUNDS = 4;

// Tools exposed to the LLM (the calendar/email compat tools are intentionally
// hidden — they exist for the interview-scheduling copilot, not for chat).
const CHAT_TOOLS = new Set([
  "list_open_jobs",
  "score_resume",
  "shortlist_candidates",
  "find_matching_jobs",
  "build_resume",
  "get_application_stats",
  "schedule_interview",
  "bulk_shortlist",
  "reject_candidates",
  "send_bulk_invites",
]);

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the DevSpark Recruiter Copilot, an assistant for recruiters and admins of an AI recruitment platform.

Rules:
- ONLY use the tools provided in this request. Never invent or call any other tool (no web search, no browsing).
- Tools need IDs, not names. When the user names a job (e.g. "Backend Engineer"), FIRST call list_open_jobs, match the title to its id, THEN call the tool that needs jobId.
- Always call a tool to get real data instead of guessing.
- When you show candidates, include their score and a one-line rationale. Be concise.`;

// JSON Schema (MCP inputSchema) → Groq function definition.
function toGroqTools(
  tools: { name: string; description?: string; inputSchema?: unknown }[]
) {
  return tools
    .filter((t) => CHAT_TOOLS.has(t.name))
    .map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description ?? "",
        parameters: (t.inputSchema as Record<string, unknown>) ?? {
          type: "object",
          properties: {},
        },
      },
    }));
}

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter(
      (c): c is { type: "text"; text: string } =>
        !!c && typeof c === "object" && (c as { type?: unknown }).type === "text"
    )
    .map((c) => c.text)
    .join("\n");
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  const user = session?.user;
  if (!user?.id || (user.role !== Role.ADMIN && user.role !== Role.RECRUITER)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "GROQ_API_KEY is not configured." }, { status: 503 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const history = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  if (!history.length) {
    return Response.json({ error: "messages[] is required." }, { status: 400 });
  }

  // Link Groq's tool layer to the DevSpark MCP server in-process.
  const server = createDevSparkMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const mcp = new Client({ name: "devspark-copilot", version: "1.0.0" }, { capabilities: {} });
  await Promise.all([server.connect(serverTransport), mcp.connect(clientTransport)]);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const toolTrace: { tool: string; args: unknown }[] = [];

  try {
    const { tools } = await mcp.listTools();
    const groqTools = toGroqTools(tools);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages,
        tools: groqTools,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 700,
      });

      const choice = completion.choices[0]?.message;
      if (!choice) break;

      const toolCalls = choice.tool_calls ?? [];
      if (!toolCalls.length) {
        return Response.json({ reply: choice.content ?? "", toolTrace });
      }

      messages.push(choice);
      for (const call of toolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          /* leave empty */
        }
        // The logged-in user is the actor for any scheduling or invites.
        if (call.function.name === "schedule_interview" || call.function.name === "send_bulk_invites") {
          args.sentById = user.id;
        }
        toolTrace.push({ tool: call.function.name, args });

        let text: string;
        try {
          const result = await mcp.callTool({ name: call.function.name, arguments: args });
          text = extractText(result.content) || "(no output)";
        } catch (e) {
          text = `Error: ${e instanceof Error ? e.message : "tool failed"}`;
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: text });
      }
    }

    const final = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        ...messages,
        { role: "user", content: "Summarize the result for me now in plain text." },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });
    return Response.json({ reply: final.choices[0]?.message?.content ?? "", toolTrace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Copilot error";
    const rateLimited = /rate|429|quota/i.test(message);
    const toolHallucination = /tool_use_failed|was not in request\.tools/i.test(message);
    return Response.json(
      {
        error: rateLimited
          ? "The Groq free tier is rate-limited right now. Please try again in a moment."
          : toolHallucination
          ? "The model tried an unavailable action. Please rephrase (e.g. 'list open jobs' first, then shortlist)."
          : message,
      },
      { status: rateLimited ? 429 : toolHallucination ? 422 : 500 }
    );
  } finally {
    await mcp.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}
