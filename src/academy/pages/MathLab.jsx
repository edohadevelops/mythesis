import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MATH_LESSONS } from "../data/mathLessons.js";
import { MATH_LESSONS_2 } from "../data/mathLessons2.js";
import { getAllProgress } from "../db.js";
import LessonView from "../components/LessonView.jsx";
import { ChevronLeft, CheckCircle } from "lucide-react";

const ALL_LESSONS = [...MATH_LESSONS, ...MATH_LESSONS_2];

function LessonCard({ lesson, progress, onClick }) {
  const mastery = progress?.mastery || 0;
  const isStarted = progress?.attempts?.length > 0;
  const isMastered = mastery >= 80;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl bg-navy-800/60 border border-white/10 p-5 text-left hover:border-white/25 transition-colors group"
      style={{ borderLeftColor: lesson.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="font-semibold text-ivory/90 group-hover:text-ivory text-sm">
            {lesson.title}
          </div>
          <div className="text-xs text-ivory/45 mt-1">{lesson.subtitle}</div>
          <div className="text-xs text-ivory/35 mt-2">
            {lesson.sections.length} sections · {lesson.questions.length} questions
          </div>
        </div>
        <div className="shrink-0 text-right">
          {isMastered ? (
            <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
              <CheckCircle size={14} />
              Mastered
            </div>
          ) : isStarted ? (
            <div className="text-xs text-gold font-semibold">{mastery}%</div>
          ) : (
            <div className="text-xs text-ivory/25">Not started</div>
          )}
          <div className="mt-2 w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${mastery}%`,
                backgroundColor: isMastered ? "#4ade80" : lesson.color,
              }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function MathLab() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const allProgress = getAllProgress();

  const activeLesson = lessonId
    ? ALL_LESSONS.find((l) => l.id === lessonId)
    : null;

  if (activeLesson) {
    return (
      <div className="max-w-2xl mx-auto pb-16">
        <LessonView
          lesson={activeLesson}
          onBack={() => navigate("/academy/math")}
        />
      </div>
    );
  }

  const phase1 = MATH_LESSONS;
  const phase2 = MATH_LESSONS_2;

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <button
        onClick={() => navigate("/academy")}
        className="flex items-center gap-1 text-ivory/40 hover:text-ivory text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Dashboard
      </button>

      <h1 className="text-2xl font-bold text-ivory mb-1">Mathematics Lab</h1>
      <p className="text-ivory/50 text-sm mb-8">
        {ALL_LESSONS.length} topics covering everything your committee might ask.
        Each lesson has intuition, formal math, notation, derivation, thesis application, and active-recall exercises.
      </p>

      <div className="mb-8">
        <h2 className="text-xs uppercase tracking-widest text-ivory/40 mb-3">
          Phase 1 — Core Methods
        </h2>
        <div className="space-y-3">
          {phase1.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              progress={allProgress[lesson.id]}
              onClick={() => navigate(`/academy/math/${lesson.id}`)}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-widest text-ivory/40 mb-3">
          Phase 2 — Advanced Mathematics
        </h2>
        <div className="space-y-3">
          {phase2.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              progress={allProgress[lesson.id]}
              onClick={() => navigate(`/academy/math/${lesson.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
