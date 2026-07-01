import { Role } from "@prisma/client";

import { requireRole } from "@/lib/guards";
import { McpConsole } from "./mcp-console";

export const dynamic = "force-dynamic";

export default async function McpConsolePage() {
  await requireRole([Role.ADMIN, Role.RECRUITER]);

  return (
    <div className="space-y-6">
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-3xl font-bold text-white">MCP Console</h1>
        <p className="mt-1 text-sm text-slate-400">
          Live view of the DevSpark <strong>Model Context Protocol</strong> server. Pick a
          tool, fill its inputs, and run it — every call goes through the real MCP protocol,
          the same server the AI Copilot and external clients use.
        </p>
      </article>

      <McpConsole />
    </div>
  );
}
