/**
 * Mock defense questions — all grounded in the actual thesis
 * Categories: math_foundations, methodology, results, limitations, big_picture
 */

export const DEFENSE_QUESTIONS = [
  // ── MATH & METHODOLOGY ─────────────────────────────────────────
  {
    id: "def-m1",
    category: "methodology",
    difficulty: "medium",
    question:
      "Walk me through your decision to use exploratory rather than confirmatory factor analysis. At what stage of the research would CFA become appropriate?",
    keyPoints: [
      "EFA is appropriate for initial scale development and theory generation",
      "CFA requires a priori specification of the factor structure — appropriate for replication or theory testing",
      "Your study is exploratory: no prior validated 11-domain adjustment burden measure existed",
      "CFA in a future study on a new sample would test whether the 2-factor structure holds",
      "Using EFA and CFA on the same sample (double-dipping) inflates fit",
    ],
    sampleAnswer:
      "EFA was chosen because we were developing a new measurement instrument with no prior validated structure to confirm. The 11 survey domains were drawn from literature, but their factor structure had not been empirically tested. EFA let the data reveal the structure rather than imposing one. The natural next step is CFA on a new, independent sample to confirm whether the two-factor structure — Practical Pressure and Emotional/Interpersonal Strain — replicates.",
  },
  {
    id: "def-m2",
    category: "math_foundations",
    difficulty: "hard",
    question:
      "Your RMSEA is 0.098, which is above the 0.08 threshold often cited in the literature. How do you reconcile this with your claim of adequate model fit?",
    keyPoints: [
      "RMSEA is known to be inflated with small samples and few variables",
      "Kenny, Kaniskan & McCoach (2015): RMSEA routinely exceeds 0.10 in small-n EFA",
      "RMSR = 0.060 is good (< 0.08) and less sample-size-sensitive",
      "KMO = 0.822 confirms the matrix was suitable for factor analysis",
      "Multi-index approach: no single index is definitive",
      "Thresholds are guidelines, not absolute cutoffs",
    ],
    sampleAnswer:
      "RMSEA is known to be sensitive to sample size — with N=133 and 11 variables, elevated RMSEA is expected even when the model fits well locally. Kenny, Kaniskan & McCoach (2015) showed RMSEA frequently exceeds 0.10 in small-sample EFA. RMSR = 0.060 and KMO = 0.822 indicate good local fit. I reported all four indices precisely to give a complete picture, and I acknowledge the marginal RMSEA as a limitation in the manuscript.",
  },
  {
    id: "def-m3",
    category: "math_foundations",
    difficulty: "medium",
    question:
      "Explain why you used promax rotation and what the factor correlation of 0.395 tells us about your theoretical model.",
    keyPoints: [
      "Promax is an oblique rotation — allows factors to correlate",
      "Varimax forces orthogonality (r=0) — appropriate only when factors are independent",
      "Practical and emotional burden are theoretically related stressors",
      "r=0.395 confirms moderate correlation — not independent, not redundant",
      "Justifies the composite index (factors are related enough to combine)",
      "Also justifies keeping them separate (not so correlated they collapse to one)",
    ],
    sampleAnswer:
      "Promax rotation was chosen because practical and emotional adjustment burden are theoretically related — both are aspects of doctoral adjustment stress. Varimax would have imposed orthogonality (r=0) as an artifact, which is a mis-specification when constructs are related. The empirical correlation of 0.395 confirms they are moderately correlated — related but distinct. This is the ideal range: related enough to justify a composite index, distinct enough to warrant two separate dimensions.",
  },
  {
    id: "def-m4",
    category: "math_foundations",
    difficulty: "hard",
    question:
      "What is the difference between communality and uniqueness in your EFA, and how do your domain loadings relate to these?",
    keyPoints: [
      "Communality h²ᵢ = variance shared with the factors (Σ λ²ᵢⱼ under orthogonal; λᵢΦλᵢᵀ under oblique)",
      "Uniqueness = 1 − h² = variance specific to that item (not captured by factors)",
      "High loading (e.g., 0.782) → high communality → item well-represented by factors",
      "Items with low loadings on all factors have high uniqueness — may be redundant or measuring something else",
    ],
    sampleAnswer:
      "Communality (h²) is the proportion of an item's variance explained by all factors together. Under oblique rotation, it's λᵢΦλᵢᵀ. For Financial Strain with λ=0.782 on Factor 1, its communality from Factor 1 alone is roughly 0.782²=0.611, meaning ~61% of its variance is captured by Practical Pressure. Items with high communalities are well-represented by the factor model; high uniqueness means the item captures something beyond the extracted factors — not necessarily a problem, but worth noting if the goal is economy of measurement.",
  },

  // ── RESULTS ────────────────────────────────────────────────────
  {
    id: "def-r1",
    category: "results",
    difficulty: "easy",
    question:
      "Your data show that 50.38% of participants screened PHQ-2 positive. Is that an unusually high rate, and what does it mean for your study?",
    keyPoints: [
      "50.38% (67/133) is higher than general population prevalence of depression (~7-9%)",
      "Doctoral students represent a high-risk population",
      "PHQ-2 is a sensitivity-optimized screen, not a diagnostic tool — it identifies at-risk individuals",
      "High base rate strengthens statistical power for predicting PHQ-2 outcome",
      "Consistent with literature on doctoral student mental health (Levecque et al., 2017)",
    ],
    sampleAnswer:
      "50.38% PHQ-2 positive is high relative to general population rates (~7-9%), but doctoral students are a known high-risk population. Literature (e.g., Evans et al., 2018) consistently documents elevated depression and anxiety rates among graduate students. PHQ-2 is a sensitivity-optimized screen — it casts a wide net to identify at-risk individuals, so we expect higher positivity rates than diagnostic prevalence. This base rate is consistent with prior literature and strengthens the case that adjustment burden in the first 90 days is clinically salient.",
  },
  {
    id: "def-r2",
    category: "results",
    difficulty: "medium",
    question:
      "The practical factor's correlation with PHQ-2 is ρ=0.138, p=.113 — not significant. Does this undermine the value of including it in the composite index?",
    keyPoints: [
      "Non-significant does not mean 'no effect' — it means insufficient evidence to reject H₀ with this n",
      "ρ=0.138 is a small but non-zero effect",
      "The CRI is a measure of adjustment burden, not a predictor of depression — concurrent validity is one form of evidence, not the sole purpose",
      "Practical burden may predict other outcomes (retention, GPA, time-to-degree) not measured here",
      "Equal weighting is a theoretical choice — differential weighting is a future research direction",
    ],
    sampleAnswer:
      "The non-significant correlation doesn't undermine the practical factor's inclusion, for two reasons. First, the F90-CRI is designed to measure adjustment burden comprehensively — practical stressors are part of doctoral life even if they don't uniquely predict PHQ-2 in this sample. Second, PHQ-2 may not be the only relevant outcome; practical burden might better predict academic performance or retention, which weren't measured here. The null result is informative: it suggests the emotional dimension is the primary driver of depression risk, while practical burden contributes independently to overall adjustment difficulty.",
  },
  {
    id: "def-r3",
    category: "results",
    difficulty: "medium",
    question:
      "Your LASSO model at λ.1se achieves AUC=0.836 with approximately 2 predictors. What does this mean practically for identifying at-risk students?",
    keyPoints: [
      "AUC=0.836 = excellent discrimination (randomly drawn PHQ-2+ student outranks PHQ-2- student 83.6% of the time)",
      "~2 predictors = highly parsimonious — could be administered as a 2-domain screener",
      "Practical implication: programs may not need all 11 domains for initial screening",
      "Specific predictors at λ.1se should be identified from R output",
      "Clinical threshold (sensitivity/specificity tradeoff) must be chosen based on context",
    ],
    sampleAnswer:
      "AUC=0.836 means that if you randomly draw one PHQ-2-positive and one PHQ-2-negative student, the model correctly ranks the positive student higher 83.6% of the time — excellent discrimination. With only ~2 predictors, this suggests a potentially practical ultra-brief screener. The clinical implication: programs could collect just 2 domain scores during orientation to identify students at elevated risk for depression, enabling early intervention before the full burden accumulates.",
  },

  // ── LIMITATIONS & BIG PICTURE ──────────────────────────────────
  {
    id: "def-l1",
    category: "limitations",
    difficulty: "medium",
    question:
      "What are the top three limitations of your study, and how do they constrain the conclusions you can draw?",
    keyPoints: [
      "1. Cross-sectional design: cannot establish causality; adjustment burden → depression is correlational",
      "2. Single-institution sample: limits generalizability; institutional culture may moderate findings",
      "3. Self-report: social desirability bias; PHQ-2 as criterion has its own measurement error",
      "4. No test-retest: CRI reliability over time unknown",
      "5. EFA sample size: N=133 is adequate but not large for 11-variable EFA",
    ],
    sampleAnswer:
      "The three primary limitations are: First, the cross-sectional design. All data were collected at one time point, so we cannot establish that adjustment burden causes depression risk — only that they co-occur. A longitudinal design measuring burden at entry and mental health at multiple time points is needed. Second, single-institution sampling limits generalizability. The institutional culture, program structure, and support systems at this university may not reflect all doctoral programs. Third, self-report bias: both the adjustment survey and PHQ-2 rely on self-report, which can be influenced by social desirability, recall bias, and response set.",
  },
  {
    id: "def-l2",
    category: "big_picture",
    difficulty: "hard",
    question:
      "If a doctoral program wanted to implement the F90-CRI operationally, what would need to happen before it was ready for use?",
    keyPoints: [
      "CFA on independent sample to confirm structure",
      "Test-retest reliability study",
      "Establish clinical cutpoints (what CRI score triggers intervention?)",
      "Longitudinal validation linking CRI to actual attrition/completion outcomes",
      "Multi-site replication for generalizability",
      "IRB/ethics review for systematic screening programs",
      "Clinical decision-making framework (what happens when a student screens 'high'?)",
    ],
    sampleAnswer:
      "Before operational use, the CRI would need: (1) CFA on an independent sample to confirm the two-factor structure replicates; (2) test-retest reliability study to establish score stability; (3) longitudinal validation connecting baseline CRI to actual outcomes like attrition, time-to-degree, and mental health trajectories; (4) establishment of clinical cutpoints with sensitivity/specificity tradeoff analysis; (5) multi-site replication across institution types. This research contributes the foundational psychometric work; the path to implementation involves several more validation stages — which I position explicitly as future directions.",
  },
  {
    id: "def-l3",
    category: "big_picture",
    difficulty: "easy",
    question:
      "What is the central theoretical contribution of your thesis to the field of doctoral education research?",
    keyPoints: [
      "Novel composite index (F90-CRI) for the first 90 days specifically",
      "Two-dimensional structure of burden: practical vs. emotional",
      "Empirical link between multidimensional adjustment burden and depression risk",
      "Early warning system concept: burden in first 90 days is identifiable and measurable",
      "Separates practical and emotional dimensions — different interventions warranted",
    ],
    sampleAnswer:
      "The thesis makes three contributions: First, it introduces the F90-CRI — the first validated composite measure of adjustment burden specifically designed for the first 90 days of doctoral study. Second, it establishes empirically that adjustment burden is two-dimensional (practical and emotional), and that these dimensions have different relationships with depression risk — emotional burden being a much stronger predictor. Third, it demonstrates that measurable, potentially modifiable factors in the entry period correlate with depression risk, suggesting that early identification and targeted support during this window could meaningfully improve doctoral student wellbeing and persistence.",
  },
];

export const DEFENSE_CATEGORIES = [
  { id: "math_foundations", label: "Math Foundations", icon: "📐" },
  { id: "methodology", label: "Methodology", icon: "🔬" },
  { id: "results", label: "Results", icon: "📊" },
  { id: "limitations", label: "Limitations", icon: "⚠️" },
  { id: "big_picture", label: "Big Picture", icon: "🎓" },
];
