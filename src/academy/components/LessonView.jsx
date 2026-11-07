/**
 * Full lesson viewer — study → active recall → feedback → mastery
 * Active recall: student answers BEFORE seeing the solution.
 */
import React, { useState, useEffect } from "react";
import { Eq, EqBlock, EqAligned } from "./KaTeX.jsx";
import { recordAttempt, getLessonProgress } from "../db.js";
import { ChevronRight, ChevronLeft, CheckCircle, XCircle, BookOpen, Brain } from "lucide-react";

function renderContent(text) {
  if (!text) return null;
  // Simple markdown-lite: **bold**, line breaks
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i}>{p}</strong> : p
  );
}

function SectionCard({ section }) {
  const bgMap = {
    intuition: "border-l-4 border-gold/60",
    definition: "border-l-4 border-sage/60",
    notation: "border-l-4 border-terracotta/60",
    derivation: "border-l-4 border-slate/60",
    thesis: "border-l-4 border-gold/80 bg-gold/5",
    defense: "border-l-4 border-terracotta/80 bg-terracotta/5",
  };

  const badgeMap = {
    intuition: { label: "Intuition", bg: "bg-gold/20 text-gold" },
    definition: { label: "Definition", bg: "bg-sage/20 text-sage" },
    notation: { label: "Notation", bg: "bg-terracotta/20 text-terracotta" },
    derivation: { label: "Derivation", bg: "bg-slate/20 text-slate" },
    thesis: { label: "In Your Thesis", bg: "bg-gold/30 text-gold" },
    defense: { label: "Defense Readiness", bg: "bg-terracotta/30 text-terracotta" },
  };

  const badge = badgeMap[section.type] || { label: section.type, bg: "bg-white/10 text-ivory" };

  return (
    <div className={`rounded-xl bg-navy-800/50 p-6 mb-4 ${bgMap[section.type] || ""}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.bg}`}>
          {badge.label}
        </span>
        <h3 className="font-semibold text-ivory/90 text-sm">{section.heading}</h3>
      </div>

      {section.content && (
        <p className="text-sm text-ivory/75 leading-relaxed mb-4 whitespace-pre-line">
          {renderContent(section.content)}
        </p>
      )}

      {section.latex && <EqBlock>{section.latex}</EqBlock>}

      {section.content2 && (
        <p className="text-sm text-ivory/75 leading-relaxed mb-4 whitespace-pre-line">
          {renderContent(section.content2)}
        </p>
      )}

      {section.latex2 && <EqBlock>{section.latex2}</EqBlock>}
      {section.content3 && (
        <p className="text-sm text-ivory/75 leading-relaxed mb-4 whitespace-pre-line">
          {renderContent(section.content3)}
        </p>
      )}
      {section.latex3 && <EqBlock>{section.latex3}</EqBlock>}
      {section.content4 && (
        <p className="text-sm text-ivory/75 leading-relaxed mb-4 whitespace-pre-line">
          {renderContent(section.content4)}
        </p>
      )}
      {section.latex4 && <EqBlock>{section.latex4}</EqBlock>}
      {section.content5 && (
        <p className="text-sm text-ivory/75 leading-relaxed whitespace-pre-line">
          {renderContent(section.content5)}
        </p>
      )}

      {section.latex_table && (
        <table className="w-full text-sm mt-2">
          <tbody>
            {section.latex_table.map(([sym, desc], i) => (
              <tr key={i} className="border-b border-white/10">
                <td className="py-2 pr-6 font-mono w-48">
                  <Eq>{sym}</Eq>
                </td>
                <td className="py-2 text-ivory/70 text-xs leading-snug">
                  {renderContent(desc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {section.points && (
        <ul className="space-y-2 mt-2">
          {section.points.map((p, i) => (
            <li key={i} className="text-sm text-ivory/75 flex gap-3">
              <span className="text-gold mt-0.5 shrink-0">•</span>
              <span className="leading-snug">{renderContent(p)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuestionCard({ question, topicId, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    const correct = selected === question.correct;
    recordAttempt(topicId, {
      questionId: question.id,
      correct,
      selectedAnswer: selected,
      correctAnswer: question.correct,
    });
    onAnswer && onAnswer({ questionId: question.id, correct });
  }

  const isCorrect = submitted && selected === question.correct;
  const isWrong = submitted && selected !== question.correct;

  return (
    <div className="rounded-xl bg-navy-800/60 border border-white/10 p-6 mb-4">
      <div className="flex items-start gap-3 mb-5">
        <Brain size={16} className="text-gold shrink-0 mt-1" />
        <p className="text-sm text-ivory/90 leading-relaxed font-medium">
          {question.stem}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {question.options.map((opt) => {
          let cls =
            "w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ";
          if (!submitted) {
            cls +=
              selected === opt.id
                ? "border-gold bg-gold/15 text-ivory"
                : "border-white/10 bg-white/5 text-ivory/70 hover:bg-white/10 hover:text-ivory";
          } else {
            if (opt.id === question.correct) {
              cls += "border-green-400/60 bg-green-400/10 text-green-200";
            } else if (opt.id === selected && opt.id !== question.correct) {
              cls += "border-red-400/60 bg-red-400/10 text-red-200";
            } else {
              cls += "border-white/5 bg-white/3 text-ivory/40";
            }
          }

          return (
            <button
              key={opt.id}
              className={cls}
              disabled={submitted}
              onClick={() => !submitted && setSelected(opt.id)}
            >
              <span className="font-mono text-xs opacity-60 mr-3">
                {opt.id.toUpperCase()}.
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="px-5 py-2 rounded-lg bg-gold text-navy font-semibold text-sm disabled:opacity-30 hover:bg-gold/90 transition-colors"
        >
          Submit Answer
        </button>
      ) : (
        <div>
          <div
            className={`flex items-center gap-2 mb-3 font-semibold text-sm ${
              isCorrect ? "text-green-300" : "text-red-300"
            }`}
          >
            {isCorrect ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
            {isCorrect ? "Correct!" : "Not quite — see explanation"}
          </div>

          {!showExplanation ? (
            <button
              onClick={() => setShowExplanation(true)}
              className="text-sm text-gold/80 hover:text-gold underline"
            >
              Show explanation
            </button>
          ) : (
            <div className="bg-white/5 rounded-lg p-4 text-sm text-ivory/80 leading-relaxed">
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LessonView({ lesson, onBack }) {
  const [mode, setMode] = useState("study"); // "study" | "quiz"
  const [answerCount, setAnswerCount] = useState(0);
  const [progress, setProgress] = useState(() => getLessonProgress(lesson.id));

  function handleAnswer({ correct }) {
    setAnswerCount((c) => c + 1);
    setProgress(getLessonProgress(lesson.id));
  }

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-ivory/50 hover:text-ivory text-sm transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex-1" />
        <div className="text-xs text-ivory/50">
          Mastery: <span className="text-gold font-semibold">{progress.mastery}%</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-ivory mb-1">{lesson.title}</h1>
      <p className="text-ivory/50 mb-6 text-sm">{lesson.subtitle}</p>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("study")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "study"
              ? "bg-gold text-navy"
              : "bg-white/10 text-ivory/60 hover:text-ivory"
          }`}
        >
          <BookOpen size={14} /> Study
        </button>
        <button
          onClick={() => setMode("quiz")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "quiz"
              ? "bg-gold text-navy"
              : "bg-white/10 text-ivory/60 hover:text-ivory"
          }`}
        >
          <Brain size={14} /> Active Recall ({lesson.questions.length} Q)
        </button>
      </div>

      {mode === "study" && (
        <div>
          {lesson.sections.map((section, i) => (
            <SectionCard key={i} section={section} />
          ))}
          <button
            onClick={() => setMode("quiz")}
            className="w-full mt-4 py-3 rounded-xl bg-gold/20 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/30 transition-colors flex items-center justify-center gap-2"
          >
            <Brain size={16} />
            Test yourself ({lesson.questions.length} questions) →
          </button>
        </div>
      )}

      {mode === "quiz" && (
        <div>
          <div className="mb-4 p-4 rounded-xl bg-terracotta/10 border border-terracotta/20 text-sm text-ivory/70">
            Answer before looking at the explanation. Mastery unlocks at 80% across recent attempts.
          </div>
          {lesson.questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              topicId={lesson.id}
              onAnswer={handleAnswer}
            />
          ))}
          {answerCount > 0 && (
            <div className="text-center mt-4 text-sm text-ivory/50">
              Current mastery: <span className="text-gold font-semibold">{getLessonProgress(lesson.id).mastery}%</span>
              {getLessonProgress(lesson.id).mastery >= 80 && (
                <span className="ml-2 text-green-400">✓ Mastered</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
