import React from "react";
import { useNavigate } from "react-router-dom";
import { getAllProgress } from "../db.js";
import { MATH_LESSONS } from "../data/mathLessons.js";
import { BookOpen, Microscope, Shield, Hash, ExternalLink, Calendar } from "lucide-react";

const DEFENSE_DATE = new Date("2026-11-15T00:00:00");

function daysUntil(date) {
  const now = new Date();
  const diff = date - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function MasteryBar({ value }) {
  const color =
    value >= 80 ? "bg-green-400" : value >= 50 ? "bg-gold" : "bg-terracotta/60";
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function AcademyDashboard() {
  const navigate = useNavigate();
  const progress = getAllProgress();
  const days = daysUntil(DEFENSE_DATE);

  const lessonStats = MATH_LESSONS.map((l) => ({
    ...l,
    progress: progress[l.id] || { mastery: 0, attempts: [], completedAt: null },
  }));
  const masteredCount = lessonStats.filter((l) => l.progress.mastery >= 80).length;
  const overallMastery =
    lessonStats.length > 0
      ? Math.round(
          lessonStats.reduce((s, l) => s + l.progress.mastery, 0) / lessonStats.length
        )
      : 0;

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Defense countdown */}
      <div className="rounded-2xl bg-gradient-to-br from-gold/20 to-terracotta/10 border border-gold/20 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gold/70 uppercase tracking-widest mb-1">Defense Date</div>
            <div className="text-3xl font-bold text-ivory">
              {days} <span className="text-xl font-normal text-ivory/60">days</span>
            </div>
            <div className="text-sm text-ivory/50 mt-1">Nov 15, 2026</div>
          </div>
          <Calendar size={40} className="text-gold/30" />
        </div>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <div className="text-ivory/40 text-xs">Overall mastery</div>
            <div className="text-gold font-semibold">{overallMastery}%</div>
          </div>
          <div>
            <div className="text-ivory/40 text-xs">Topics mastered</div>
            <div className="text-gold font-semibold">
              {masteredCount} / {MATH_LESSONS.length}
            </div>
          </div>
        </div>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <button
          onClick={() => navigate("/academy/thesis")}
          className="rounded-xl bg-navy-800/60 border border-white/10 p-5 text-left hover:border-gold/40 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center">
              <Microscope size={20} className="text-sage" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ivory group-hover:text-gold transition-colors">
                Results Explorer
              </div>
              <div className="text-xs text-ivory/50 mt-0.5">
                Chapter 4 — Every result with what/why/how-to-defend
              </div>
            </div>
            <ExternalLink size={14} className="text-ivory/20 group-hover:text-gold/50" />
          </div>
        </button>

        <button
          onClick={() => navigate("/academy/math")}
          className="rounded-xl bg-navy-800/60 border border-white/10 p-5 text-left hover:border-gold/40 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
              <Hash size={20} className="text-gold" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ivory group-hover:text-gold transition-colors">
                Mathematics Lab
              </div>
              <div className="text-xs text-ivory/50 mt-0.5">
                {MATH_LESSONS.length} lessons · EFA, CRI, Spearman, LASSO & more
              </div>
            </div>
            <ExternalLink size={14} className="text-ivory/20 group-hover:text-gold/50" />
          </div>
          <MasteryBar value={overallMastery} />
        </button>

        <button
          onClick={() => navigate("/academy/defense")}
          className="rounded-xl bg-navy-800/60 border border-white/10 p-5 text-left hover:border-gold/40 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-terracotta/20 flex items-center justify-center">
              <Shield size={20} className="text-terracotta" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ivory group-hover:text-gold transition-colors">
                Mock Defense Simulator
              </div>
              <div className="text-xs text-ivory/50 mt-0.5">
                Committee questions on math, methodology, results, limitations
              </div>
            </div>
            <ExternalLink size={14} className="text-ivory/20 group-hover:text-gold/50" />
          </div>
        </button>

        <button
          onClick={() => navigate("/academy/glossary")}
          className="rounded-xl bg-navy-800/60 border border-white/10 p-5 text-left hover:border-gold/40 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate/20 flex items-center justify-center">
              <BookOpen size={20} className="text-slate-300" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ivory group-hover:text-gold transition-colors">
                Symbol Glossary
              </div>
              <div className="text-xs text-ivory/50 mt-0.5">
                Every equation symbol with definition and thesis value
              </div>
            </div>
            <ExternalLink size={14} className="text-ivory/20 group-hover:text-gold/50" />
          </div>
        </button>
      </div>

      {/* Lesson progress strip */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-ivory/40 mb-3">Math Lesson Progress</h2>
        <div className="space-y-2">
          {lessonStats.map((l) => (
            <button
              key={l.id}
              onClick={() => navigate(`/academy/math/${l.id}`)}
              className="w-full rounded-lg bg-white/5 border border-white/8 px-4 py-3 text-left hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-ivory/80">{l.title}</span>
                <span
                  className={`text-xs font-semibold ${
                    l.progress.mastery >= 80
                      ? "text-green-400"
                      : l.progress.mastery > 0
                      ? "text-gold"
                      : "text-ivory/30"
                  }`}
                >
                  {l.progress.mastery >= 80 ? "✓ Mastered" : l.progress.mastery > 0 ? `${l.progress.mastery}%` : "Not started"}
                </span>
              </div>
              <MasteryBar value={l.progress.mastery} />
            </button>
          ))}
        </div>
      </div>

      {/* Back to main app */}
      <div className="mt-10 text-center">
        <a
          href="/"
          className="text-xs text-ivory/30 hover:text-ivory/60 transition-colors"
        >
          ← Back to Thesis Tracker
        </a>
      </div>
    </div>
  );
}
