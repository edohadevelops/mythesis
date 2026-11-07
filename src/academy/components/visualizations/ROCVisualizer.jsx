/**
 * ROC Curve Visualizer
 * Shows approximate ROC curve for λ.min and λ.1se models,
 * with threshold slider to explore sensitivity/specificity tradeoff.
 */
import React, { useState, useMemo } from "react";
import { LASSO } from "../../data/thesisResults.js";

// Generate approximate ROC points using a beta distribution model
// that hits known AUC targets
function generateROCPoints(auc, numPoints = 100) {
  const points = [{ fpr: 0, tpr: 0 }];

  for (let i = 1; i <= numPoints; i++) {
    const fpr = i / numPoints;
    // Power model: TPR = FPR^(1/k) where k is calibrated to hit the target AUC
    // AUC ≈ k/(k+1) for this model
    const k = auc / (1 - auc);
    const tpr = Math.pow(fpr, 1 / k);
    points.push({ fpr, tpr });
  }

  points.push({ fpr: 1, tpr: 1 });
  return points;
}

function pointsToPath(points, w, h, pad) {
  return points
    .map((p, i) => {
      const x = pad + p.fpr * (w - 2 * pad);
      const y = h - pad - p.tpr * (h - 2 * pad);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function ROCVisualizer() {
  const [threshold, setThreshold] = useState(0.5);
  const [showBoth, setShowBoth] = useState(true);

  const W = 280, H = 240, PAD = 28;

  const rocMin = useMemo(() => generateROCPoints(LASSO.lambdaMin.auc), []);
  const roc1se = useMemo(() => generateROCPoints(LASSO.lambda1se.auc), []);

  // Find operating point at threshold
  const getOp = (rocPoints) => {
    const idx = Math.round(threshold * rocPoints.length);
    return rocPoints[Math.min(idx, rocPoints.length - 1)];
  };

  const opMin = getOp(rocMin);
  const op1se = getOp(roc1se);

  const pathMin = useMemo(() => pointsToPath(rocMin, W, H, PAD), [rocMin]);
  const path1se = useMemo(() => pointsToPath(roc1se, W, H, PAD), [roc1se]);

  const toX = (fpr) => PAD + fpr * (W - 2 * PAD);
  const toY = (tpr) => H - PAD - tpr * (H - 2 * PAD);

  const sens = opMin.tpr;
  const spec = 1 - opMin.fpr;

  return (
    <div className="rounded-xl bg-navy-800/60 border border-white/10 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-ivory mb-1">
          ROC Curve Explorer
        </h3>
        <p className="text-xs text-ivory/50">
          Approximate curves for λ.min (AUC={LASSO.lambdaMin.auc}) and λ.1se (AUC={LASSO.lambda1se.auc}).
          Drag threshold to explore sensitivity/specificity tradeoff.
        </p>
      </div>

      {/* AUC comparison */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 rounded-lg bg-gold/10 border border-gold/20 p-3 text-center">
          <div className="text-xs text-gold/60 mb-0.5">λ.min AUC</div>
          <div className="text-xl font-bold text-gold">{LASSO.lambdaMin.auc}</div>
          <div className="text-xs text-ivory/40">~{LASSO.lambdaMin.meanSelected} predictors</div>
        </div>
        <div className="flex-1 rounded-lg bg-terracotta/10 border border-terracotta/20 p-3 text-center">
          <div className="text-xs text-terracotta/60 mb-0.5">λ.1se AUC</div>
          <div className="text-xl font-bold text-terracotta">{LASSO.lambda1se.auc}</div>
          <div className="text-xs text-ivory/40">~{LASSO.lambda1se.meanSelected} predictors</div>
        </div>
        <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-3 text-center">
          <div className="text-xs text-ivory/40 mb-0.5">Null AUC</div>
          <div className="text-xl font-bold text-ivory/30">0.500</div>
          <div className="text-xs text-ivory/20">random chance</div>
        </div>
      </div>

      {/* SVG chart */}
      <div className="flex justify-center mb-4">
        <svg width={W} height={H} className="overflow-visible">
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)}
                stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <line x1={toX(v)} y1={PAD} x2={toX(v)} y2={H - PAD}
                stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={PAD - 4} y={toY(v) + 4} fill="rgba(246,242,233,0.3)" fontSize={9} textAnchor="end">{v}</text>
              <text x={toX(v)} y={H - PAD + 14} fill="rgba(246,242,233,0.3)" fontSize={9} textAnchor="middle">{v}</text>
            </g>
          ))}

          {/* Diagonal (random) */}
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={PAD}
            stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 4" />
          <text x={toX(0.65)} y={toY(0.70)} fill="rgba(255,255,255,0.2)" fontSize={8}>Random</text>

          {/* λ.1se curve */}
          {showBoth && (
            <path d={path1se} fill="none" stroke="#B76C58" strokeWidth={1.5} opacity={0.6} />
          )}

          {/* λ.min curve */}
          <path d={pathMin} fill="none" stroke="#C6A36A" strokeWidth={2} />

          {/* Operating point (λ.min) */}
          <circle
            cx={toX(opMin.fpr)} cy={toY(opMin.tpr)}
            r={5} fill="#C6A36A" stroke="#101D32" strokeWidth={2}
          />

          {/* Axes */}
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD}
            stroke="rgba(246,242,233,0.3)" strokeWidth={1} />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD}
            stroke="rgba(246,242,233,0.3)" strokeWidth={1} />

          {/* Labels */}
          <text x={W / 2} y={H} fill="rgba(246,242,233,0.5)" fontSize={9} textAnchor="middle">
            1 − Specificity (FPR)
          </text>
          <text
            x={10} y={H / 2}
            fill="rgba(246,242,233,0.5)" fontSize={9} textAnchor="middle"
            transform={`rotate(-90, 10, ${H / 2})`}
          >
            Sensitivity (TPR)
          </text>
        </svg>
      </div>

      {/* Threshold slider */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-ivory/50 mb-1">
          <span>Classification threshold: <span className="text-gold font-mono">{threshold.toFixed(2)}</span></span>
        </div>
        <input
          type="range" min={0} max={1} step={0.01} value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #C6A36A ${threshold * 100}%, rgba(255,255,255,0.1) ${threshold * 100}%)`,
          }}
        />
        <div className="flex justify-between text-xs text-ivory/20 mt-0.5">
          <span>0 → all positive</span>
          <span>1 → all negative</span>
        </div>
      </div>

      {/* Operating metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="rounded-lg bg-white/5 border border-white/8 p-2 text-center">
          <div className="text-ivory/40 mb-0.5">Sensitivity</div>
          <div className="text-gold font-mono font-semibold">{(sens * 100).toFixed(0)}%</div>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/8 p-2 text-center">
          <div className="text-ivory/40 mb-0.5">Specificity</div>
          <div className="text-gold font-mono font-semibold">{(spec * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setShowBoth(!showBoth)}
        className="text-xs text-ivory/40 hover:text-ivory/70 transition-colors"
      >
        {showBoth ? "Hide λ.1se curve" : "Show λ.1se curve"}
      </button>
    </div>
  );
}
