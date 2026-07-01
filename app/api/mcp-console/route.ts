// Backend for the in-browser MCP Console.
//
// Talks to the DevSpark MCP server through a REAL MCP client (linked in-process
// via InMemoryTransport), so the console demonstrates the actual MCP protocol:
//   op "list" → list the server's tools + JSON-Schemas
//   op "call" → invoke a tool and return its result
import { Role } from "@prisma/client";
import { Client } from "@modelcontextprotocol/sdk/client";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { getAuthSession } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { createDevSparkMcpServer } from "@/mcp-server/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_TOOLS = new Set([
  "score_resume",
  "shortlist_candidates",
  "bulk_shortlist",
  "reject_candidates",
  "send_bulk_invites",
]);

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((c): c is { type: "text"; text: string } => !!c && (c as { type?: unknown }).type === "text")
    .map((c) => c.text)
    .join("\n");
}

async function withMcp<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const server = createDevSparkMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "mcp-console", version: "1.0.0" }, { capabilities: {} });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    return await fn(client);
  } finally {
    await client.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  const user = session?.user;
  if (!user?.id || (user.role !== Role.ADMIN && user.role !== Role.RECRUITER)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { op?: string; name?: string; args?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    if (body.op === "list") {
      const tools = await withMcp(async (client) => {
        const { tools } = await client.listTools();
        
        const jobs = await prisma.jobPosting.findMany({
          select: { id: true, title: true, createdAt: true, _count: { select: { applications: true } } },
          orderBy: { createdAt: "desc" },
        });

        const jobOptions = jobs.map((job) => ({
          value: job.id,
          label: `${job.title} · ${formatDate(job.createdAt)} [${job._count.applications} applicants]`,
          title: job.title,
          applicants: job._count.applications,
        }));

        const appOptions = await prisma.application.findMany({
          select: {
            id: true,
            job: { select: { title: true } },
            applicant: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        }).then((rows) => rows.map((row) => ({
          value: row.id,
          label: `${row.job.title} - ${row.applicant.name || row.applicant.email || row.id}`,
        })));

        return tools.map((t) => {
          if (!ACTIVE_TOOLS.has(t.name)) {
            return null;
          }

          const schema: any = t.inputSchema ?? { type: "object", properties: {} };
          
          if (schema.properties?.jobId) {
            schema.properties.jobId.enum = jobOptions.map((item) => item.value);
            schema.properties.jobId.enumLabels = jobOptions.map((item) => item.label);
            schema.properties.jobId.placeholder = "Select a job circular";
          }
          if (schema.properties?.applicationId) {
            schema.properties.applicationId.enum = appOptions.map((item) => item.value);
            schema.properties.applicationId.enumLabels = appOptions.map((item) => item.label);
            schema.properties.applicationId.placeholder = "Select an application";
          }
          if (schema.properties?.topK) {
            schema.properties.topK.placeholder = `Total applicants: ${schema.properties.jobId ? "select a job first" : "varies by job"}`;
          }
          if (schema.properties?.startDate) {
            schema.properties.startDate.placeholder = "Select interview start date";
          }
          if (schema.properties?.endDate) {
            schema.properties.endDate.placeholder = "Select interview end date";
          }
          if (schema.properties?.startTime) {
            schema.properties.startTime.placeholder = "Select start time";
          }
          if (schema.properties?.endTime) {
            schema.properties.endTime.placeholder = "Select end time";
          }
          if (schema.properties?.timezone) {
            delete schema.properties.timezone;
          }

          return {
            name: t.name,
            description: t.description ?? "",
            inputSchema: schema,
          };
        }).filter(Boolean);
      });
      return Response.json({ server: "devspark-recruiter v1.0.0", tools });
    }

    if (body.op === "call" && body.name) {
      // schedule_interview and send_bulk_invites need an actor; attribute to the logged-in user.
      const args = { ...(body.args ?? {}) };
      if (body.name === "schedule_interview" && !args.sentById) args.sentById = user.id;
      if (body.name === "send_bulk_invites" && !args.sentById) args.sentById = user.id;

      const result = await withMcp(async (client) => {
        const r = await client.callTool({ name: body.name as string, arguments: args });
        return {
          isError: Boolean(r.isError),
          text: extractText(r.content),
          structuredContent: "structuredContent" in r ? r.structuredContent : undefined,
        };
      });
      return Response.json(result);
    }

    return Response.json({ error: "Unknown op. Use 'list' or 'call'." }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "MCP console error" },
      { status: 500 }
    );
  }
}
