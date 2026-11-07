import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DEFENSE_QUESTIONS, DEFENSE_CATEGORIES } from "../data/mockDefenseQuestions.js";
import { saveDefenseSession, getDefenseSessions } from "../db.js";
import { ChevronLeft, ChevronRight, Shield, CheckCircle, RotateCcw } from "lucide-react";

function categoryColor(id) {
  const map = {
    math_foundations: "text-gold border-gold/30 bg-gold/10",
    methodology: "text-sage border-sage/30 bg-sage/10",
    results: "text-blue-300 border-blue-300/30 bg-blue-300/10",
    limitations: "text-terracotta border-terracotta/30 bg-terracotta/10",
    big_picture: "text-purple-300 border-purple-300/30 bg-purple-300/10",
  };
  return map[id] || "text-ivory/60 border-white/10 bg-white/5";
}

function QuestionRunner({ questions, onFinish }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selfRating, setSelfRating] = useState(null); // "good" | "partial" | "missed"
  const [scores, setScores] = useState([]);
  const textRef = useRef(null);

  const q = questions[index];
  const isLast = index === questions.length - 1;

  function rate(rating) {
    setSelfRating(rating);
    setScores((s) => [...s, { id: q.id, rating }]);
  }

  function next() {
    if (isLast) {
      const session = {
        total: questions.length,
        scores: [...scores, selfRating ? null : null].filter(Boolean),
      };
      saveDefenseSession({ questions: questions.map((q) => q.id), scores });
      onFinish(scores);
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
      setSelfRating(null);
    }
  }

  const cat = DEFENSE_CATEGORIES.find((c) => c.id === q.category);

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-xs text-ivory/40">
          {index + 1} / {questions.length}
        </div>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Category badge */}
      <div className="mb-4">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border ${categoryColor(q.category)}`}
        >
          {cat?.icon} {cat?.label}
        </span>
        <span
          className={`ml-2 text-xs px-2 py-1 rounded-full ${
            q.difficulty === "hard"
              ? "text-terracotta bg-terracotta/10"
              : q.difficulty === "medium"
              ? "text-gold bg-gold/10"
              : "text-sage bg-sage/10"
          }`}
        >
          {q.difficulty}
        </span>
      </div>

      {/* Question */}
      <div className="rounded-xl bg-navy-800/60 border border-white/10 p-6 mb-6">
        <div className="flex gap-3">
          <Shield size={18} className="text-gold shrink-0 mt-1" />
          <p className="text-base text-ivory/90 leading-relaxed font-medium">
            {q.question}
          </p>
        </div>
      </div>

      {/* Answer area */}
      {!revealed ? (
        <div className="space-y-4">
          <textarea
            ref={textRef}
            placeholder="Draft your answer here before revealing the key points…"
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-ivory/80 text-sm placeholder-ivory/25 focus:outline-none focus:border-gold/50 resize-none"
          />
          <button
            onClick={() => setRevealed(true)}
            className="w-full py-3 rounded-xl bg-gold/20 border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/30 transition-colors"
          >
            Reveal key points & sample answer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Key points */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <div className="text-xs font-semibold text-gold/70 uppercase tracking-widest mb-3">
              Key Points
            </div>
            <ul className="space-y-2">
              {q.keyPoints.map((pt, i) => (
                <li key={i} className="flex gap-3 text-sm text-ivory/75">
                  <CheckCircle size={14} className="text-gold/60 shrink-0 mt-0.5" />
                  <span className="leading-snug">{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sample answer */}
          <div className="rounded-xl bg-gold/5 border border-gold/15 p-5">
            <div className="text-xs font-semibold text-gold/70 uppercase tracking-widest mb-3">
              Sample Answer
            </div>
            <p className="text-sm text-ivory/75 leading-relaxed">{q.sampleAnswer}</p>
          </div>

          {/* Self-rating */}
          <div>
            <div className="text-xs text-ivory/40 mb-3 text-center">How well did you cover it?</div>
            <div className="flex gap-3">
              {[
                { id: "good", label: "Covered it well", color: "border-green-400/40 bg-green-400/10 text-green-300" },
                { id: "partial", label: "Mostly got it", color: "border-gold/40 bg-gold/10 text-gold" },
                { id: "missed", label: "Need more work", color: "border-terracotta/40 bg-terracotta/10 text-terracotta" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => rate(r.id)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${r.color} ${
                    selfRating === r.id ? "ring-2 ring-offset-1 ring-offset-navy ring-current" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={next}
            className="w-full py-3 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
          >
            {isLast ? "Finish Session" : "Next Question"}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function SessionSummary({ scores, total, onRestart }) {
  const good = scores.filter((s) => s.rating === "good").length;
  const partial = scores.filter((s) => s.rating === "partial").length;
  const missed = scores.filter((s) => s.rating === "missed").length;
  const pct = total > 0 ? Math.round(((good + partial * 0.5) / total) * 100) : 0;

  return (
    <div className="text-center">
      <div className="text-5xl font-bold text-gold mb-2">{pct}%</div>
      <div className="text-ivory/50 text-sm mb-8">Session score (full credit for "covered it well")</div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-green-400/10 border border-green-400/20 p-4">
          <div className="text-2xl font-bold text-green-300">{good}</div>
          <div className="text-xs text-ivory/50 mt-1">Covered well</div>
        </div>
        <div className="rounded-xl bg-gold/10 border border-gold/20 p-4">
          <div className="text-2xl font-bold text-gold">{partial}</div>
          <div className="text-xs text-ivory/50 mt-1">Mostly got it</div>
        </div>
        <div className="rounded-xl bg-terracotta/10 border border-terracotta/20 p-4">
          <div className="text-2xl font-bold text-terracotta">{missed}</div>
          <div className="text-xs text-ivory/50 mt-1">Need more work</div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-gold/20 border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/30 transition-colors"
      >
        <RotateCcw size={16} />
        New Session
      </button>
    </div>
  );
}

export default function MockDefense() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("setup"); // "setup" | "running" | "summary"
  const [selectedCats, setSelectedCats] = useState(["methodology", "results", "limitations"]);
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [finalScores, setFinalScores] = useState([]);

  function toggleCat(id) {
    setSelectedCats((s) =>
      s.includes(id) ? s.filter((c) => c !== id) : [...s, id]
    );
  }

  function startSession() {
    const pool = DEFENSE_QUESTIONS.filter((q) =>
      selectedCats.length === 0 || selectedCats.includes(q.category)
    );
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, Math.min(count, pool.length)));
    setPhase("running");
  }

  function handleFinish(scores) {
    setFinalScores(scores);
    setPhase("summary");
  }

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <button
        onClick={() => navigate("/academy")}
        className="flex items-center gap-1 text-ivory/40 hover:text-ivory text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Dashboard
      </button>

      <h1 className="text-2xl font-bold text-ivory mb-1">Mock Defense Simulator</h1>
      <p className="text-ivory/50 text-sm mb-8">
        Practice with committee questions tied to your actual thesis — math, methodology, results,
        limitations, and big-picture contributions.
      </p>

      {phase === "setup" && (
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-ivory/40 mb-3">
              Question Categories
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedCats.includes(cat.id)
                      ? categoryColor(cat.id)
                      : "border-white/10 text-ivory/40 hover:text-ivory"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-ivory/40 mb-3">
              Number of Questions
            </div>
            <div className="flex gap-3">
              {[3, 5, 8, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    count === n
                      ? "bg-gold text-navy border-gold"
                      : "border-white/10 text-ivory/60 hover:text-ivory"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            disabled={selectedCats.length === 0}
            className="w-full py-4 rounded-xl bg-gold text-navy font-bold text-sm disabled:opacity-30 hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
          >
            <Shield size={16} /> Start Mock Defense
          </button>

          {/* Past sessions */}
          {getDefenseSessions().length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-ivory/40 mb-3">
                Recent Sessions
              </div>
              <div className="space-y-2">
                {getDefenseSessions()
                  .slice(-3)
                  .reverse()
                  .map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white/5 border border-white/8 px-4 py-3 flex justify-between text-sm"
                    >
                      <span className="text-ivory/60">
                        {new Date(s.timestamp).toLocaleDateString()} —{" "}
                        {s.questions?.length || 0} questions
                      </span>
                      <span className="text-ivory/40 text-xs">
                        {s.scores?.filter((r) => r.rating === "good").length || 0} /{" "}
                        {s.questions?.length || 0} strong
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "running" && (
        <QuestionRunner
          questions={questions}
          onFinish={handleFinish}
        />
      )}

      {phase === "summary" && (
        <SessionSummary
          scores={finalScores}
          total={questions.length}
          onRestart={() => {
            setPhase("setup");
            setFinalScores([]);
          }}
        />
      )}
    </div>
  );
}
