/**
 * LASSO Coefficient Path Visualizer
 * Slider for λ; shows how predictors shrink to zero as λ increases.
 * Uses illustrative data consistent with thesis λ.min / λ.1se results.
 */
import React, { useState, useMemo } from "react";
import { EqBlock, Eq } from "../KaTeX.jsx";

const LAMBDA_MIN = 0.012; // approx λ.min from nested CV
const LAMBDA_1SE = 0.048; // approx λ.1se

// Illustrative coefficient paths for 11 predictors
// These are inspired by the thesis results (Emotional factor dominates at λ.1se)
// but are stylized — exact paths require the actual glmnet model object
const PREDICTORS = [
  { id: "advisor",    label: "Advisor Relationship",        maxBeta: 0.72,  shrinkAt: 0.015, factor: 2 },
  { id: "belonging",  label: "Sense of Belonging",          maxBeta: 0.61,  shrinkAt: 0.022, factor: 2 },
  { id: "financial",  label: "Financial Strain",            maxBeta: 0.55,  shrinkAt: 0.035, factor: 1 },
  { id: "isolation",  label: "Social Isolation",            maxBeta: 0.49,  shrinkAt: 0.040, factor: 2 },
  { id: "academic",   label: "Academic Pressure",           maxBeta: 0.44,  shrinkAt: 0.052, factor: 1 },
  { id: "workload",   label: "Research Workload",           maxBeta: 0.38,  shrinkAt: 0.060, factor: 1 },
  { id: "worklife",   label: "Work-Life Balance",           maxBeta: 0.31,  shrinkAt: 0.070, factor: 2 },
  { id: "career",     label: "Career Uncertainty",          maxBeta: 0.27,  shrinkAt: 0.085, factor: 1 },
  { id: "time",       label: "Time Management",             maxBeta: 0.21,  shrinkAt: 0.100, factor: 1 },
  { id: "housing",    label: "Housing & Living Conditions", maxBeta: 0.17,  shrinkAt: 0.110, factor: 1 },
  { id: "discrim",    label: "Discrimination",              maxBeta: 0.14,  shrinkAt: 0.130, factor: 2 },
];

// Soft-threshold approximation for LASSO path
function getLassoBeta(pred, lambda) {
  const ols = pred.maxBeta;
  const threshold = pred.shrinkAt;
  // Approximate: beta decreases linearly from maxBeta as lambda increases
  const effective = ols * Math.max(0, 1 - lambda / threshold);
  return Math.max(0, effective);
}

const COLORS = {
  1: "#C6A36A", // gold — Practical
  2: "#6F9289", // sage — Emotional
};

export default function LASSOPath() {
  const [lambda, setLambda] = useState(LAMBDA_MIN);

  const betas = useMemo(() =>
    PREDICTORS.map((p) => ({
      ...p,
      beta: getLassoBeta(p, lambda),
    })).sort((a, b) => b.beta - a.beta),
    [lambda]
  );

  const selectedCount = betas.filter((b) => b.beta > 0.001).length;
  const isLambdaMin = Math.abs(lambda - LAMBDA_MIN) < 0.002;
  const isLambda1se = Math.abs(lambda - LAMBDA_1SE) < 0.003;

  const logLambda = Math.log(lambda);
  const logMin = Math.log(0.005);
  const logMax = Math.log(0.3);
  const sliderPct = ((logLambda - logMin) / (logMax - logMin)) * 100;

  return (
    <div className="rounded-xl bg-navy-800/60 border border-white/10 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-ivory mb-1">
          LASSO Coefficient Path
        </h3>
        <p className="text-xs text-ivory/50">
          Drag λ to see how coefficients shrink to zero as regularization increases.
          Illustrative paths — consistent with thesis λ.min / λ.1se results.
        </p>
      </div>

      {/* Lambda slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-ivory/60">
            Regularization strength: <span className="text-gold font-mono">λ = {lambda.toFixed(4)}</span>
          </label>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isLambdaMin ? "bg-gold/20 text-gold border border-gold/30"
            : isLambda1se ? "bg-terracotta/20 text-terracotta border border-terracotta/30"
            : "text-ivory/30"
          }`}>
            {isLambdaMin ? "λ.min (AUC=0.861)" : isLambda1se ? "λ.1se (AUC=0.836)" : `${selectedCount} predictors`}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={sliderPct}
          onChange={(e) => {
            const pct = Number(e.target.value) / 100;
            setLambda(Math.exp(logMin + pct * (logMax - logMin)));
          }}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #C6A36A ${sliderPct}%, rgba(255,255,255,0.1) ${sliderPct}%)`,
          }}
        />

        <div className="flex justify-between text-xs text-ivory/30 mt-1">
          <span>Low λ — complex (all predictors)</span>
          <span>High λ — sparse (few predictors)</span>
        </div>

        {/* Reference markers */}
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => setLambda(LAMBDA_MIN)}
            className="text-xs px-2 py-1 rounded bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-colors"
          >
            Set λ.min
          </button>
          <button
            onClick={() => setLambda(LAMBDA_1SE)}
            className="text-xs px-2 py-1 rounded bg-terracotta/10 text-terracotta border border-terracotta/20 hover:bg-terracotta/20 transition-colors"
          >
            Set λ.1se
          </button>
        </div>
      </div>

      {/* Coefficient bars */}
      <div className="space-y-2 mb-4">
        {betas.map((pred) => {
          const pct = (pred.beta / 0.75) * 100;
          const color = COLORS[pred.factor];
          const active = pred.beta > 0.001;
          return (
            <div key={pred.id} className={`transition-opacity ${active ? "opacity-100" : "opacity-30"}`}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className={`text-xs ${active ? "text-ivory/80" : "text-ivory/30"}`}>
                    {pred.label}
                  </span>
                </div>
                <span className="text-xs font-mono" style={{ color: active ? color : "rgba(246,242,233,0.2)" }}>
                  {active ? pred.beta.toFixed(3) : "0.000"}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${pct}%`, background: color, opacity: active ? 1 : 0.1 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-ivory/40 border-t border-white/10 pt-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <span>Factor 1 — Practical</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-sage" />
          <span>Factor 2 — Emotional</span>
        </div>
        <div className="ml-auto">
          {selectedCount} / 11 active
        </div>
      </div>
    </div>
  );
}
