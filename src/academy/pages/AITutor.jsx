/**
 * AI Socratic Tutor — frontend
 * Calls /.netlify/functions/tutor (server-side proxy — no API key in browser)
 *
 * Modes:
 *   explain   — first-principles explanation
 *   derive    — step-by-step mathematical derivation
 *   challenge — Socratic question (tutor asks, student thinks)
 *   hint      — one nudge without the full answer
 *   test      — committee-style exam question
 */
import React, { useState, useRef, useEffect } from "react";
import { MATH_LESSONS } from "../data/mathLessons.js";
import { MATH_LESSONS_2 } from "../data/mathLessons2.js";
import { Bot, Send, Zap, BookOpen, HelpCircle, Lightbulb, GraduationCap, AlertTriangle } from "lucide-react";

const ALL_LESSONS = [...MATH_LESSONS, ...MATH_LESSONS_2];

const MODES = [
  { id: "explain",   label: "Explain",   icon: BookOpen,     color: "text-gold",        desc: "First principles + thesis connection" },
  { id: "derive",    label: "Derive",    icon: Zap,          color: "text-sage",         desc: "Mathematical step-by-step" },
  { id: "challenge", label: "Challenge", icon: HelpCircle,   color: "text-terracotta",   desc: "Socratic question from tutor" },
  { id: "hint",      label: "Hint",      icon: Lightbulb,    color: "text-gold",         desc: "One nudge without the answer" },
  { id: "test",      label: "Test me",   icon: GraduationCap,color: "text-terracotta",   desc: "Committee-style exam question" },
];

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 mb-6 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-gold/20" : "bg-sage/20"
        }`}
      >
        {isUser ? (
          <span className="text-gold text-xs font-bold">You</span>
        ) : (
          <Bot size={14} className="text-sage" />
        )}
      </div>
      <div
        className={`flex-1 rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gold/15 border border-gold/20 text-ivory rounded-tr-sm"
            : "bg-white/5 border border-white/10 text-ivory/85 rounded-tl-sm"
        }`}
      >
        {msg.role === "assistant" ? (
          <FormattedResponse text={msg.content} />
        ) : (
          msg.content
        )}
      </div>
    </div>
  );
}

function FormattedResponse({ text }) {
  // Format labeled sections: [THESIS DATA], [GENERAL MATH], [GENERATED EXAMPLE], [DEFENSE TIP]
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("[THESIS DATA]")) {
          return (
            <div key={i} className="rounded-lg bg-gold/10 border border-gold/20 px-3 py-2 text-xs">
              <span className="text-gold font-semibold text-xs uppercase tracking-wider">Thesis Data</span>
              <br />
              {line.replace("[THESIS DATA]", "").trim()}
            </div>
          );
        }
        if (line.startsWith("[DEFENSE TIP]")) {
          return (
            <div key={i} className="rounded-lg bg-terracotta/10 border border-terracotta/20 px-3 py-2 text-xs">
              <span className="text-terracotta font-semibold text-xs uppercase tracking-wider">Defense Tip</span>
              <br />
              {line.replace("[DEFENSE TIP]", "").trim()}
            </div>
          );
        }
        if (line.startsWith("[GENERATED EXAMPLE]")) {
          return (
            <div key={i} className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-xs">
              <span className="text-ivory/40 font-semibold text-xs uppercase tracking-wider">Generated Example (not thesis data)</span>
              <br />
              {line.replace("[GENERATED EXAMPLE]", "").trim()}
            </div>
          );
        }
        if (line.startsWith("[GENERAL MATH]")) {
          return (
            <div key={i} className="text-ivory/80 text-sm">
              {line.replace("[GENERAL MATH]", "").trim()}
            </div>
          );
        }
        return line ? <p key={i}>{line}</p> : <br key={i} />;
      })}
    </div>
  );
}

export default function AITutor() {
  const [selectedTopic, setSelectedTopic] = useState(ALL_LESSONS[0]?.id || "");
  const [mode, setMode] = useState("explain");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!question.trim()) return;
    setError("");

    const lesson = ALL_LESSONS.find((l) => l.id === selectedTopic);
    const userMsg = { role: "user", content: question, mode, topic: lesson?.title };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/.netlify/functions/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          topic: lesson?.title || selectedTopic,
          question,
          context: { thesisValues: null, currentLesson: lesson?.title },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Tutor unavailable");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, mode },
      ]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1)); // remove unanswered user msg
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
  }

  const activeModeInfo = MODES.find((m) => m.id === mode);

  return (
    <div className="max-w-2xl mx-auto pb-16 flex flex-col" style={{ minHeight: "80vh" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ivory mb-1">AI Socratic Tutor</h1>
        <p className="text-ivory/50 text-sm">
          Guided by your verified thesis data. AI responses are clearly labeled —
          <span className="text-gold"> [THESIS DATA]</span> vs.
          <span className="text-ivory/40"> [GENERAL MATH]</span> vs.
          <span className="text-ivory/30"> [GENERATED EXAMPLE]</span>.
        </p>
      </div>

      {/* Config row */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Topic selector */}
        <div>
          <label className="text-xs text-ivory/40 mb-1 block">Topic</label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/15 text-ivory text-sm
              focus:outline-none focus:border-gold/50 transition-colors"
          >
            <optgroup label="Phase 1 — Core Methods">
              {MATH_LESSONS.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </optgroup>
            <optgroup label="Phase 2 — Advanced Mathematics">
              {MATH_LESSONS_2.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Mode pills */}
        <div>
          <label className="text-xs text-ivory/40 mb-1 block">Mode</label>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all border ${
                    mode === m.id
                      ? "border-gold/40 bg-gold/15 text-gold"
                      : "border-white/10 text-ivory/40 hover:border-white/25 hover:text-ivory/70"
                  }`}
                >
                  <Icon size={12} />
                  {m.label}
                </button>
              );
            })}
          </div>
          {activeModeInfo && (
            <p className="text-xs text-ivory/30 mt-1">{activeModeInfo.desc}</p>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-terracotta/10 border border-terracotta/20 px-4 py-2.5 flex gap-2 text-xs text-terracotta/80 mb-4">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          AI-generated content — verify math against your thesis and committee.
          Thesis numbers labeled <strong>[THESIS DATA]</strong> come from your verified dataset.
        </span>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-h-64 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-ivory/20 text-sm">
            <Bot size={40} className="mx-auto mb-3 opacity-30" />
            Ask your first question above…
            <br />
            <span className="text-xs">Tip: Try "What does RMSEA=0.098 actually mean?" in Explain mode</span>
          </div>
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
        )}

        {loading && (
          <div className="flex gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center">
              <Bot size={14} className="text-sage" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-terracotta/10 border border-terracotta/30 px-4 py-3 text-sm text-terracotta mb-4">
            {error}
            {error.includes("not configured") && (
              <div className="mt-2 text-xs text-terracotta/60">
                Add ANTHROPIC_API_KEY to Netlify environment variables to enable the AI tutor.
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 sticky bottom-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            mode === "challenge"
              ? "Start the challenge — press send and the tutor will ask you a question"
              : mode === "test"
              ? "What topic should I be tested on? (or just press Send)"
              : "Ask your question… (Ctrl+Enter to send)"
          }
          rows={2}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-ivory text-sm
            placeholder:text-ivory/25 focus:outline-none focus:border-gold/40 transition-colors resize-none"
        />
        <button
          onClick={send}
          disabled={loading || (!question.trim() && !["challenge", "test"].includes(mode))}
          className="px-4 py-3 rounded-xl bg-gold text-navy font-semibold disabled:opacity-30
            hover:bg-gold/90 transition-all flex items-center gap-2 self-end"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-xs text-ivory/20 text-center mt-2">Ctrl+Enter to send</p>
    </div>
  );
}
