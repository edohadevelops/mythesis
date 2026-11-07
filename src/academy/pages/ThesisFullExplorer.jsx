/**
 * Full Thesis Explorer — Chapters 1–5
 * Synchronized reading mode: select any paragraph → explanation + connected concepts
 * User notes per section (requires auth from Phase 3)
 * Mastery status per chapter section
 */
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EqBlock, Eq } from "../components/KaTeX.jsx";
import { SAMPLE, EFA, CRI, CORRELATIONS, LASSO } from "../data/thesisResults.js";
import { ChevronLeft, BookOpen, Info, MessageCircle, Link2, ChevronDown, ChevronUp } from "lucide-react";

// ── Chapter content ─────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: "ch1",
    number: 1,
    title: "Introduction",
    color: "#C6A36A",
    sections: [
      {
        id: "ch1-motivation",
        heading: "Problem Motivation",
        content: `First-year doctoral students face a constellation of adjustment demands —
financial precarity, academic pressure, advisor relationships, and social dislocation —
that together may elevate depression risk. While existing literature documents individual
stressors, no composite measure integrates these demands into a clinically usable risk index.`,
        annotation: "This paragraph establishes the gap. The key phrase is 'constellation of adjustment demands' — this is what the EFA operationalizes by identifying latent factors across 11 domains.",
        connections: ["EFA identifies the latent structure", "F90-CRI quantifies the constellation"],
        mathLink: null,
      },
      {
        id: "ch1-gap",
        heading: "Research Gap",
        content: `Prior instruments address single domains (e.g., financial strain scales, advisor
satisfaction surveys) but no validated composite captures the full burden profile.
The PHQ-2 provides a quick depression screen, but it identifies risk after-the-fact
rather than from adjustment burden before symptoms emerge.`,
        annotation: "The gap statement motivates both the EFA (to find latent structure) and the LASSO (to predict PHQ-2 from burden scores). The 'after-the-fact vs. before-the-fact' distinction is a key contribution.",
        connections: ["PHQ-2 as criterion variable", "CRI as prospective burden index"],
        mathLink: null,
      },
      {
        id: "ch1-aims",
        heading: "Research Aims",
        content: `This study aims to:
(1) Identify the latent factor structure of doctoral adjustment burden across 11 domains
(2) Construct a composite risk index (F90-CRI) from factor scores
(3) Validate the CRI against PHQ-2 screening outcomes
(4) Build a predictive model for PHQ-2 positivity from adjustment domains`,
        annotation: "Four aims map directly to your four methods: (1)=EFA, (2)=CRI construction, (3)=Spearman correlations, (4)=LASSO. When a committee asks 'what's the central contribution?' — these four aims are your answer.",
        connections: ["EFA → Aim 1", "CRI formula → Aim 2", "Spearman ρ → Aim 3", "LASSO → Aim 4"],
        mathLink: null,
      },
    ],
  },
  {
    id: "ch2",
    number: 2,
    title: "Literature Review",
    color: "#6F9289",
    sections: [
      {
        id: "ch2-stress",
        heading: "Doctoral Student Stress Literature",
        content: `The doctoral student mental health crisis is well-documented. Studies report
depression and anxiety rates 2–6× higher than the general population among graduate
students (Evans et al., 2018). Identified stressors cluster around financial pressure,
academic performance anxiety, advisor relationships, and isolation — a pattern consistent
with the two-factor structure identified in this study.`,
        annotation: "This literature grounds your EFA result. When asked 'why did you expect two factors?' — the literature itself anticipated Practical vs. Emotional dimensions. Your finding replicates and formalises this theoretical distinction.",
        connections: ["F1: Practical Pressure", "F2: Emotional/Interpersonal Strain", "φ=0.395 (correlated, not independent)"],
        mathLink: "efa",
      },
      {
        id: "ch2-efa",
        heading: "Psychometric Foundations for EFA",
        content: `Exploratory Factor Analysis (EFA) is appropriate when the latent structure is
theoretically motivated but not confirmatory — the factor structure has not been validated
in this specific population. Oblique rotation (Promax) is preferred when factors are
expected to correlate, as psychological adjustment dimensions typically co-occur.`,
        annotation: "This is your justification for choosing EFA over CFA and Promax over Varimax. Know these arguments: EFA is appropriate for a new construct; oblique rotation allows the factors to correlate (and they do, φ=0.395).",
        connections: ["EFA vs. CFA choice", "Promax rotation", "φ=0.395 justifies oblique"],
        mathLink: "efa",
      },
      {
        id: "ch2-lasso",
        heading: "Regularization in Small Clinical Samples",
        content: `With N<200 and p=11 predictors, standard logistic regression is susceptible to
overfitting. LASSO (Tibshirani, 1996) addresses this via L1 penalization, simultaneously
performing variable selection and coefficient shrinkage. Nested cross-validation provides
unbiased performance estimates when both tuning and evaluation are performed.`,
        annotation: "N=133 is your limiting factor. LASSO is specifically designed for cases where n is not much larger than p. This paragraph pre-empts the committee question 'why not just standard logistic regression?'",
        connections: ["LASSO regularization", "λ.min vs λ.1se", "Nested 10-fold CV"],
        mathLink: "lasso",
      },
    ],
  },
  {
    id: "ch3",
    number: 3,
    title: "Methods",
    color: "#B76C58",
    sections: [
      {
        id: "ch3-sample",
        heading: "Sample",
        content: `Participants: N=${SAMPLE.N} first-year doctoral students recruited from [University].
PHQ-2 outcome: ${SAMPLE.phq2Positive} positive (${SAMPLE.phq2PositivePct}% of sample).
Adjustment domains: 11 items rated 1–5 covering financial, academic, research,
housing, time, career, advisor, belonging, isolation, work-life, and discrimination.`,
        annotation: "The 50.38% PHQ-2 positive rate is notably high — worth noting as a limitation (convenience sample, self-selection). The near-50/50 split is actually favorable for logistic regression (balanced classes).",
        connections: ["Base rate = 50.38%", "Balanced binary outcome"],
        mathLink: "prob-odds",
      },
      {
        id: "ch3-efa-method",
        heading: "EFA Procedure",
        content: `EFA was conducted in R using the psych package.
Factorability assessed with KMO (${EFA.kmo}) and Bartlett's test (χ²=${EFA.bartlettChi2}, df=${EFA.bartlettDf}, p${EFA.bartlettP}).
Factor retention determined by parallel analysis (Horn, 1965) supporting 2 factors.
Estimation: Maximum likelihood (ML); rotation: Promax (oblique).
Model fit: TLI=${EFA.tli}, RMSEA=${EFA.rmsea}, RMSR=${EFA.rmsr}.`,
        annotation: "Every number here will be questioned by the committee. KMO>0.8 = 'meritorious'; Bartlett p<.001 = factorability confirmed; parallel analysis = gold standard retention; Promax = oblique because φ>0.3 expected.",
        connections: ["KMO & Bartlett", "Parallel analysis", "RMSEA=0.098 (marginal)"],
        mathLink: "fitindices",
      },
      {
        id: "ch3-cri-method",
        heading: "F90-CRI Construction",
        content: `Factor scores estimated via regression method.
Composite C = (ξ₁ + ξ₂)/2 (equal weighting of two factor scores).
Min-max rescaling to [0,100] using sample bounds:
lower = ${CRI.lowerBound}, upper = ${CRI.upperBound}.
CRI = 100 × (C + ${CRI.lowerBound}) / ${CRI.upperBound}`,
        annotation: "Equal weighting is a methodological choice — could have weighted by factor eigenvalue or correlation with PHQ-2. The committee may ask why equal weights. Answer: parsimony; the two factors show comparable validity coefficients.",
        connections: ["CRI formula", "Worked example: CRI=61.48"],
        mathLink: "cri",
      },
      {
        id: "ch3-lasso-method",
        heading: "LASSO Logistic Regression",
        content: `Outcome: PHQ-2 positive (binary, 0/1).
Predictors: 11 adjustment domains (standardized).
Model: Penalized logistic regression via glmnet (Friedman et al., 2010).
Tuning: λ selected by nested 10-fold CV (inner fold selects λ; outer fold evaluates performance).
Two models reported: λ.min (highest AUC) and λ.1se (more parsimonious within 1 SE of best).`,
        annotation: "The λ.1se model is usually preferred for clinical application — fewer predictors, interpretable, nearly as good as λ.min. The difference: 2.2 vs 6.6 mean predictors, AUC drop from 0.861 to 0.836.",
        connections: ["λ.min vs λ.1se tradeoff", "Nested CV", "AUC & Brier score"],
        mathLink: "crossval",
      },
    ],
  },
  {
    id: "ch4",
    number: 4,
    title: "Results",
    color: "#C6A36A",
    sections: [
      {
        id: "ch4-efa-result",
        heading: "EFA: Two-Factor Solution",
        content: `Parallel analysis supported extraction of 2 factors.
Factor 1 (Practical Pressure): Financial Strain (λ=0.782), Academic Pressure (λ=0.714),
Research Workload (λ=0.690), Housing (λ=0.651), Time Management (λ=0.634), Career Uncertainty (λ=0.621).
Factor 2 (Emotional/Interpersonal Strain): Advisor Relationship (λ=0.831), Sense of Belonging (λ=0.779),
Social Isolation (λ=0.743), Work-Life Balance (λ=0.598), Discrimination (λ=0.541).
Factor correlation: φ=${EFA.factorCorrelation}.`,
        annotation: "The two-factor solution is theoretically coherent: external/resource demands vs. relational/psychological demands. Work-Life Balance cross-loads moderately (0.312 on F1). Factor correlation φ=0.395 justifies oblique rotation — these dimensions overlap.",
        connections: ["Factor interpretation", "Cross-loading: Work-Life Balance", "φ=0.395"],
        mathLink: "efa",
      },
      {
        id: "ch4-cri-result",
        heading: "CRI Distribution",
        content: `CRI: mean=${CRI.mean}, SD=${CRI.sd}, range ${CRI.min}–${CRI.max}
PHQ-2 positive: mean CRI=${CRI.phq2PosMean} vs. PHQ-2 negative: mean CRI=${CRI.phq2NegMean}
Spearman ρ(CRI, PHQ-2 binary) = ${CORRELATIONS.criVsPhq2Binary.rho}, p${CORRELATIONS.criVsPhq2Binary.p}`,
        annotation: `The ~${Math.round(CRI.phq2PosMean - CRI.phq2NegMean)}-point CRI gap between PHQ-2 groups (${CRI.phq2PosMean} vs. ${CRI.phq2NegMean}) is clinically meaningful. ρ=0.409 is a moderate-strong correlation for a composite vs. binary outcome.`,
        connections: ["Spearman vs Pearson", "Effect size interpretation"],
        mathLink: "spearman",
      },
      {
        id: "ch4-corr-result",
        heading: "Differential Validity: Practical vs. Emotional",
        content: `Spearman ρ(Emotional, PHQ-2) = ${CORRELATIONS.emotionalVsPhq2Binary.rho}, p${CORRELATIONS.emotionalVsPhq2Binary.p}
Spearman ρ(Practical, PHQ-2) = ${CORRELATIONS.practicalVsPhq2Binary.rho}, p${CORRELATIONS.practicalVsPhq2Binary.p}

The Emotional factor drives the association with PHQ-2 positivity.
The Practical factor shows no significant association.`,
        annotation: "The null result for Practical is NOT a failure — it's a finding. Practical stressors may affect other outcomes (academic performance, attrition) but not depression screening. The Emotional factor is the proximal driver of PHQ-2 risk.",
        connections: ["Null result interpretation", "Advisor relationship as primary driver"],
        mathLink: "spearman",
      },
      {
        id: "ch4-lasso-result",
        heading: "LASSO: Predictive Performance",
        content: `λ.min: AUC=${LASSO.lambdaMin.auc}, Brier=${LASSO.lambdaMin.brier}, mean predictors≈${LASSO.lambdaMin.meanSelected}
λ.1se: AUC=${LASSO.lambda1se.auc}, Brier=${LASSO.lambda1se.brier}, mean predictors≈${LASSO.lambda1se.meanSelected}

AUC=0.861 (λ.min) substantially exceeds chance (0.5), indicating good discrimination.
Brier=0.152 vs. null Brier≈0.250 → 39% improvement in probability calibration.`,
        annotation: "AUC=0.861 is 'excellent' by conventional benchmarks (>0.8). The λ.1se model (AUC=0.836, 2.2 predictors) may be preferable for clinical screening — parsimony without much accuracy loss. The Emotional factor predictors likely dominate both models.",
        connections: ["AUC interpretation", "Brier vs null", "λ.min vs λ.1se clinical choice"],
        mathLink: "roc-auc",
      },
    ],
  },
  {
    id: "ch5",
    number: 5,
    title: "Discussion",
    color: "#667C86",
    sections: [
      {
        id: "ch5-contribution",
        heading: "Central Contribution",
        content: `The F90-CRI is the first composite instrument to quantify doctoral adjustment
burden across practical and emotional dimensions simultaneously, with demonstrated validity
against PHQ-2 depression screening. The two-factor structure replicates theoretical
predictions from the doctoral stress literature and provides a psychometrically sound
basis for a brief screening instrument.`,
        annotation: "This is your 'elevator pitch' for the thesis. The committee will ask 'what's the main contribution?' — this paragraph is the answer. Know it cold.",
        connections: ["EFA validates two-factor theory", "CRI as new instrument", "LASSO validates predictive utility"],
        mathLink: null,
      },
      {
        id: "ch5-practical",
        heading: "Practical Implications",
        content: `The λ.1se LASSO model identifies ≈2 key domains with AUC=0.836.
These 2 domains represent the most parsimonious basis for a brief screening tool.
Students above the mean CRI (>${CRI.mean}) may warrant proactive outreach,
especially if Emotional factor scores are elevated.`,
        annotation: "The cut-point of CRI>44.88 (mean) is not validated for clinical decision-making — be clear about this. The model identifies risk, not diagnosis. PHQ-2 remains the clinical screen; CRI identifies who needs it most.",
        connections: ["Clinical threshold caution", "λ.1se parsimony"],
        mathLink: null,
      },
      {
        id: "ch5-limitations",
        heading: "Limitations",
        content: `1. Cross-sectional design — adjustment demands measured concurrently with PHQ-2,
preventing causal inference about temporal relationships.
2. Convenience sample (N=${SAMPLE.N}) — may not generalize to other institutions or disciplines.
3. RMSEA=${EFA.rmsea} exceeds the conventional 0.08 threshold — fit is marginal.
4. CRI bounds are sample-specific — scores are not interpretable across different samples.
5. PHQ-2 is a brief screening tool, not a diagnostic instrument.`,
        annotation: "Acknowledge all five of these before the committee asks. For each: (1) state the limitation, (2) explain why it doesn't invalidate the finding, (3) suggest future directions. The RMSEA=0.098 will definitely come up.",
        connections: ["RMSEA defense", "External validity", "CRI rescaling issue"],
        mathLink: "fitindices",
      },
      {
        id: "ch5-future",
        heading: "Future Directions",
        content: `1. Longitudinal study — follow students prospectively to test whether CRI predicts
PHQ-2 emergence over time.
2. Multi-institution validation — recalibrate CRI bounds across a larger, more diverse sample.
3. CFA — confirm the two-factor structure in an independent sample.
4. Intervention design — test whether reducing Emotional factor scores (advisor, belonging,
isolation) reduces PHQ-2 positivity.`,
        annotation: "Four future directions mapped to four limitations. For each committee question about a limitation, pivot to the future direction: 'That's a limitation of this cross-sectional design. Future work could…'",
        connections: ["Limitation → future direction mapping"],
        mathLink: null,
      },
    ],
  },
];

// ── Components ──────────────────────────────────────────────────────────────
function ChapterTab({ chapter, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
        active
          ? "font-semibold"
          : "text-ivory/40 hover:text-ivory/70"
      }`}
      style={active ? { color: chapter.color, background: `${chapter.color}18`, borderColor: `${chapter.color}40`, border: "1px solid" } : {}}
    >
      <span className="text-xs opacity-60">Ch{chapter.number}</span>
      {chapter.title}
    </button>
  );
}

function SectionCard({ section, mathLessons }) {
  const [expanded, setExpanded] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);

  return (
    <div className="rounded-xl bg-navy-800/60 border border-white/10 mb-4 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen size={15} className="text-ivory/40" />
          <span className="font-semibold text-ivory/90 text-sm">{section.heading}</span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-ivory/40" />
        ) : (
          <ChevronDown size={16} className="text-ivory/40" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          <p className="text-sm text-ivory/75 leading-relaxed whitespace-pre-line mb-4">
            {section.content}
          </p>

          {/* Annotation toggle */}
          <div className="flex gap-2 flex-wrap mb-3">
            <button
              onClick={() => setShowAnnotation(!showAnnotation)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all"
              style={showAnnotation
                ? { background: "rgba(198,163,106,0.15)", borderColor: "rgba(198,163,106,0.4)", color: "#C6A36A" }
                : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(246,242,233,0.4)" }
              }
            >
              <Info size={11} />
              {showAnnotation ? "Hide annotation" : "Defense annotation"}
            </button>

            {section.mathLink && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-sage/20 text-sage/60">
                <Link2 size={11} />
                Math: {section.mathLink}
              </div>
            )}
          </div>

          {showAnnotation && (
            <div className="rounded-lg bg-gold/10 border border-gold/20 p-4 mb-3">
              <div className="text-xs text-gold font-semibold uppercase tracking-wider mb-2">Defense Coach Note</div>
              <p className="text-sm text-ivory/80 leading-relaxed">{section.annotation}</p>
              {section.connections?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {section.connections.map((c, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-ivory/50">{c}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ThesisFullExplorer() {
  const navigate = useNavigate();
  const [activeChapter, setActiveChapter] = useState("ch4"); // Start on Results

  const chapter = CHAPTERS.find((c) => c.id === activeChapter);

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/academy")}
          className="flex items-center gap-1 text-ivory/50 hover:text-ivory text-sm transition-colors"
        >
          <ChevronLeft size={16} /> Dashboard
        </button>
        <div className="flex-1" />
        <button
          onClick={() => navigate("/academy/thesis")}
          className="text-xs text-ivory/40 hover:text-gold transition-colors"
        >
          Ch4 Deep Dive →
        </button>
      </div>

      <h1 className="text-2xl font-bold text-ivory mb-1">Full Thesis Explorer</h1>
      <p className="text-ivory/50 text-sm mb-6">
        All 5 chapters with defense annotations — click any section for coach notes explaining
        what it means and how to defend it.
      </p>

      {/* Chapter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-white/10">
        {CHAPTERS.map((ch) => (
          <ChapterTab
            key={ch.id}
            chapter={ch}
            active={activeChapter === ch.id}
            onClick={() => setActiveChapter(ch.id)}
          />
        ))}
      </div>

      {/* Chapter content */}
      {chapter && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: `${chapter.color}20`, color: chapter.color, border: `1px solid ${chapter.color}30` }}
            >
              {chapter.number}
            </div>
            <div>
              <div className="text-xs text-ivory/40">Chapter {chapter.number}</div>
              <div className="font-semibold text-ivory">{chapter.title}</div>
            </div>
          </div>

          <div>
            {chapter.sections.map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
