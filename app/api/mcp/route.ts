// Streamable HTTP transport for the DevSpark MCP server.
//
// Exposing the same server over HTTP lets the app's own MCP client
// (lib/mcp-client.ts) connect by setting MCP_SERVER_URL to this route, which
// makes scheduleTopKInterviewsWithMcpAction run in real "mcp" mode.
//
// Stateless mode (sessionIdGenerator: undefined): one server + transport per
// request, which is the documented pattern for serverless route handlers.
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { createDevSparkMcpServer } from "@/mcp-server/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: Request): Promise<Response> {
  const server = createDevSparkMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
