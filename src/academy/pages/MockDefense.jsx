import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shuffle,
  BookOpen,
  Swords,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  RotateCcw,
  Download,
  Star,
  Tag,
  Filter,
  Trophy,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  DEFENSE_QUESTIONS,
  DEFENSE_CATEGORIES,
} from "../data/mockDefenseQuestions";
import {
  saveDefenseSession,
  getDefenseSessions,
  getQuestionMastery,
  setQuestionMastery,
  getAllMastery,
} from "../db";

// ── Utility ───────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DIFFICULTY_COLORS = {
  easy: { bg: "bg-green-900/30", text: "text-green-400", label: "Easy" },
  medium: { bg: "bg-yellow-900/30", text: "text-yellow-400", label: "Medium" },
  hard: { bg: "bg-red-900/30", text: "text-red-400", label: "Hard" },
};

const CAT_COLORS = {
  big_picture: "#7C6E9E",
  methodology: "#4A90A4",
  math_foundations: "#2E7D6F",
  results: "#B07A30",
  limitations: "#A04040",
};

// ── PowerPoint Card ───────────────────────────────────────────────────────
function PowerPointCard() {
  const btnStyle = {
    color: "#fff",
    padding: "8px 18px",
    borderRadius: 8,
    fontSize: "0.82rem",
    fontWeight: 600,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
  };
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1a1035 0%, #0d1f2d 100%)",
        border: "1px solid rgba(176,122,48,0.4)",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      {/* Slides row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ color: "#D4A456", fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>
            📊 Defense Presentation
          </div>
          <div style={{ color: "#a0aec0", fontSize: "0.82rem" }}>
            F90_Defense_Final_Revised.pptx — final revised deck with presenter notes &amp; committee Q&amp;A
          </div>
        </div>
        <a href="/F90_Defense_Final_Revised.pptx" download style={{ ...btnStyle, background: "#B07A30" }}>
          <Download size={14} />
          Download Slides
        </a>
      </div>
      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: 14 }} />
      {/* Film row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ color: "#D4A456", fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>
            🎬 FIRST 90 Concept Film
          </div>
          <div style={{ color: "#a0aec0", fontSize: "0.82rem" }}>
            FIRST90_Defense_Burgundy_Edit_2.mp4 — insert into Slide 22 before your defense
          </div>
        </div>
        <a href="/FIRST90_Defense_Film.mp4" download style={{ ...btnStyle, background: "#5A1E30" }}>
          <Download size={14} />
          Download Film
        </a>
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────
function MasteryBar({ mastery }) {
  const known = Object.values(mastery).filter((v) => v === "known").length;
  const partial = Object.values(mastery).filter((v) => v === "partial").length;
  const total = DEFENSE_QUESTIONS.length;
  const pctKnown = (known / total) * 100;
  const pctPartial = (partial / total) * 100;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "14px 18px",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
          fontSize: "0.8rem",
          color: "#a0aec0",
        }}
      >
        <span>
          <span style={{ color: "#68D391", fontWeight: 700 }}>{known}</span>{" "}
          mastered ·{" "}
          <span style={{ color: "#F6E05E", fontWeight: 700 }}>{partial}</span>{" "}
          partial · {total - known - partial} untouched
        </span>
        <span style={{ fontWeight: 600 }}>
          {Math.round(((known + partial * 0.5) / total) * 100)}% ready
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 4,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          style={{
            width: `${pctKnown}%`,
            background: "#48BB78",
            transition: "width 0.4s ease",
          }}
        />
        <div
          style={{
            width: `${pctPartial}%`,
            background: "#ECC94B",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Rating Buttons ────────────────────────────────────────────────────────
function RatingButtons({ onRate, currentRating }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
      {[
        { key: "good", label: "✅ Nailed it", bg: "#2d6a4f", border: "#68D391" },
        { key: "partial", label: "🟡 Getting there", bg: "#5c4a00", border: "#ECC94B" },
        { key: "missed", label: "❌ Needs work", bg: "#6b2020", border: "#FC8181" },
      ].map(({ key, label, bg, border }) => (
        <button
          key={key}
          onClick={() => onRate(key)}
          style={{
            background: currentRating === key ? bg : "rgba(255,255,255,0.05)",
            border: `1px solid ${currentRating === key ? border : "rgba(255,255,255,0.15)"}`,
            color: currentRating === key ? "#fff" : "#a0aec0",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── FLASHCARD MODE ────────────────────────────────────────────────────────
function FlashcardMode({ questions, mastery, onMasteryUpdate }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rating, setRating] = useState(null);
  const [deck, setDeck] = useState(() => shuffle(questions));
  const [sessionRatings, setSessionRatings] = useState({});
  const [done, setDone] = useState(false);

  const current = deck[index];

  const handleFlip = () => setFlipped((f) => !f);

  const handleRate = (r) => {
    setRating(r);
    const newRatings = { ...sessionRatings, [current.id]: r };
    setSessionRatings(newRatings);
    if (r === "good") {
      setQuestionMastery(current.id, "known");
      onMasteryUpdate();
    } else if (r === "partial") {
      setQuestionMastery(current.id, "partial");
      onMasteryUpdate();
    }
  };

  const handleNext = () => {
    if (index + 1 >= deck.length) {
      const good = Object.values(sessionRatings).filter((r) => r === "good").length;
      const partial = Object.values(sessionRatings).filter((r) => r === "partial").length;
      saveDefenseSession({ mode: "flashcard", total: deck.length, good, partial });
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setFlipped(false);
      setRating(null);
    }
  };

  const handleRestart = () => {
    setDeck(shuffle(questions));
    setIndex(0);
    setFlipped(false);
    setRating(null);
    setSessionRatings({});
    setDone(false);
  };

  if (done) {
    const good = Object.values(sessionRatings).filter((r) => r === "good").length;
    const partial = Object.values(sessionRatings).filter((r) => r === "partial").length;
    const missed = Object.values(sessionRatings).filter((r) => r === "missed").length;
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <Trophy size={48} color="#D4A456" style={{ marginBottom: 16 }} />
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
          Session Complete!
        </div>
        <div style={{ color: "#a0aec0", marginBottom: 24 }}>
          {deck.length} questions · <span style={{ color: "#68D391" }}>{good} nailed</span> ·{" "}
          <span style={{ color: "#ECC94B" }}>{partial} partial</span> ·{" "}
          <span style={{ color: "#FC8181" }}>{missed} missed</span>
        </div>
        <button
          onClick={handleRestart}
          style={{
            background: "#B07A30",
            color: "#fff",
            border: "none",
            padding: "10px 24px",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "0 auto",
          }}
        >
          <RefreshCw size={16} />
          Go Again
        </button>
      </div>
    );
  }

  const diff = DIFFICULTY_COLORS[current.difficulty] || DIFFICULTY_COLORS.easy;
  const catColor = CAT_COLORS[current.category] || "#4A90A4";

  return (
    <div>
      {/* Progress */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          color: "#a0aec0",
          fontSize: "0.82rem",
        }}
      >
        <span>
          Card {index + 1} / {deck.length}
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          <span style={{ color: catColor, fontWeight: 600 }}>
            {DEFENSE_CATEGORIES.find((c) => c.id === current.category)?.label}
          </span>
          <span
            style={{
              background: "rgba(255,255,255,0.08)",
              padding: "1px 8px",
              borderRadius: 100,
              fontSize: "0.75rem",
            }}
          >
            {diff.label}
          </span>
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 4,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 2,
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${((index + 1) / deck.length) * 100}%`,
            height: "100%",
            background: "#B07A30",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={handleFlip}
        style={{
          perspective: 1000,
          cursor: "pointer",
          marginBottom: 16,
          minHeight: 280,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            minHeight: 280,
            transformStyle: "preserve-3d",
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              minHeight: 280,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "linear-gradient(135deg, #1a1f35 0%, #0d1520 100%)",
              border: `1px solid ${catColor}40`,
              borderRadius: 14,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: catColor,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 16,
              }}
            >
              Q{current.id.replace("defense_", "")} · Click to reveal answer
            </div>
            <div
              style={{
                fontSize: "1.05rem",
                color: "#e2e8f0",
                lineHeight: 1.65,
                fontWeight: 500,
              }}
            >
              {current.question}
            </div>
            {current.hint && (
              <div
                style={{
                  marginTop: 16,
                  padding: "8px 12px",
                  background: "rgba(176,122,48,0.12)",
                  border: "1px solid rgba(176,122,48,0.25)",
                  borderRadius: 6,
                  fontSize: "0.78rem",
                  color: "#D4A456",
                }}
              >
                💡 {current.hint}
              </div>
            )}
          </div>

          {/* Back */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              minHeight: 280,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #0d2015 0%, #0a1a10 100%)",
              border: "1px solid rgba(72,187,120,0.3)",
              borderRadius: 14,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: "#68D391",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 14,
              }}
            >
              Model Answer
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {current.keyPoints.map((pt, i) => (
                <li
                  key={i}
                  style={{
                    color: "#cbd5e0",
                    fontSize: "0.88rem",
                    lineHeight: 1.6,
                    marginBottom: 8,
                  }}
                >
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {!flipped && (
        <div style={{ textAlign: "center", color: "#718096", fontSize: "0.8rem" }}>
          Tap card to flip
        </div>
      )}

      {flipped && (
        <>
          <RatingButtons onRate={handleRate} currentRating={rating} />
          {rating && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={handleNext}
                style={{
                  background: "#B07A30",
                  color: "#fff",
                  border: "none",
                  padding: "9px 24px",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.88rem",
                }}
              >
                {index + 1 >= deck.length ? "Finish Session" : "Next Card →"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── BATTLE MODE ───────────────────────────────────────────────────────────
function BattleMode({ questions, mastery, onMasteryUpdate }) {
  const [deck] = useState(() => shuffle(questions));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [rating, setRating] = useState(null);
  const [sessionRatings, setSessionRatings] = useState({});
  const [done, setDone] = useState(false);

  const current = deck[index];
  const catColor = CAT_COLORS[current?.category] || "#4A90A4";

  const handleReveal = () => setRevealed(true);

  const handleRate = (r) => {
    setRating(r);
    const newRatings = { ...sessionRatings, [current.id]: r };
    setSessionRatings(newRatings);
    if (r === "good") {
      setQuestionMastery(current.id, "known");
      onMasteryUpdate();
    } else if (r === "partial") {
      setQuestionMastery(current.id, "partial");
      onMasteryUpdate();
    }
  };

  const handleNext = () => {
    if (index + 1 >= deck.length) {
      const good = Object.values(sessionRatings).filter((r) => r === "good").length;
      const partial = Object.values(sessionRatings).filter((r) => r === "partial").length;
      saveDefenseSession({ mode: "battle", total: deck.length, good, partial });
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
      setRating(null);
    }
  };

  if (done) {
    const good = Object.values(sessionRatings).filter((r) => r === "good").length;
    const partial = Object.values(sessionRatings).filter((r) => r === "partial").length;
    const missed = Object.values(sessionRatings).filter((r) => r === "missed").length;
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <Trophy size={48} color="#D4A456" style={{ marginBottom: 16 }} />
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
          Defense Survived! 🎓
        </div>
        <div style={{ color: "#a0aec0", marginBottom: 24 }}>
          {deck.length} questions · <span style={{ color: "#68D391" }}>{good} nailed</span> ·{" "}
          <span style={{ color: "#ECC94B" }}>{partial} partial</span> ·{" "}
          <span style={{ color: "#FC8181" }}>{missed} missed</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #2d1515 0%, #1a0d0d 100%)",
          border: "1px solid rgba(252,129,129,0.25)",
          borderRadius: 10,
          padding: "12px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: "0.82rem",
          color: "#FC8181",
        }}
      >
        <Swords size={16} />
        <strong>Committee Battle</strong> — Questions come in random order, just like the real thing.
        <span style={{ marginLeft: "auto", color: "#a0aec0" }}>
          {index + 1}/{deck.length}
        </span>
      </div>

      {/* Question Card */}
      <div
        style={{
          background: "#0d1520",
          border: `1px solid ${catColor}40`,
          borderRadius: 14,
          padding: 28,
          marginBottom: 20,
          minHeight: 160,
        }}
      >
        <div
          style={{
            fontSize: "1.05rem",
            color: "#e2e8f0",
            lineHeight: 1.65,
            fontWeight: 500,
          }}
        >
          {current.question}
        </div>
        {current.hint && !revealed && (
          <div
            style={{
              marginTop: 14,
              fontSize: "0.78rem",
              color: "#D4A456",
              fontStyle: "italic",
            }}
          >
            💡 {current.hint}
          </div>
        )}
      </div>

      {!revealed ? (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleReveal}
            style={{
              background: "#2d6a4f",
              color: "#fff",
              border: "none",
              padding: "10px 28px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Eye size={16} />
            Show Answer
          </button>
        </div>
      ) : (
        <>
          {/* Answer */}
          <div
            style={{
              background: "rgba(72,187,120,0.08)",
              border: "1px solid rgba(72,187,120,0.25)",
              borderRadius: 10,
              padding: 20,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: "#68D391",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              Model Answer
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {current.keyPoints.map((pt, i) => (
                <li key={i} style={{ color: "#cbd5e0", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 8 }}>
                  {pt}
                </li>
              ))}
            </ul>
            {current.sampleAnswer && current.sampleAnswer.length > 100 && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  color: "#a0aec0",
                  fontSize: "0.82rem",
                  lineHeight: 1.65,
                }}
              >
                {current.sampleAnswer}
              </div>
            )}
          </div>

          <RatingButtons onRate={handleRate} currentRating={rating} />
          {rating && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={handleNext}
                style={{
                  background: "#B07A30",
                  color: "#fff",
                  border: "none",
                  padding: "9px 24px",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.88rem",
                }}
              >
                {index + 1 >= deck.length ? "End Battle" : "Next Question →"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── BROWSE MODE ───────────────────────────────────────────────────────────
function BrowseMode({ questions, mastery, onMasteryUpdate }) {
  const [expanded, setExpanded] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [filterDiff, setFilterDiff] = useState("all");
  const [onlyUnmastered, setOnlyUnmastered] = useState(false);

  const filtered = questions.filter((q) => {
    if (filterCat !== "all" && q.category !== filterCat) return false;
    if (filterDiff !== "all" && q.difficulty !== filterDiff) return false;
    if (onlyUnmastered && mastery[q.id] === "known") return false;
    return true;
  });

  const toggleExpand = (id) => setExpanded((e) => (e === id ? null : id));

  const toggleMastery = (q) => {
    const current = mastery[q.id];
    if (current === "known") {
      setQuestionMastery(q.id, null);
    } else {
      setQuestionMastery(q.id, "known");
    }
    onMasteryUpdate();
  };

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Filter size={14} color="#718096" />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e2e8f0",
            padding: "5px 10px",
            borderRadius: 6,
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          {DEFENSE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id} style={{ background: "#1a202c" }}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e2e8f0",
            padding: "5px 10px",
            borderRadius: 6,
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          <option value="all" style={{ background: "#1a202c" }}>All Difficulty</option>
          <option value="easy" style={{ background: "#1a202c" }}>Easy</option>
          <option value="medium" style={{ background: "#1a202c" }}>Medium</option>
          <option value="hard" style={{ background: "#1a202c" }}>Hard</option>
        </select>
        <button
          onClick={() => setOnlyUnmastered((v) => !v)}
          style={{
            background: onlyUnmastered ? "rgba(72,187,120,0.15)" : "rgba(255,255,255,0.07)",
            border: `1px solid ${onlyUnmastered ? "rgba(72,187,120,0.5)" : "rgba(255,255,255,0.15)"}`,
            color: onlyUnmastered ? "#68D391" : "#a0aec0",
            padding: "5px 12px",
            borderRadius: 6,
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Not mastered only
        </button>
        <span style={{ color: "#718096", fontSize: "0.8rem", marginLeft: "auto" }}>
          {filtered.length} questions
        </span>
      </div>

      {/* Question List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((q) => {
          const isExpanded = expanded === q.id;
          const qMastery = mastery[q.id];
          const catColor = CAT_COLORS[q.category] || "#4A90A4";
          const diff = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.easy;

          return (
            <div
              key={q.id}
              style={{
                background: qMastery === "known"
                  ? "rgba(72,187,120,0.06)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  qMastery === "known"
                    ? "rgba(72,187,120,0.25)"
                    : qMastery === "partial"
                    ? "rgba(236,201,75,0.25)"
                    : "rgba(255,255,255,0.08)"
                }`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* Row header */}
              <div
                onClick={() => toggleExpand(q.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: catColor,
                    fontWeight: 700,
                    minWidth: 30,
                  }}
                >
                  Q{q.id.replace("defense_", "")}
                </span>
                <span
                  style={{
                    flex: 1,
                    color: "#e2e8f0",
                    fontSize: "0.88rem",
                    lineHeight: 1.4,
                  }}
                >
                  {q.question}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {/* Mastery badge */}
                  {qMastery === "known" && (
                    <span style={{ fontSize: "0.72rem", color: "#68D391", fontWeight: 600 }}>
                      ✓ Known
                    </span>
                  )}
                  {qMastery === "partial" && (
                    <span style={{ fontSize: "0.72rem", color: "#ECC94B", fontWeight: 600 }}>
                      ~ Partial
                    </span>
                  )}
                  <span style={{ fontSize: "0.7rem", color: diff.text }}>
                    {diff.label}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} color="#718096" />
                  ) : (
                    <ChevronDown size={16} color="#718096" />
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  style={{
                    padding: "0 16px 16px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {q.hint && (
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "rgba(176,122,48,0.08)",
                        border: "1px solid rgba(176,122,48,0.2)",
                        borderRadius: 6,
                        fontSize: "0.78rem",
                        color: "#D4A456",
                        marginBottom: 12,
                        marginTop: 12,
                      }}
                    >
                      💡 {q.hint}
                    </div>
                  )}
                  <ul style={{ paddingLeft: 18, margin: "12px 0" }}>
                    {q.keyPoints.map((pt, i) => (
                      <li
                        key={i}
                        style={{
                          color: "#cbd5e0",
                          fontSize: "0.85rem",
                          lineHeight: 1.65,
                          marginBottom: 6,
                        }}
                      >
                        {pt}
                      </li>
                    ))}
                  </ul>
                  {q.sampleAnswer && q.sampleAnswer.length > 80 && (
                    <div
                      style={{
                        color: "#718096",
                        fontSize: "0.8rem",
                        lineHeight: 1.65,
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {q.sampleAnswer}
                    </div>
                  )}
                  {/* Mastery toggle */}
                  <button
                    onClick={() => toggleMastery(q)}
                    style={{
                      marginTop: 14,
                      background:
                        qMastery === "known"
                          ? "rgba(72,187,120,0.15)"
                          : "rgba(255,255,255,0.05)",
                      border: `1px solid ${
                        qMastery === "known"
                          ? "rgba(72,187,120,0.5)"
                          : "rgba(255,255,255,0.15)"
                      }`,
                      color: qMastery === "known" ? "#68D391" : "#a0aec0",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    {qMastery === "known" ? "✓ I know this" : "Mark as mastered"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function MockDefense() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | "flashcard" | "battle" | "browse"
  const [mastery, setMastery] = useState({});
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    setMastery(getAllMastery());
  }, []);

  const refreshMastery = useCallback(() => {
    setMastery(getAllMastery());
  }, []);

  const filteredQuestions =
    filterCategory === "all"
      ? DEFENSE_QUESTIONS
      : DEFENSE_QUESTIONS.filter((q) => q.category === filterCategory);

  const knownCount = Object.values(mastery).filter((v) => v === "known").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#e2e8f0",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a0d1a 0%, #0d1a2d 100%)",
          borderBottom: "1px solid rgba(176,122,48,0.2)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <button
          onClick={() => (mode ? setMode(null) : navigate("/academy"))}
          style={{
            background: "none",
            border: "none",
            color: "#a0aec0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.85rem",
          }}
        >
          <ArrowLeft size={18} />
          {mode ? "Back to Defense Hub" : "Academy"}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "#D4A456" }}>
            Defense Practice Hub
          </div>
          <div style={{ fontSize: "0.75rem", color: "#718096" }}>
            90 questions · {knownCount} mastered
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px" }}>
        <PowerPointCard />
        <MasteryBar mastery={mastery} />

        {/* Mode Selection */}
        {!mode && (
          <>
            <div
              style={{
                fontSize: "0.78rem",
                color: "#718096",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 14,
              }}
            >
              Choose Practice Mode
            </div>

            {/* Category filter (shown when selecting mode) */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {DEFENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  style={{
                    background:
                      filterCategory === cat.id
                        ? `${cat.color}25`
                        : "rgba(255,255,255,0.05)",
                    border: `1px solid ${
                      filterCategory === cat.id
                        ? cat.color
                        : "rgba(255,255,255,0.1)"
                    }`,
                    color: filterCategory === cat.id ? cat.color : "#718096",
                    padding: "5px 12px",
                    borderRadius: 100,
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {/* Flashcard */}
              <button
                onClick={() => setMode("flashcard")}
                style={{
                  background: "linear-gradient(135deg, #1a1035 0%, #0d1520 100%)",
                  border: "1px solid rgba(124,110,158,0.4)",
                  borderRadius: 14,
                  padding: "24px 20px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(124,110,158,0.8)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(124,110,158,0.4)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <BookOpen size={28} color="#7C6E9E" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>
                  Flashcard Mode
                </div>
                <div style={{ fontSize: "0.8rem", color: "#718096", lineHeight: 1.5 }}>
                  Flip cards to reveal answers. Rate yourself after each flip.
                </div>
                <div style={{ marginTop: 12, fontSize: "0.75rem", color: "#7C6E9E", fontWeight: 600 }}>
                  {filteredQuestions.length} cards shuffled
                </div>
              </button>

              {/* Battle */}
              <button
                onClick={() => setMode("battle")}
                style={{
                  background: "linear-gradient(135deg, #2d1515 0%, #1a0d0d 100%)",
                  border: "1px solid rgba(252,129,129,0.3)",
                  borderRadius: 14,
                  padding: "24px 20px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(252,129,129,0.7)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(252,129,129,0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Swords size={28} color="#FC8181" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>
                  Committee Battle
                </div>
                <div style={{ fontSize: "0.8rem", color: "#718096", lineHeight: 1.5 }}>
                  Simulates the real defense. Random questions, no preview. Answer before you look.
                </div>
                <div style={{ marginTop: 12, fontSize: "0.75rem", color: "#FC8181", fontWeight: 600 }}>
                  {filteredQuestions.length} questions, fully random
                </div>
              </button>

              {/* Browse */}
              <button
                onClick={() => setMode("browse")}
                style={{
                  background: "linear-gradient(135deg, #0d2015 0%, #0a1a10 100%)",
                  border: "1px solid rgba(72,187,120,0.3)",
                  borderRadius: 14,
                  padding: "24px 20px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(72,187,120,0.7)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(72,187,120,0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <CheckCircle2 size={28} color="#68D391" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>
                  Browse & Study
                </div>
                <div style={{ fontSize: "0.8rem", color: "#718096", lineHeight: 1.5 }}>
                  All 90 questions listed. Expand to read answers. Toggle mastery per question.
                </div>
                <div style={{ marginTop: 12, fontSize: "0.75rem", color: "#68D391", fontWeight: 600 }}>
                  {knownCount} / {DEFENSE_QUESTIONS.length} mastered
                </div>
              </button>
            </div>
          </>
        )}

        {/* Active Mode */}
        {mode === "flashcard" && (
          <FlashcardMode
            questions={filteredQuestions}
            mastery={mastery}
            onMasteryUpdate={refreshMastery}
          />
        )}
        {mode === "battle" && (
          <BattleMode
            questions={filteredQuestions}
            mastery={mastery}
            onMasteryUpdate={refreshMastery}
          />
        )}
        {mode === "browse" && (
          <BrowseMode
            questions={filteredQuestions}
            mastery={mastery}
            onMasteryUpdate={refreshMastery}
          />
        )}
      </div>
    </div>
  );
}
