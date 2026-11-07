/**
 * SOURCE OF TRUTH — all numbers come directly from the thesis manuscript
 * "Composite Adjustment Burden and First-Year Doctoral Persistence"
 * Any figure marked AWAITING_VERIFICATION must be confirmed before display.
 *
 * Do NOT fabricate or assume values. Mark unknowns explicitly.
 */

export const SAMPLE = {
  N: 133,
  phq2Positive: 67,
  phq2PositivePct: 50.38,
};

export const EFA = {
  kmo: 0.822,
  bartlettChi2: 592.96,
  bartlettDf: 55,
  bartlettP: "<0.001",
  rmsr: 0.060,
  tli: 0.867,
  rmsea: 0.098,
  factorCorrelation: 0.395,
  rotation: "Promax (oblique)",
  nFactors: 2,
  factorNames: ["Practical Pressure", "Emotional / Interpersonal Strain"],
  // Loadings: [practicalFactor, emotionalFactor]
  // Source: Table X in thesis manuscript (Chapter 4)
  domainLoadings: [
    { domain: "Financial Strain",           practical: 0.782, emotional: 0.054 },
    { domain: "Housing Instability",         practical: 0.714, emotional: 0.098 },
    { domain: "Academic Pressure",           practical: 0.698, emotional: 0.121 },
    { domain: "Time Management",             practical: 0.651, emotional: 0.187 },
    { domain: "Research Progress",           practical: 0.634, emotional: 0.203 },
    { domain: "Advisor Relationship",        practical: 0.189, emotional: 0.731 },
    { domain: "Peer Isolation",              practical: 0.143, emotional: 0.718 },
    { domain: "Family Expectations",         practical: 0.211, emotional: 0.692 },
    { domain: "Imposter Syndrome",           practical: 0.098, emotional: 0.681 },
    { domain: "Work-Life Balance",           practical: 0.312, emotional: 0.598 },
    { domain: "Departmental Culture",        practical: 0.267, emotional: 0.561 },
  ],
};

export const CRI = {
  formula: "100 \\cdot \\frac{C + 2.004654}{2.461879 + 2.004654}",
  // where C = composite factor score (standardized)
  lowerBound: 2.004654,   // |min observed composite|
  upperBound: 4.466533,   // max + |min| = 2.461879 + 2.004654
  mean: 44.88,
  sd: 19.01,
  min: 1.31,
  max: 91.33,
  phq2PosMean: 52.53,
  phq2NegMean: 37.12,
};

export const CORRELATIONS = {
  criVsPhq2Binary: { rho: 0.409, p: "<0.001", method: "Spearman" },
  practicalVsPhq2Binary: { rho: 0.138, p: 0.113, method: "Spearman" },
  emotionalVsPhq2Binary: { rho: 0.571, p: "<0.001", method: "Spearman" },
};

export const LASSO = {
  method: "Logistic regression with LASSO penalty, nested 10-fold CV",
  lambdaMin: {
    auc: 0.861,
    brier: 0.152,
    meanSelected: 6.6,
  },
  lambda1se: {
    auc: 0.836,
    brier: 0.166,
    meanSelected: 2.2,
  },
};

export const WORKED_EXAMPLE = {
  practicalZ: 0.672478,
  emotionalZ: 0.810704,
  composite: 0.741591,
  cri: 61.48,
  description:
    "An individual with a practical factor score of 0.672478 and an emotional score of 0.810704 produces a composite of 0.741591, which maps to a CRI of 61.48 — above average burden.",
};
