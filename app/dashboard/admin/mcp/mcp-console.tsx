"use client";

import { useEffect, useMemo, useState } from "react";

type JsonSchema = {
  type?: string;
  properties?: Record<
    string,
    {
      type?: string;
      description?: string;
      enum?: string[];
      enumLabels?: string[];
      placeholder?: string;
    }
  >;
  required?: string[];
};
type Tool = { name: string; description: string; inputSchema: JsonSchema };

export function McpConsole() {
  const [server, setServer] = useState<string>("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tool = useMemo(() => tools.find((t) => t.name === selected), [tools, selected]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/mcp-console", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "list" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to list tools");
        setServer(data.server);
        setTools(data.tools);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to connect to MCP server");
      }
    })();
  }, []);

  function pick(name: string) {
    setSelected(name);
    setForm({});
    setResult("");
    setError(null);
  }

  async function run() {
    if (!tool) return;
    setRunning(true);
    setError(null);
    setResult("");

    // Coerce form strings into typed args by the tool's schema.
    const props = tool.inputSchema.properties ?? {};
    const args: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(form)) {
      if (val === "" || val == null) continue;
      const t = props[key]?.type;
      if (t === "number" || t === "integer") args[key] = Number(val);
      else if (t === "boolean") args[key] = val === "true";
      else args[key] = val;
    }

    try {
      const res = await fetch("/api/mcp-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "call", name: tool.name, args }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tool call failed");
      const payload = data.structuredContent ?? data.text ?? data;
      setResult(typeof payload === "string" ? payload : JSON.stringify(payload, null, 2));
      if (data.isError) setError("Tool returned an error (see output).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tool call failed");
    } finally {
      setRunning(false);
    }
  }

  const props = tool?.inputSchema.properties ?? {};
  const required = new Set(tool?.inputSchema.required ?? []);

  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
      <div className="flex items-center gap-2 text-sm">
        <span className={`inline-block h-2 w-2 rounded-full ${server ? "bg-lime-400" : "bg-slate-700"}`} />
        <span className="text-slate-400">
          {server ? `Connected — ${server} · ${tools.length} tools` : "Connecting to MCP server…"}
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Tool list */}
        <div className="space-y-2">
          {tools.map((t) => (
            <button
              key={t.name}
              onClick={() => pick(t.name)}
              className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                selected === t.name
                  ? "border-lime-500/50 bg-slate-800"
                  : "border-transparent bg-transparent hover:border-slate-700 hover:bg-slate-800/50"
              }`}
            >
              <span className="font-mono font-semibold text-white">{t.name}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{t.description}</span>
            </button>
          ))}
        </div>

        {/* Tool runner */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          {!tool && <p className="text-sm text-slate-500">Select a tool on the left to run it.</p>}

          {tool && (
            <>
              <h3 className="font-mono text-lg font-semibold text-white">{tool.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{tool.description}</p>

              <div className="mt-4 space-y-3">
                {Object.keys(props).length === 0 && (
                  <p className="text-xs text-slate-500">No inputs — just run it.</p>
                )}
                {Object.entries(props).map(([key, schema]) => {
                  const hiddenField = tool?.name === "send_bulk_invites" && (key === "sentById" || key === "customMessage");
                  if (hiddenField) return null;
                  if (key === "timezone") return null;

                  const fieldType =
                    key.toLowerCase().includes("date")
                      ? "date"
                      : key.toLowerCase().includes("time")
                      ? "time"
                      : schema.type === "number" || schema.type === "integer"
                      ? "number"
                      : schema.type === "boolean"
                      ? "checkbox"
                      : "text";

                  return (
                    <label key={key} className="block text-sm">
                      <span className="font-medium text-slate-300">
                        {key}
                        {required.has(key) && <span className="text-rose-500"> *</span>}
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          {schema.type ?? "string"}
                        </span>
                      </span>
                      {schema.enum ? (
                        <select
                          value={form[key] ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
                        >
                          <option value="">Select {key}...</option>
                          {schema.enum.map((opt, index) => (
                            <option key={opt} value={opt}>
                              {schema.enumLabels?.[index] || opt}
                            </option>
                          ))}
                        </select>
                      ) : fieldType === "date" || fieldType === "time" || fieldType === "number" ? (
                        <input
                          type={fieldType}
                          value={form[key] ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={schema.placeholder ?? schema.description ?? key}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
                        />
                      ) : fieldType === "checkbox" ? (
                        <input
                          type="checkbox"
                          checked={form[key] === "true"}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked ? "true" : "false" }))}
                          className="mt-2 h-4 w-4 rounded border-slate-700 bg-slate-950 text-lime-400 focus:ring-lime-400/20"
                        />
                      ) : (
                        <input
                          type="text"
                          value={form[key] ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={schema.placeholder ?? schema.description ?? key}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
                        />
                      )}
                    </label>
                  );
                })}
              </div>

              <button onClick={run} disabled={running} className="btn-main mt-4">
                {running ? "Running…" : "Run tool"}
              </button>

              {error && (
                <p className="mt-3 rounded-xl border border-rose-900 bg-rose-950 px-3 py-2 text-sm text-rose-400">
                  {error}
                </p>
              )}
              {result && (
                <pre className="mt-3 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs text-emerald-200">
                  {result}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
