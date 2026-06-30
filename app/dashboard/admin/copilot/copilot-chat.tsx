"use client";

import { useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

type ToolTraceItem = { tool: string; args: unknown };

export function CopilotChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTools, setLastTools] = useState<ToolTraceItem[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setLastTools([]);
    setLoading(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Copilot request failed.");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply || "(no answer)" }]);
        setLastTools(data.toolTrace || []);
      }
    } catch {
      setError("Network error talking to the copilot.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
      <div className="flex h-[460px] flex-col gap-3 overflow-y-auto rounded-2xl border border-amber-200 bg-white/60 p-4">
        {messages.length === 0 && (
          <p className="m-auto text-sm text-slate-500">
            Start by asking about jobs, candidates, or hiring stats.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-auto bg-teal-600 text-white"
                : "mr-auto border border-amber-200 bg-white text-slate-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="mr-auto rounded-2xl border border-amber-200 bg-white px-4 py-2 text-sm text-slate-500">
            Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {lastTools.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Tools used: {lastTools.map((t) => t.tool).join(", ")}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the recruiter copilot…"
          className="flex-1 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm outline-none focus:border-teal-400"
          disabled={loading}
        />
        <button type="submit" className="btn-main" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </article>
  );
}
