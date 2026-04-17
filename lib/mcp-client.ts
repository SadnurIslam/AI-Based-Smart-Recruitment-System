import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type McpClientTransport = SSEClientTransport | StreamableHTTPClientTransport;

export type McpToolCallResult = {
  isError: boolean;
  text: string;
  structuredContent: unknown;
  raw: unknown;
};

function getMcpServerUrl() {
  const value = process.env.MCP_SERVER_URL?.trim();
  return value ? new URL(value) : null;
}

function getTransportType() {
  const configured = process.env.MCP_TRANSPORT?.trim().toLowerCase();
  return configured === "sse" ? "sse" : "streamable-http";
}

function getRequestInit(): RequestInit {
  const headers: Record<string, string> = {};

  if (process.env.MCP_AUTH_TOKEN?.trim()) {
    headers.Authorization = `Bearer ${process.env.MCP_AUTH_TOKEN.trim()}`;
  }

  if (process.env.MCP_API_KEY?.trim()) {
    headers["x-api-key"] = process.env.MCP_API_KEY.trim();
  }

  return {
    headers,
  };
}

function createTransport(url: URL): McpClientTransport {
  const requestInit = getRequestInit();

  if (getTransportType() === "sse") {
    return new SSEClientTransport(url, { requestInit });
  }

  return new StreamableHTTPClientTransport(url, { requestInit });
}

async function withMcpClient<T>(
  handler: (client: Client, transport: McpClientTransport) => Promise<T>
): Promise<T> {
  const serverUrl = getMcpServerUrl();

  if (!serverUrl) {
    throw new Error("MCP_SERVER_URL is missing. Configure it in environment variables.");
  }

  const client = new Client(
    {
      name: "devspark-interview-copilot",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  const transport = createTransport(serverUrl);
  await client.connect(transport);

  try {
    return await handler(client, transport);
  } finally {
    await client.close().catch(() => undefined);
    await transport.close().catch(() => undefined);
  }
}

function extractText(rawContent: unknown) {
  if (!Array.isArray(rawContent)) {
    return "";
  }

  return rawContent
    .filter(
      (item): item is { type: "text"; text: string } =>
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        (item as { type?: unknown }).type === "text" &&
        "text" in item &&
        typeof (item as { text?: unknown }).text === "string"
    )
    .map((item) => item.text)
    .join("\n")
    .trim();
}

export function isMcpConfigured() {
  return Boolean(getMcpServerUrl());
}

export async function listMcpTools() {
  return withMcpClient(async (client) => {
    const response = await client.listTools();
    return response.tools.map((tool) => tool.name);
  });
}

export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<McpToolCallResult> {
  return withMcpClient(async (client) => {
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    return {
      isError: Boolean(result.isError),
      text: extractText(result.content),
      structuredContent: "structuredContent" in result ? result.structuredContent : undefined,
      raw: result,
    };
  });
}
