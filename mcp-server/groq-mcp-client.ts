// ─────────────────────────────────────────────────────────────────────────────
// Groq-powered MCP client — a terminal "Claude Desktop", but driven by Groq.
//
// Proves the DevSpark MCP server works with ANY LLM and needs no Claude/API key:
// it spawns the stdio MCP server as a child process, lists its tools, hands them
// to Groq as function definitions, and runs the tool-calling loop — dispatching
// each call back through the real MCP protocol (client.callTool).
//
// Usage:
//   npm run mcp:chat                       # interactive REPL
//   npm run mcp:chat -- "show hiring stats"  # one-shot (scriptable)
// ─────────────────────────────────────────────────────────────────────────────
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import Groq from "groq-sdk";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const MODEL = "llama-3.1-8b-instant";
const MAX_ROUNDS = 5;

// Calendar/email compat tools are for the scheduling copilot, not chat.
const HIDDEN = /^(google_calendar_|gmail_)/;

const SYSTEM_PROMPT = `You are the DevSpark Recruiter Copilot driven by Groq.
Use ONLY the provided tools (never invent a web search). Tools need IDs: to act on a job named by the user, call list_open_jobs first, match the title to its id, then call the tool that needs jobId. Always call a tool for real data. Be concise.`;

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((c): c is { type: "text"; text: string } => !!c && (c as { type?: unknown }).type === "text")
    .map((c) => c.text)
    .join("\n");
}

async function main() {
  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is missing in .env");
    process.exit(1);
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Spawn the DevSpark MCP server over stdio (it loads .env itself).
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "mcp-server/stdio.ts"],
  });
  const client = new Client({ name: "groq-mcp-cli", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);

  const { tools } = await client.listTools();
  const groqTools = tools
    .filter((t) => !HIDDEN.test(t.name))
    .map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description ?? "",
        parameters: (t.inputSchema as Record<string, unknown>) ?? { type: "object", properties: {} },
      },
    }));

  console.error(`Connected to DevSpark MCP server. ${groqTools.length} tools available (via Groq ${MODEL}).`);

  async function ask(userText: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userText },
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
      if (!choice) return "(no response)";
      const calls = choice.tool_calls ?? [];
      if (!calls.length) return choice.content ?? "";

      messages.push(choice);
      for (const call of calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          /* ignore */
        }
        process.stderr.write(`  → ${call.function.name}(${JSON.stringify(args)})\n`);
        let text: string;
        try {
          const result = await client.callTool({ name: call.function.name, arguments: args });
          text = extractText(result.content) || "(no output)";
        } catch (e) {
          text = `Error: ${e instanceof Error ? e.message : "tool failed"}`;
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: text });
      }
    }
    // Ran out of tool rounds — ask for a final plain-text answer with the data gathered.
    const final = await groq.chat.completions.create({
      model: MODEL,
      messages: [...messages, { role: "user", content: "Now answer me in plain text using the data above." }],
      temperature: 0.2,
      max_tokens: 500,
    });
    return final.choices[0]?.message?.content ?? "(no answer)";
  }

  const oneShot = process.argv.slice(2).join(" ").trim();
  if (oneShot) {
    try {
      console.log(await ask(oneShot));
    } catch (e) {
      console.error("Groq error:", e instanceof Error ? e.message : e);
    } finally {
      await client.close().catch(() => undefined);
      await transport.close().catch(() => undefined);
    }
    return;
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  console.log('DevSpark Recruiter Copilot (Groq + MCP). Type a question, or "exit".');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const q = (await rl.question("\nyou › ")).trim();
    if (!q || q === "exit" || q === "quit") break;
    try {
      console.log(`\nbot › ${await ask(q)}`);
    } catch (e) {
      console.error("Groq error:", e instanceof Error ? e.message : e);
    }
  }
  rl.close();
  await client.close().catch(() => undefined);
  await transport.close().catch(() => undefined);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
