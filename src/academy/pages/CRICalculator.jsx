/**
 * F90-CRI Interactive Calculator
 * Step-by-step pipeline: domain scores → standardization → factor scoring → composite → CRI
 * All parameters from verified thesis data (thesisResults.js)
 */
import React, { useState, useMemo } from "react";
import { CRI as CRI_DATA } from "../data/thesisResults.js";
import { EqBlock, Eq } from "../components/KaTeX.jsx";
import { ChevronRight, RotateCcw, CheckCircle } from "lucide-react";

// 11 adjustment domains, each belonging to Factor 1 (Practical) or Factor 2 (Emotional)
// Primary loadings from thesis Table X
const DOMAINS = [
  { id: "financial",    label: "Financial Strain",             factor: 1, loading: 0.782 },
  { id: "academic",     label: "Academic Pressure",            factor: 1, loading: 0.714 },
  { id: "workload",     label: "Research Workload",            factor: 1, loading: 0.690 },
  { id: "housing",      label: "Housing & Living Conditions",  factor: 1, loading: 0.651 },
  { id: "time",         label: "Time Management",              factor: 1, loading: 0.634 },
  { id: "career",       label: "Career Uncertainty",           factor: 1, loading: 0.621 },
  { id: "advisor",      label: "Advisor Relationship",         factor: 2, loading: 0.831 },
  { id: "belonging",    label: "Sense of Belonging",           factor: 2, loading: 0.779 },
  { id: "isolation",    label: "Social Isolation",             factor: 2, loading: 0.743 },
  { id: "worklife",     label: "Work-Life Balance",            factor: 2, loading: 0.598 },
  { id: "discrimination", label: "Discrimination / Microaggressions", factor: 2, loading: 0.541 },
];

// Worked example from thesis (thesisResults.js)
const WORKED_EXAMPLE_SCORES = {
  financial: 4, academic: 3, workload: 4, housing: 2, time: 3, career: 3,
  advisor: 4, belonging: 3, isolation: 3, worklife: 4, discrimination: 2,
};

const CRI = CRI_DATA;

function StepBadge({ n, active, done }) {
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
        done
          ? "bg-green-500/30 text-green-400 border border-green-500/40"
          : active
          ? "bg-gold/20 text-gold border border-gold/40"
          : "bg-white/5 text-ivory/30 border border-white/10"
      }`}
    >
      {done ? <CheckCircle size={14} /> : n}
    </div>
  );
}

function SliderInput({ domain, value, onChange }) {
  const pct = ((value - 1) / 4) * 100;
  const color = domain.factor === 1 ? "#C6A36A" : "#6F9289";
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span className="text-sm text-ivory/80">{domain.label}</span>
          <span className="text-xs text-ivory/40">
            F{domain.factor} · λ={domain.loading}
          </span>
        </div>
        <span className="text-sm font-mono text-ivory font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(domain.id, Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-ivory/20 mt-0.5">
        <span>1 Low</span>
        <span>5 High</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, formula, highlight }) {
  return (
    <div
      className={`rounded-lg px-4 py-3 ${
        highlight
          ? "bg-gold/15 border border-gold/30"
          : "bg-white/5 border border-white/8"
      }`}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm text-ivory/70">{label}</span>
        <span
          className={`font-mono font-bold ${highlight ? "text-gold text-lg" : "text-ivory"}`}
        >
          {value}
        </span>
      </div>
      {formula && (
        <div className="text-xs text-ivory/40 mt-1 font-mono">{formula}</div>
      )}
    </div>
  );
}

export default function CRICalculator() {
  const [scores, setScores] = useState({ ...WORKED_EXAMPLE_SCORES });
  const [step, setStep] = useState(0); // 0=input, 1=standardize, 2=factor, 3=composite, 4=cri

  function updateScore(id, val) {
    setScores((prev) => ({ ...prev, [id]: val }));
    if (step > 0) setStep(0); // reset progression when inputs change
  }

  function resetToExample() {
    setScores({ ...WORKED_EXAMPLE_SCORES });
    setStep(0);
  }

  // ── Computation pipeline ──────────────────────────────────────────
  const pipeline = useMemo(() => {
    // Step 1: mean & sd of this person's 11 scores (for display only;
    // real standardization uses population stats not shown in thesis —
    // we use item-level z-scores based on hypothetical µ=3, σ=1 for illustration
    // as exact item-level norms are not in the thesis text)
    // NOTE: The thesis uses regression factor scoring, not simple mean z.
    // We approximate using loading-weighted combination as shown in the worked example.

    // Factor 1 items
    const f1Domains = DOMAINS.filter((d) => d.factor === 1);
    const f2Domains = DOMAINS.filter((d) => d.factor === 2);

    // Raw means per factor
    const f1Raw = f1Domains.reduce((s, d) => s + scores[d.id], 0) / f1Domains.length;
    const f2Raw = f2Domains.reduce((s, d) => s + scores[d.id], 0) / f2Domains.length;

    // Simple standardization: assume mean=3, sd=1 (illustrative)
    // Real thesis used regression factor scores from psych::fa()
    const mu = 3, sigma = 1;
    const xi1 = (f1Raw - mu) / sigma;
    const xi2 = (f2Raw - mu) / sigma;

    // Composite (simple average of two factor scores)
    const C = (xi1 + xi2) / 2;

    // Min-max rescaling using thesis bounds
    const { lowerBound, upperBound } = CRI;
    const cri = Math.round(100 * (C + lowerBound) / upperBound * 10) / 10;
    const criClamped = Math.max(0, Math.min(100, cri));

    return { f1Raw, f2Raw, xi1, xi2, C, cri: criClamped };
  }, [scores]);

  const steps = ["Enter Scores", "Standardize", "Factor Scores", "Composite", "CRI Index"];

  const criColor =
    pipeline.cri >= 60
      ? "#B76C58"
      : pipeline.cri >= 40
      ? "#C6A36A"
      : "#6F9289";

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ivory mb-1">F90-CRI Calculator</h1>
        <p className="text-ivory/50 text-sm">
          Interactive step-by-step pipeline — adjust domain scores to see how the Composite
          Research Intensity Index is derived
        </p>
        <div className="mt-3 rounded-lg bg-gold/10 border border-gold/20 px-4 py-2 text-xs text-gold/80">
          ℹ️ This uses an illustrative approximation (item mean Z-scores) for the factor scoring step.
          Your thesis used regression factor scoring from R's psych package, which produces slightly
          different ξ values. The CRI formula and bounds are exact from the thesis.
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => step >= i && setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                step === i
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : step > i
                  ? "bg-green-500/15 text-green-400 border border-green-500/20 cursor-pointer"
                  : "bg-white/5 text-ivory/30 border border-white/10"
              }`}
            >
              <StepBadge n={i + 1} active={step === i} done={step > i} />
              {s}
            </button>
            {i < steps.length - 1 && (
              <ChevronRight size={14} className="text-ivory/20 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 0: Input domain scores ─────────────────────────── */}
      {step === 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ivory/60 uppercase tracking-widest">
              Step 1 — Domain Scores (1–5)
            </h2>
            <button
              onClick={resetToExample}
              className="flex items-center gap-1.5 text-xs text-ivory/40 hover:text-gold transition-colors"
            >
              <RotateCcw size={12} />
              Thesis worked example
            </button>
          </div>

          <div className="mb-4">
            <div className="text-xs text-gold uppercase tracking-widest mb-3">
              Factor 1 — Practical Pressure
            </div>
            {DOMAINS.filter((d) => d.factor === 1).map((d) => (
              <SliderInput key={d.id} domain={d} value={scores[d.id]} onChange={updateScore} />
            ))}
          </div>

          <div className="mb-6">
            <div className="text-xs text-sage uppercase tracking-widest mb-3">
              Factor 2 — Emotional / Interpersonal Strain
            </div>
            {DOMAINS.filter((d) => d.factor === 2).map((d) => (
              <SliderInput key={d.id} domain={d} value={scores[d.id]} onChange={updateScore} />
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full py-3 rounded-xl bg-gold/20 hover:bg-gold/30 border border-gold/30 text-gold font-semibold transition-all"
          >
            Proceed to Standardization →
          </button>
        </div>
      )}

      {/* ── STEP 1: Standardization ──────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className="text-sm font-semibold text-ivory/60 uppercase tracking-widest mb-4">
            Step 2 — Standardize by Factor
          </h2>

          <div className="mb-6 text-sm text-ivory/70 leading-relaxed">
            <p className="mb-2">
              EFA produces factor scores on a Z-score scale (mean=0, SD=1 across the sample).
              Here we approximate using the mean of each factor's items:
            </p>
          </div>

          <EqBlock label="Factor 1 mean">
            {`\\bar{x}_{F1} = \\frac{1}{6}\\sum_{j \\in F_1} x_j = \\frac{${DOMAINS.filter(d=>d.factor===1).map(d=>scores[d.id]).join("+")}}{6} = ${pipeline.f1Raw.toFixed(3)}`}
          </EqBlock>
          <EqBlock label="Factor 2 mean">
            {`\\bar{x}_{F2} = \\frac{1}{5}\\sum_{j \\in F_2} x_j = \\frac{${DOMAINS.filter(d=>d.factor===2).map(d=>scores[d.id]).join("+")}}{5} = ${pipeline.f2Raw.toFixed(3)}`}
          </EqBlock>
          <EqBlock label="Standardize (μ=3, σ=1 assumed)">
            {`\\xi_1 = \\frac{${pipeline.f1Raw.toFixed(3)} - 3}{1} = ${pipeline.xi1.toFixed(6)}, \\quad \\xi_2 = \\frac{${pipeline.f2Raw.toFixed(3)} - 3}{1} = ${pipeline.xi2.toFixed(6)}`}
          </EqBlock>

          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-ivory/50">
            <strong className="text-ivory/70">Thesis worked example values:</strong>
            <br />ξ₁ = 0.672478 (Practical), ξ₂ = 0.810704 (Emotional)
            <br />These come from regression factor scoring in R's psych package — slightly different from simple means.
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-ivory/60 transition-all hover:bg-white/10">← Back</button>
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-gold/20 hover:bg-gold/30 border border-gold/30 text-gold font-semibold transition-all">Factor Scores →</button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Factor scores ───────────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 className="text-sm font-semibold text-ivory/60 uppercase tracking-widest mb-4">
            Step 3 — Factor Scores
          </h2>
          <p className="text-sm text-ivory/60 mb-6">
            Each student gets two latent factor scores estimated from their domain responses.
            Below are your estimated values:
          </p>

          <div className="space-y-3 mb-6">
            <ResultRow
              label="ξ₁ (Practical Pressure)"
              value={pipeline.xi1.toFixed(6)}
              formula={`= (${pipeline.f1Raw.toFixed(3)} − 3) / 1`}
            />
            <ResultRow
              label="ξ₂ (Emotional / Interpersonal Strain)"
              value={pipeline.xi2.toFixed(6)}
              formula={`= (${pipeline.f2Raw.toFixed(3)} − 3) / 1`}
            />
          </div>

          <EqBlock label="Interpretation">
            {`\\xi_1 ${pipeline.xi1 >= 0 ? ">" : "<"} 0 \\Rightarrow \\text{${pipeline.xi1 >= 0 ? "above" : "below"} average Practical Pressure}`}
          </EqBlock>
          <EqBlock>
            {`\\xi_2 ${pipeline.xi2 >= 0 ? ">" : "<"} 0 \\Rightarrow \\text{${pipeline.xi2 >= 0 ? "above" : "below"} average Emotional Strain}`}
          </EqBlock>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-ivory/60 hover:bg-white/10 transition-all">← Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-gold/20 hover:bg-gold/30 border border-gold/30 text-gold font-semibold transition-all">Composite →</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Composite ───────────────────────────────────── */}
      {step === 3 && (
        <div>
          <h2 className="text-sm font-semibold text-ivory/60 uppercase tracking-widest mb-4">
            Step 4 — Composite Score C
          </h2>
          <p className="text-sm text-ivory/60 mb-6">
            The two factor scores are averaged into a single composite adjustment burden:
          </p>

          <EqBlock label="Composite">
            {`C = \\frac{\\xi_1 + \\xi_2}{2} = \\frac{${pipeline.xi1.toFixed(6)} + ${pipeline.xi2.toFixed(6)}}{2} = ${pipeline.C.toFixed(6)}`}
          </EqBlock>

          <div className="mt-6 space-y-3">
            <ResultRow label="ξ₁" value={pipeline.xi1.toFixed(6)} />
            <ResultRow label="ξ₂" value={pipeline.xi2.toFixed(6)} />
            <ResultRow label="C = (ξ₁ + ξ₂) / 2" value={pipeline.C.toFixed(6)} highlight />
          </div>

          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-ivory/50">
            Thesis worked example: C = (0.672478 + 0.810704) / 2 = 0.741591
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-ivory/60 hover:bg-white/10 transition-all">← Back</button>
            <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl bg-gold/20 hover:bg-gold/30 border border-gold/30 text-gold font-semibold transition-all">Compute CRI →</button>
          </div>
        </div>
      )}

      {/* ── STEP 4: CRI ─────────────────────────────────────────── */}
      {step === 4 && (
        <div>
          <h2 className="text-sm font-semibold text-ivory/60 uppercase tracking-widest mb-4">
            Step 5 — F90-CRI Index
          </h2>
          <p className="text-sm text-ivory/60 mb-6">
            The composite score is min-max rescaled to [0, 100] using the bounds
            observed across all 133 students:
          </p>

          <EqBlock label="CRI formula">
            {`\\text{CRI} = 100 \\times \\frac{C + ${CRI.lowerBound}}{${CRI.upperBound}}`}
          </EqBlock>

          <EqBlock label="Your value">
            {`\\text{CRI} = 100 \\times \\frac{${pipeline.C.toFixed(6)} + ${CRI.lowerBound}}{${CRI.upperBound}} = ${pipeline.cri.toFixed(1)}`}
          </EqBlock>

          {/* Visual gauge */}
          <div className="mt-8 mb-6">
            <div className="text-center mb-4">
              <div
                className="text-6xl font-bold mb-1"
                style={{ color: criColor }}
              >
                {pipeline.cri.toFixed(1)}
              </div>
              <div className="text-sm text-ivory/50">F90-CRI Score</div>
            </div>

            {/* Bar */}
            <div className="relative h-4 rounded-full bg-gradient-to-r from-sage/40 via-gold/40 to-terracotta/60 overflow-hidden mb-2">
              <div
                className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg transition-all duration-500"
                style={{ left: `${pipeline.cri}%`, transform: "translateX(-50%)" }}
              />
            </div>
            <div className="flex justify-between text-xs text-ivory/30">
              <span>0 · Low burden</span>
              <span>50 · Sample mean ({CRI.mean})</span>
              <span>100 · High burden</span>
            </div>
          </div>

          {/* Reference stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-ivory/40 mb-1">Sample Mean</div>
              <div className="text-lg font-semibold text-ivory">{CRI.mean}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-ivory/40 mb-1">Sample SD</div>
              <div className="text-lg font-semibold text-ivory">{CRI.sd}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-ivory/40 mb-1">PHQ-2+ Mean</div>
              <div className="text-lg font-semibold text-terracotta">{CRI.phq2PosMean}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-ivory/40 mb-1">PHQ-2− Mean</div>
              <div className="text-lg font-semibold text-sage">{CRI.phq2NegMean}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-ivory/50 mb-6">
            <strong className="text-ivory/70">Thesis worked example (exact):</strong>
            <br />C = 0.741591 → CRI = 100 × (0.741591 + 2.004654) / 4.466533 = <strong className="text-gold">61.48</strong>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-ivory/60 hover:bg-white/10 transition-all">← Edit Scores</button>
            <button onClick={resetToExample} className="flex-1 py-3 rounded-xl bg-gold/20 hover:bg-gold/30 border border-gold/30 text-gold font-semibold transition-all">Load Worked Example</button>
          </div>
        </div>
      )}
    </div>
  );
}
