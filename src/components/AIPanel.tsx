"use client";

import { useState } from "react";
import type { RugSpec, PatchOp } from "@/lib/types";

interface Props {
  spec: RugSpec | null;
  apiKey: string;
  onApiKeyChange: (k: string) => void;
  onApplyPatches: (ops: PatchOp[], explanation: string) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIPanel({ spec, apiKey, onApiKeyChange, onApplyPatches }: Props) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  async function handleSend() {
    if (!prompt.trim() || !spec) return;
    if (!apiKey) {
      setError("Enter your OpenRouter API key first.");
      return;
    }

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((m) => [...m, userMessage]);
    setPrompt("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, spec, apiKey }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "AI request failed.");
        return;
      }

      const explanation: string = data.explanation ?? "Changes applied.";
      setMessages((m) => [...m, { role: "assistant", content: explanation }]);
      onApplyPatches(data.ops ?? [], explanation);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <h3 className="text-amber-300 font-serif text-sm font-semibold uppercase tracking-widest">
        AI Design Assistant
      </h3>

      {/* API Key input */}
      <div>
        <div className="text-amber-500 text-xs mb-1">OpenRouter API Key</div>
        <div className="flex gap-1">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="sk-or-..."
            className="flex-1 bg-black/30 border border-amber-800/40 rounded-lg px-3 py-1.5 text-amber-100 text-xs focus:outline-none focus:border-amber-500 font-mono"
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            className="text-amber-600 hover:text-amber-400 px-2 text-xs"
          >
            {showKey ? "hide" : "show"}
          </button>
        </div>
        <div className="text-amber-700 text-[10px] mt-0.5">
          Key is never stored — only sent to openrouter.ai
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px] max-h-[200px] bg-black/20 rounded-lg p-2">
        {messages.length === 0 && (
          <div className="text-amber-700 text-xs italic text-center pt-4">
            Describe a change, e.g. "make the border less busy" or "add more leaves"
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-xs ${
              m.role === "user"
                ? "bg-amber-900/40 text-amber-100 ml-4"
                : "bg-stone-800/60 text-amber-300 mr-4 italic"
            }`}
          >
            <span className="font-bold mr-1">{m.role === "user" ? "You:" : "AI:"}</span>
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="text-amber-500 text-xs italic animate-pulse text-center">
            Consulting the master weaver…
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Prompt input */}
      <div className="flex gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          placeholder="e.g. make the leaves larger and rounder…"
          rows={2}
          disabled={!spec || loading}
          className="flex-1 bg-black/30 border border-amber-800/40 rounded-lg px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 resize-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!spec || loading || !prompt.trim()}
          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-3 text-xs font-bold transition-colors"
        >
          Send
        </button>
      </div>

      {/* Quick prompts */}
      <div>
        <div className="text-amber-700 text-[10px] uppercase tracking-wide mb-1">Quick edits</div>
        <div className="flex flex-wrap gap-1">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp}
              onClick={() => setPrompt(qp)}
              disabled={!spec}
              className="text-[10px] bg-amber-900/30 hover:bg-amber-800/50 border border-amber-900/40 rounded px-2 py-0.5 text-amber-400 hover:text-amber-200 transition-colors disabled:opacity-30"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  "Make the border simpler",
  "Add more vine density",
  "Bigger medallion",
  "Remove the medallion",
  "Make leaves rounder",
  "Increase variation",
  "Make it more geometric",
  "Wider border",
  "More flower complexity",
  "Regenerate only the field",
];
