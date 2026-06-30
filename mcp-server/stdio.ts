// Stdio entry point for the DevSpark MCP server.
// Run with: npm run mcp:stdio  (or wire it into Claude Desktop — see README/MCP docs).
// `dotenv/config` MUST be imported first so Prisma sees DATABASE_URL.
import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createDevSparkMcpServer } from "./server";

async function main() {
  const server = createDevSparkMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep all diagnostics on stderr — stdout is reserved for JSON-RPC.
  console.error("DevSpark MCP server running on stdio.");
}

main().catch((error) => {
  console.error("Failed to start DevSpark MCP server:", error);
  process.exit(1);
});
