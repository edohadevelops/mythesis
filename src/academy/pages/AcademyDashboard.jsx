import React from "react";
import { useNavigate } from "react-router-dom";
import { getAllProgress } from "../db.js";
import { MATH_LESSONS } from "../data/mathLessons.js";
import { MATH_LESSONS_2 } from "../data/mathLessons2.js";
import { BookOpen, Microscope, Shield, Hash, ExternalLink, Calendar, Calculator, BarChart2 } from "lucide-react";

const DEFENSE_DATE = new Date("2026-11-10T00:00:00");
const ALL_LESSONS = [...MATH_LESSONS, ...MATH_LESSONS_2];

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

function NavCard({ icon: Icon, iconColor, bgColor, title, subtitle, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-navy-800/60 border border-white/10 p-5 text-left hover:border-gold/40 transition-colors group w-full"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-ivory group-hover:text-gold transition-colors">
            {title}
          </div>
          <div className="text-xs text-ivory/50 mt-0.5">{subtitle}</div>
        </div>
        <ExternalLink size={14} className="text-ivory/20 group-hover:text-gold/50" />
      </div>
      {children}
    </button>
  );
}

export default function AcademyDashboard() {
  const navigate = useNavigate();
  const progress = getAllProgress();
  const days = daysUntil(DEFENSE_DATE);

  const lessonStats = ALL_LESSONS.map((l) => ({
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

  const phase1 = lessonStats.slice(0, MATH_LESSONS.length);
  const phase2 = lessonStats.slice(MATH_LESSONS.length);

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
            <div className="text-sm text-ivory/50 mt-1">Nov 10, 2026 — Tuesday</div>
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
              {masteredCount} / {ALL_LESSONS.length}
            </div>
          </div>
        </div>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <NavCard
          icon={Microscope} iconColor="text-sage" bgColor="bg-sage/20"
          title="Results Explorer" subtitle="Chapter 4 — Every result with what/why/how-to-defend"
          onClick={() => navigate("/academy/thesis")}
        />

        <NavCard
          icon={Hash} iconColor="text-gold" bgColor="bg-gold/20"
          title="Mathematics Lab"
          subtitle={`${ALL_LESSONS.length} lessons · EFA, CRI, regression, LASSO, ROC & more`}
          onClick={() => navigate("/academy/math")}
        >
          <MasteryBar value={overallMastery} />
        </NavCard>

        <div className="grid grid-cols-2 gap-3">
          <NavCard
            icon={Calculator} iconColor="text-gold" bgColor="bg-gold/10"
            title="CRI Calculator"
            subtitle="Step-by-step F90-CRI pipeline"
            onClick={() => navigate("/academy/cri")}
          />
          <NavCard
            icon={BarChart2} iconColor="text-sage" bgColor="bg-sage/10"
            title="Visualizations"
            subtitle="LASSO, ROC, EFA charts"
            onClick={() => navigate("/academy/visualize")}
          />
        </div>

        <NavCard
          icon={Shield} iconColor="text-terracotta" bgColor="bg-terracotta/20"
          title="Mock Defense Simulator"
          subtitle="Committee questions on math, methodology, results, limitations"
          onClick={() => navigate("/academy/defense")}
        />

        <NavCard
          icon={BookOpen} iconColor="text-slate-300" bgColor="bg-slate/20"
          title="Symbol Glossary"
          subtitle="Every equation symbol with definition and thesis value"
          onClick={() => navigate("/academy/glossary")}
        />
      </div>

      {/* Lesson progress — Phase 1 */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest text-ivory/40 mb-3">
          Phase 1 — Core Math ({phase1.filter(l => l.progress.mastery >= 80).length}/{phase1.length} mastered)
        </h2>
        <div className="space-y-2">
          {phase1.map((l) => (
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

      {/* Lesson progress — Phase 2 */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest text-ivory/40 mb-3">
          Phase 2 — Advanced Math ({phase2.filter(l => l.progress.mastery >= 80).length}/{phase2.length} mastered)
        </h2>
        <div className="space-y-2">
          {phase2.map((l) => (
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
      <div className="mt-6 text-center">
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
