import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MCP_SERVER_URL = process.env.MCP_SERVER_URL;

const CHAT_TOOLS = new Set([
  "list_open_jobs",
  "find_matching_jobs",
]);

type ChatMessage = { role: "user" | "assistant"; content: string };

async function fetchMcpTools() {
  const url = `${MCP_SERVER_URL}/api/mcp?op=list`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch tools from ${url}`);
  const data = await res.json();
  return (data.tools || []).filter((t: any) => CHAT_TOOLS.has(t.name));
}

async function callMcpTool(name: string, args: any) {
  const url = `${MCP_SERVER_URL}/api/mcp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op: "call", name, args }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Tool call ${name} failed: ${txt}`);
  }
  const result = await res.json();
  if (result.isError) {
    throw new Error(result.content?.[0]?.text || "Tool returned an error.");
  }
  return result.content?.[0]?.text || "Success (no output).";
}

function convertMcpToolToGroq(mcpTool: any) {
  const props: any = {};
  const required: string[] = [];

  const shape = mcpTool.inputSchema?.shape || {};
  for (const [key, val] of Object.entries(shape) as any) {
    props[key] = {
      type: val.type || "string",
      description: val.description || "",
    };
    if (!val.isOptional) required.push(key);
  }

  return {
    type: "function",
    function: {
      name: mcpTool.name,
      description: mcpTool.description,
      parameters: { type: "object", properties: props, required },
    },
  };
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== Role.APPLICANT) {
      return NextResponse.json({ error: "Unauthorized (Applicant only)" }, { status: 401 });
    }

    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let mcpTools: any[] = [];
    if (MCP_SERVER_URL) {
      try {
        mcpTools = await fetchMcpTools();
      } catch (e: any) {
        console.warn("Could not fetch tools from MCP HTTP server:", e.message);
      }
    }

    const groqTools = mcpTools.map(convertMcpToolToGroq);

    const systemMessage = {
      role: "system",
      content:
        `You are a helpful AI Career Assistant for an applicant on the Smart Job Recruitment System. ` +
        `Your goal is to help the applicant find jobs that match their profile and provide career advice. ` +
        `You have access to tools to list open jobs and find matching jobs for the user. ` +
        `The user's ID is ${session.user.id}. You do NOT need to ask them for their ID. ` +
        `Always be encouraging, professional, and concise. Format output in readable markdown.`,
    };

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-specdec",
      messages: [systemMessage, ...messages] as any[],
      tools: groqTools.length > 0 ? groqTools : undefined,
      tool_choice: groqTools.length > 0 ? "auto" : undefined,
      temperature: 0.2,
      max_tokens: 1500,
    });

    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) {
      throw new Error("No response from Groq");
    }

    const toolTrace: any[] = [];

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const groqMessages: any[] = [systemMessage, ...messages, responseMessage];

      for (const call of responseMessage.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          /* leave empty */
        }
        
        // SECURITY: Enforce that the applicant can only query matching jobs for themselves.
        if (call.function.name === "find_matching_jobs") {
          args = { ...args, applicantId: session.user.id };
        }
        
        toolTrace.push({ tool: call.function.name, args });

        let resultStr = "";
        try {
          resultStr = await callMcpTool(call.function.name, args);
        } catch (e: any) {
          resultStr = `Error executing tool: ${e.message}`;
        }

        groqMessages.push({
          tool_call_id: call.id,
          role: "tool",
          name: call.function.name,
          content: resultStr,
        });
      }

      const finalCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-specdec",
        messages: groqMessages as any[],
        temperature: 0.2,
        max_tokens: 1500,
      });

      return NextResponse.json({
        role: "assistant",
        content: finalCompletion.choices[0]?.message?.content || "",
        toolTrace,
      });
    }

    return NextResponse.json({
      role: "assistant",
      content: responseMessage.content || "",
      toolTrace: [],
    });
  } catch (error: any) {
    console.error("Applicant Copilot Error:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
