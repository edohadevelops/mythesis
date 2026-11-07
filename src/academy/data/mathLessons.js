/**
 * Math lessons — all 6 foundational topics for F90 Thesis Defense
 * Each lesson follows: intuition → formal definition → notation →
 *   derivation → thesis application → defense readiness
 *
 * Questions: answered BEFORE solution is revealed (active recall)
 */

export const MATH_LESSONS = [
  // ══════════════════════════════════════════════════════════════════
  // LESSON 1: Factor Analysis & EFA
  // ══════════════════════════════════════════════════════════════════
  {
    id: "efa",
    title: "Exploratory Factor Analysis (EFA)",
    subtitle: "Discovering hidden structure in multivariate data",
    color: "#C6A36A",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `Imagine you ask 133 doctoral students 11 questions about adjustment stress.
You notice that students who score high on "financial strain" tend to also score high on
"housing instability" and "academic pressure" — but not necessarily on "advisor relationship."
Meanwhile, "imposter syndrome," "peer isolation," and "advisor relationship" cluster together.

EFA asks: **How many underlying forces (factors) explain these correlations?**
Instead of working with 11 separate scores, we find 2 latent dimensions that account for
most of the covariance. This is the core move your thesis makes.`,
      },
      {
        type: "definition",
        heading: "Formal Definition",
        content: `The EFA model for observed variable $x_i$ (standardized):`,
        latex: `x_i = \\lambda_{i1}\\xi_1 + \\lambda_{i2}\\xi_2 + \\cdots + \\lambda_{im}\\xi_m + \\delta_i`,
        content2: `Where:
• $x_i$ = observed score on domain $i$ (e.g., financial strain)
• $\\lambda_{ij}$ = factor loading of item $i$ on factor $j$ (how strongly item $i$ reflects that factor)
• $\\xi_j$ = latent factor $j$ (unobserved; this is what we're estimating)
• $\\delta_i$ = unique variance (error specific to item $i$, not shared)
• $m$ = number of factors (we chose $m=2$ based on fit indices)`,
      },
      {
        type: "notation",
        heading: "Key Symbols & Notation",
        latex_table: [
          ["\\Lambda", "Factor loading matrix (p \\times m)"],
          ["\\Phi", "Factor correlation matrix (m \\times m) — not identity under oblique rotation"],
          ["\\Psi", "Diagonal matrix of unique variances"],
          ["\\Sigma", "Reproduced covariance matrix: \\Sigma = \\Lambda\\Phi\\Lambda^T + \\Psi"],
          ["\\hat{\\Sigma}", "Sample covariance/correlation matrix (what we observe)"],
          ["\\text{RMSR}", "Root mean square residual: how well \\Sigma fits \\hat{\\Sigma}"],
          ["\\text{TLI}", "Tucker-Lewis Index: fit > 0.95 excellent; your thesis: 0.867"],
          ["\\text{RMSEA}", "Root mean square error of approximation; < 0.08 good; your thesis: 0.098"],
        ],
      },
      {
        type: "derivation",
        heading: "How EFA Is Computed",
        content: `The estimation problem: given the sample correlation matrix $\\hat{R}$, find $\\Lambda$ and $\\Psi$ such that the reproduced matrix $\\hat{R} \\approx \\Lambda\\Phi\\Lambda^T + \\Psi$.

**Step 1 — Eigendecomposition** of $\\hat{R}$:`,
        latex: `\\hat{R} = Q\\Lambda_{eig}Q^T`,
        content2: `Eigenvalues $\\lambda_1 \\geq \\lambda_2 \\geq \\cdots \\geq \\lambda_p$ indicate how much variance each potential factor explains.

**Step 2 — Factor retention**: Parallel analysis (your thesis) compares observed eigenvalues with those from random data of the same size (133 × 11). Retain factors whose eigenvalue exceeds the random baseline.

**Step 3 — Rotation**: Unrotated solutions are mathematically but not conceptually clean. Promax (oblique) rotation allows factors to correlate ($\\Phi \\neq I$) — appropriate because practical and emotional burden **are** related (r = 0.395 in your thesis).`,
        latex2: `\\Lambda^* = \\Lambda P`,
        content3: `where $P$ is the rotation matrix that maximises simple structure (each item loads high on one factor, near-zero on others).`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `Your two-factor solution:
• **Factor 1 — Practical Pressure**: Financial strain (λ=0.782), Housing instability (0.714), Academic pressure (0.698), Time management (0.651), Research progress (0.634)
• **Factor 2 — Emotional/Interpersonal Strain**: Advisor relationship (0.731), Peer isolation (0.718), Family expectations (0.692), Imposter syndrome (0.681)

Fit: KMO = 0.822 ("meritorious"), Bartlett's χ²(55) = 592.96, p < .001, RMSR = 0.060, TLI = 0.867, RMSEA = 0.098. The factor correlation was 0.395 — moderate, justifying oblique rotation and a composite index.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "Why not PCA? PCA maximises variance; EFA models a latent causal structure where factors *cause* item scores. For theory-driven work like yours, EFA is correct.",
          "Why oblique (promax) not orthogonal (varimax)? Practical and emotional burden are theoretically and empirically correlated (r=0.395). Forcing orthogonality would be a mis-specification.",
          "Why 2 factors? Parallel analysis of your 11-item, N=133 data recommended 2; scree plot supported it; interpretability was clear.",
          "RMSEA of 0.098 is marginal — defend it: with 11 items and N=133, the two-factor model is parsimonious; RMSR=0.060 and TLI=0.867 are more sensitive to your sample size.",
          "What is KMO? Kaiser-Meyer-Olkin measure of sampling adequacy (0.822). Tests whether your correlation matrix is suitable for factor analysis. Rule of thumb: > 0.8 = 'meritorious'.",
        ],
      },
    ],
    questions: [
      {
        id: "efa-q1",
        stem: "In your EFA model, what does the factor loading λ₁₁ = 0.782 for 'Financial Strain' on Factor 1 mean?",
        options: [
          { id: "a", text: "61.1% of variance in financial strain scores is explained by Factor 1" },
          { id: "b", text: "Financial strain correlates 0.782 with the total composite score" },
          { id: "c", text: "A one-unit increase in Factor 1 is associated with a 0.782 SD increase in financial strain" },
          { id: "d", text: "Factor 1 explains 78.2% of all variance in the data" },
        ],
        correct: "c",
        explanation: `Factor loadings are regression coefficients in the EFA model: $x_i = \\lambda_{i1}\\xi_1 + \\lambda_{i2}\\xi_2 + \\delta_i$. λ₁₁ = 0.782 means a 1 SD increase in Practical Pressure (Factor 1) corresponds to a 0.782 SD increase in financial strain scores. The squared loading (0.782² ≈ 0.611) gives the communality contribution from Factor 1 alone.`,
      },
      {
        id: "efa-q2",
        stem: "A committee member asks why you used promax rotation instead of varimax. The best answer is:",
        options: [
          { id: "a", text: "Promax is always more accurate than varimax for social science data" },
          { id: "b", text: "Varimax requires a larger sample size, which you didn't have" },
          { id: "c", text: "Practical and emotional burden are theoretically and empirically correlated (r=0.395), so allowing factors to correlate is more realistic than forcing orthogonality" },
          { id: "d", text: "Promax rotation is required when RMSEA > 0.08" },
        ],
        correct: "c",
        explanation: `Varimax constrains factors to be uncorrelated (orthogonal). When the latent constructs are conceptually related — practical and emotional stress are both stressors — oblique rotation (promax) is theoretically appropriate. The empirical correlation of 0.395 confirms they aren't orthogonal.`,
      },
      {
        id: "efa-q3",
        stem: "Your KMO = 0.822. If a reviewer asks what this tests, the correct answer is:",
        options: [
          { id: "a", text: "Whether your sample size is large enough for inferential statistics" },
          { id: "b", text: "Whether the correlation matrix is factorable — i.e., whether items share enough common variance to support factor extraction" },
          { id: "c", text: "Whether each factor's eigenvalue exceeds 1.0 (Kaiser criterion)" },
          { id: "d", text: "Whether your factors are significantly correlated with the PHQ-2 outcome" },
        ],
        correct: "b",
        explanation: `KMO compares the magnitude of observed correlations with partial correlations. High KMO (> 0.8) means partial correlations are small relative to ordinary correlations — the items share common variance that factor analysis can extract. KMO = 0.822 ("meritorious") means your 11-item battery is well-suited for EFA.`,
      },
      {
        id: "efa-q4",
        stem: "What is the reproduced correlation matrix Σ = ΛΦΛᵀ + Ψ, and why does RMSR matter?",
        options: [
          { id: "a", text: "Σ is the observed correlation matrix; RMSR tells you if your sample is large enough" },
          { id: "b", text: "Σ is the correlation matrix predicted by your factor model; RMSR measures how well it matches the observed correlations (smaller = better)" },
          { id: "c", text: "Σ is the covariance matrix of your 11 raw scores; RMSR is the standard deviation of residuals" },
          { id: "d", text: "Σ is the rotation matrix; RMSR tells you if rotation converged" },
        ],
        correct: "b",
        explanation: `EFA fits a model that generates a reproduced correlation matrix Σ. The discrepancy between Σ and the sample matrix $\\hat{R}$ is measured by RMSR = $\\sqrt{\\text{mean}(r_{ij} - \\hat{r}_{ij})^2}$. Your RMSR = 0.060 indicates residual correlations average only ±0.06 — good fit.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 2: Composite Index Construction
  // ══════════════════════════════════════════════════════════════════
  {
    id: "cri",
    title: "Composite Index Construction (F90-CRI)",
    subtitle: "From factor scores to a 0–100 interpretable scale",
    color: "#6F9289",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `You have two factor scores per person: a Practical Pressure score and an Emotional Strain score.
These are on a standardized (Z-score) scale — mean 0, SD 1 — which is hard to interpret clinically.
You want a single number, 0–100, where higher = more adjustment burden.

The challenge: simply averaging two Z-scores is arbitrary. You need a principled weighted average,
then a min-max rescaling that maps the observed range to [0, 100].
That's the F90-CRI.`,
      },
      {
        type: "definition",
        heading: "The Formula",
        content: `Step 1 — Weighted composite (equal weights for two factors):`,
        latex: `C = \\frac{\\xi_1 + \\xi_2}{2}`,
        content2: `Step 2 — Min-max rescaling to [0, 100]:`,
        latex: `\\text{F90-CRI} = 100 \\cdot \\frac{C - C_{\\min}}{C_{\\max} - C_{\\min}} = 100 \\cdot \\frac{C + 2.004654}{2.461879 + 2.004654}`,
        content3: `Where:
• $C_{\\min} = -2.004654$ (most negative observed composite in your sample)
• $C_{\\max} = 2.461879$ (most positive observed composite)
• The denominator $4.466533 = 2.461879 + 2.004654$ is the observed range`,
      },
      {
        type: "notation",
        heading: "Key Values",
        latex_table: [
          ["C_{\\min}", "-2.004654 \\text{ (anchors the 0 end of the scale)}"],
          ["C_{\\max}", "2.461879 \\text{ (anchors the 100 end)}"],
          ["\\bar{\\text{CRI}}", "44.88 \\text{ (sample mean)}"],
          ["\\text{SD}_{\\text{CRI}}", "19.01"],
          ["\\text{Range}", "[1.31, 91.33]"],
          ["\\bar{\\text{CRI}}_{\\text{PHQ-2}+}", "52.53 \\text{ (distress group)}"],
          ["\\bar{\\text{CRI}}_{\\text{PHQ-2}-}", "37.12 \\text{ (non-distress group)}"],
        ],
      },
      {
        type: "derivation",
        heading: "Worked Example",
        content: `Given: Practical factor score $\\xi_1 = 0.672478$, Emotional factor score $\\xi_2 = 0.810704$`,
        latex: `C = \\frac{0.672478 + 0.810704}{2} = 0.741591`,
        content2: `Apply the min-max formula:`,
        latex2: `\\text{F90-CRI} = 100 \\cdot \\frac{0.741591 + 2.004654}{4.466533} = 100 \\cdot \\frac{2.746245}{4.466533} \\approx 61.48`,
        content3: `Interpretation: This individual scores 61.48 on the F90-CRI — above the sample mean of 44.88, indicating elevated composite adjustment burden.`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `The F90-CRI bridges your latent factor model and clinical interpretation:
• PHQ-2 positive group: mean CRI = 52.53 vs. PHQ-2 negative: 37.12 (Δ = 15.41 points)
• Spearman correlation with PHQ-2 binary: ρ = 0.409, p < .001
• The 15-point gap across groups is the clinically meaningful signal
• The 0–100 scale is intentional: practitioners can communicate "this student's burden is at the 62nd percentile" in a way that raw Z-scores cannot`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "Why equal weights? The two factors are theoretically parallel dimensions of adjustment burden. Differential weighting would require criterion validation beyond this study's scope.",
          "Why min-max scaling (not z-scoring)? Min-max preserves the natural reference points in your sample and produces an interpretable 0–100 range. Z-scoring would still have negatives.",
          "Is the scale sample-dependent? Yes — the bounds are anchored to your sample. Generalization requires either normative data from a larger population or explicit acknowledgment that CRI scores are relative to this sample.",
          "What does a score of 50 mean? It means the individual is at the midpoint of your observed range — not necessarily 'average burden,' since the distribution is not uniform.",
          "Could the formula change if applied to new data? Yes. The min/max constants would need to be re-estimated or fixed to your sample's bounds for comparability.",
        ],
      },
    ],
    questions: [
      {
        id: "cri-q1",
        stem: "In the F90-CRI formula, what do the constants 2.004654 and 4.466533 represent?",
        options: [
          { id: "a", text: "The mean and standard deviation of composite scores in the sample" },
          { id: "b", text: "The absolute value of the minimum observed composite, and the total observed range (max − min)" },
          { id: "c", text: "The reliability coefficients for Factor 1 and Factor 2 respectively" },
          { id: "d", text: "The LASSO regularization parameters for the two factors" },
        ],
        correct: "b",
        explanation: `The minimum composite was C_min = −2.004654. Adding this to C shifts all scores to be non-negative. The denominator 4.466533 = 2.461879 + 2.004654 is the total range (max − min). Dividing by the range maps scores to [0, 1], and multiplying by 100 gives [0, 100]. This is standard min-max normalization.`,
      },
      {
        id: "cri-q2",
        stem: "If a new doctoral student has ξ₁ = −0.5 and ξ₂ = −0.3, their composite C is:",
        options: [
          { id: "a", text: "−0.8" },
          { id: "b", text: "−0.4" },
          { id: "c", text: "0.4" },
          { id: "d", text: "1.504654" },
        ],
        correct: "b",
        explanation: `C = (ξ₁ + ξ₂)/2 = (−0.5 + (−0.3))/2 = −0.8/2 = −0.4. Then F90-CRI = 100 × (−0.4 + 2.004654)/4.466533 = 100 × 1.604654/4.466533 ≈ 35.93.`,
      },
      {
        id: "cri-q3",
        stem: "A committee member questions whether the 15-point CRI gap between PHQ-2 groups (52.53 vs. 37.12) is clinically meaningful. The best defense is:",
        options: [
          { id: "a", text: "Statistical significance (p < .001) guarantees clinical significance" },
          { id: "b", text: "A 15-point gap represents roughly 0.79 standard deviations (SD = 19.01), which is a large effect by Cohen's d conventions, and corresponds to the difference between students who screen positive vs. negative for depression risk" },
          { id: "c", text: "The 15-point gap is meaningful because it exceeds the standard error of 2.0" },
          { id: "d", text: "The gap is clinically meaningful because it appears in the data" },
        ],
        correct: "b",
        explanation: `Cohen's d = Δ/SD_pooled ≈ 15.41/19.01 ≈ 0.81, which is a large effect size (d > 0.8). More importantly, the groups are defined by PHQ-2 (a validated depression screen), so this gap has concurrent validity — it distinguishes students at risk of depressive symptoms from those not at risk.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 3: Spearman Correlation
  // ══════════════════════════════════════════════════════════════════
  {
    id: "spearman",
    title: "Spearman Rank Correlation",
    subtitle: "Non-parametric association between burden and distress",
    color: "#B76C58",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `Pearson correlation measures linear association and assumes bivariate normality.
Your F90-CRI is a continuous composite score; your PHQ-2 outcome is binary (0/1).
A binary variable cannot be normally distributed. Spearman sidesteps this by working
on ranks rather than raw values — it asks whether *higher-ranked* CRI students tend
to be *higher-ranked* on PHQ-2 positivity.`,
      },
      {
        type: "definition",
        heading: "Formula",
        content: `Spearman's ρ (rho) is Pearson's r applied to ranks:`,
        latex: `\\rho_s = 1 - \\frac{6 \\sum d_i^2}{n(n^2 - 1)}`,
        content2: `Where $d_i$ = difference between rank of observation $i$ on variable $X$ and variable $Y$.
Or equivalently, Pearson's r on the ranked data:`,
        latex2: `\\rho_s = r(\\text{rank}(X), \\text{rank}(Y))`,
      },
      {
        type: "notation",
        heading: "Your Results",
        latex_table: [
          ["\\rho(\\text{CRI}, \\text{PHQ-2})", "0.409, \\ p < .001"],
          ["\\rho(\\text{Practical}, \\text{PHQ-2})", "0.138, \\ p = .113 \\text{ (n.s.)}"],
          ["\\rho(\\text{Emotional}, \\text{PHQ-2})", "0.571, \\ p < .001"],
          ["n", "133"],
        ],
      },
      {
        type: "derivation",
        heading: "Why Emotional Factor Dominates",
        content: `Emotional/Interpersonal Strain (ρ = 0.571) is a much stronger predictor of PHQ-2 positivity than Practical Pressure (ρ = 0.138, p = .113).

This is theoretically coherent: depression risk is more closely linked to interpersonal stress (advisor relationships, isolation, imposter syndrome) than to logistical pressures (finances, housing). The difference in correlations also explains why the full composite CRI (ρ = 0.409) is an *intermediate* predictor — it averages two factors with very different predictive power.`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `The Spearman correlations are your primary validity evidence for the F90-CRI. The logic chain:
1. EFA identifies structure → 2. CRI operationalizes it → 3. ρ = 0.409 with PHQ-2 validates it
4. The differential (emotional >> practical) suggests the composite obscures important heterogeneity — a limitation you should proactively address.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "Why Spearman not Pearson? PHQ-2 is binary; Pearson's r is inappropriate (assumes continuous, approximately normal variables). Point-biserial correlation would also work and gives equivalent results.",
          "ρ = 0.409 — is that strong? Moderate. For N=133, this is well-powered (critical value ≈ 0.17 at α=.05). Effect size r ≈ .41 is 'moderate to large' by Cohen's conventions.",
          "Practical factor p = .113 — why report it? Null results are important. It shows practical burden alone doesn't predict depression risk in this sample — only the emotional dimension does.",
          "Could the composite be improved? Yes — this is a limitation. A weighted composite (upweighting emotional) might be more predictive. Future work could explore confirmatory weighting.",
        ],
      },
    ],
    questions: [
      {
        id: "spearman-q1",
        stem: "Why was Spearman (not Pearson) used to correlate F90-CRI with PHQ-2?",
        options: [
          { id: "a", text: "Spearman is always more conservative and appropriate for thesis work" },
          { id: "b", text: "PHQ-2 is a binary variable; Pearson's r assumes both variables are continuous and approximately normally distributed" },
          { id: "c", text: "F90-CRI scores are not normally distributed" },
          { id: "d", text: "Spearman was required because n < 200" },
        ],
        correct: "b",
        explanation: `The key issue is the measurement scale of PHQ-2: it is binary (0/1). Pearson correlation's assumptions include continuous variables. Spearman ρ works on ranks and makes no normality assumption, making it appropriate for binary outcomes (it is equivalent to point-biserial r in this case).`,
      },
      {
        id: "spearman-q2",
        stem: "The practical factor's correlation with PHQ-2 is ρ=0.138, p=.113. How should you interpret this?",
        options: [
          { id: "a", text: "Practical burden does not exist in your data" },
          { id: "b", text: "There is no statistically significant association between practical pressure and depression risk in this sample, though a small positive trend exists" },
          { id: "c", text: "The practical factor was measured incorrectly" },
          { id: "d", text: "This means PHQ-2 is a poor criterion variable" },
        ],
        correct: "b",
        explanation: `p=.113 means you fail to reject H₀ (no association). The effect is small (ρ=0.138) and non-significant. This is a substantive finding — practical stressors (finances, housing) may not translate directly into depression risk in this sample, possibly because students adapt, receive external support, or because depression is more driven by interpersonal processes.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 4: LASSO Logistic Regression
  // ══════════════════════════════════════════════════════════════════
  {
    id: "lasso",
    title: "LASSO Logistic Regression",
    subtitle: "Sparse prediction and PHQ-2 risk modelling",
    color: "#667C86",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `You want to predict which doctoral students screen PHQ-2 positive (at risk for depression).
You have 11 domain scores as predictors. With N=133, overfitting is a serious risk — standard
logistic regression would use all 11 predictors and perform great on training data but poorly on
new students.

LASSO (Least Absolute Shrinkage and Selection Operator) adds a penalty that *shrinks*
coefficients toward zero. Many become exactly zero — those predictors are automatically excluded.
You end up with a sparse, interpretable model: often just 2–7 predictors, selected by the data.`,
      },
      {
        type: "definition",
        heading: "The Objective Function",
        content: `Standard logistic regression minimises the negative log-likelihood:`,
        latex: `-\\ell(\\beta) = -\\sum_{i=1}^n \\left[ y_i \\log p_i + (1-y_i)\\log(1-p_i) \\right]`,
        content2: `LASSO adds an L1 penalty (sum of absolute values of coefficients):`,
        latex2: `-\\ell(\\beta) + \\lambda \\sum_{j=1}^p |\\beta_j|`,
        content3: `The penalty parameter λ controls sparsity. Larger λ → more coefficients set to zero → simpler model.`,
      },
      {
        type: "notation",
        heading: "Key Symbols",
        latex_table: [
          ["\\lambda", "Regularization strength (larger = sparser model)"],
          ["\\lambda_{\\min}", "Lambda that minimizes CV deviance — best prediction"],
          ["\\lambda_{1se}", "Lambda within 1 SE of minimum — sparser, more parsimonious"],
          ["\\text{AUC}", "Area Under ROC Curve (discrimination ability, 0.5=chance, 1.0=perfect)"],
          ["\\text{Brier}", "Mean squared error of predicted probabilities (0=perfect, 0.25=chance for 50/50)"],
        ],
      },
      {
        type: "derivation",
        heading: "Why L1 Creates Sparsity",
        content: `The L1 penalty creates a 'corner' geometry in the solution space. The minimum of the penalized objective often occurs exactly at a corner where some βⱼ = 0 — unlike L2 (ridge), which shrinks but rarely zeroes.

Geometrically: the L1 ball is a diamond; the elliptical contours of the likelihood tend to touch the diamond at a corner (where coefficients = 0). L2's circular ball is touched on its surface (non-zero everywhere).`,
        latex: `\\underbrace{\\sum_j |\\beta_j| \\leq t}_{\\text{L1 constraint: diamond}} \\quad \\text{vs.} \\quad \\underbrace{\\sum_j \\beta_j^2 \\leq t}_{\\text{L2 constraint: sphere}}`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `Nested 10-fold CV results:
• λ.min: AUC = 0.861, Brier score = 0.152, mean selected predictors = 6.6
• λ.1se: AUC = 0.836, Brier score = 0.166, mean selected predictors = 2.2

The λ.1se model (AUC=0.836 with just ~2 predictors) is remarkably parsimonious — it suggests that only 2 of your 11 domains carry most of the predictive signal for PHQ-2 positivity. This is supplementary to your main EFA/CRI analysis and provides an independent, predictive validation angle.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "Why LASSO not ridge or elastic net? LASSO produces exact zeros (variable selection), which is interpretable. Ridge shrinks but keeps all predictors. With 11 predictors and N=133, sparsity is desirable.",
          "What is nested CV? The inner loop selects λ; the outer loop evaluates the whole procedure. Prevents optimistic bias from using the same data to both tune and evaluate.",
          "AUC = 0.861 — good or great? Very good. 0.5 = chance; 0.7–0.8 = acceptable; 0.8–0.9 = excellent; >0.9 = outstanding. 0.861 is excellent discrimination.",
          "Brier score of 0.152 vs. 0.25 — what does that mean? The null model (always predict the base rate 0.504) has Brier score ≈ 0.504×0.496 = 0.250. Your 0.152 is a substantial improvement in calibration.",
          "What are the 2 predictors at λ.1se? The specific selected predictors should be reported from your R output — this analysis needs your actual glmnet output to name them precisely.",
        ],
      },
    ],
    questions: [
      {
        id: "lasso-q1",
        stem: "What does the LASSO penalty λ·Σ|βⱼ| do to the logistic regression solution?",
        options: [
          { id: "a", text: "It forces all coefficients to be equal in magnitude" },
          { id: "b", text: "It shrinks some coefficients toward zero, and may set them exactly to zero — performing automatic variable selection" },
          { id: "c", text: "It converts logistic regression into linear regression" },
          { id: "d", text: "It increases the sample size effectively" },
        ],
        correct: "b",
        explanation: `The L1 penalty's diamond-shaped geometry in coefficient space means the optimal solution often falls exactly at a corner where some βⱼ = 0. This performs automatic variable selection — LASSO both fits the model and chooses which predictors to include, which is especially valuable when p is not tiny relative to n.`,
      },
      {
        id: "lasso-q2",
        stem: "Your λ.1se model has AUC=0.836 with ~2.2 predictors. Why might you prefer this over the λ.min model (AUC=0.861, 6.6 predictors)?",
        options: [
          { id: "a", text: "Because λ.min has lower AUC" },
          { id: "b", text: "Because 6.6 predictors is too many for any model" },
          { id: "c", text: "The λ.1se model achieves nearly equivalent discrimination (AUC drop of 0.025) with far fewer predictors — better parsimony, interpretability, and generalizability to new samples" },
          { id: "d", text: "λ.1se is always the statistically correct choice" },
        ],
        correct: "c",
        explanation: `λ.1se applies Occam's razor: for a loss of only 0.025 AUC, you get a model with ~3× fewer predictors. In small samples (N=133), simpler models often generalize better. The 1-SE rule is a principled way to choose parsimony without arbitrarily sacrificing performance.`,
      },
      {
        id: "lasso-q3",
        stem: "A reviewer asks why you used nested 10-fold cross-validation. The best answer is:",
        options: [
          { id: "a", text: "It's the standard method required by the journal" },
          { id: "b", text: "Nested CV separates the λ-tuning step from the performance-evaluation step, preventing the optimism bias that occurs when the same data selects and evaluates the model" },
          { id: "c", text: "10-fold CV is the most accurate method for N > 100" },
          { id: "d", text: "It converts the LASSO to a Bayesian model" },
        ],
        correct: "b",
        explanation: `With a single CV loop, the λ value selected on the data is then evaluated on the same (held-out) folds — this double-dips on the data and produces overly optimistic AUC estimates. Nested CV has an outer loop evaluating the full λ-selection-and-fitting procedure on truly held-out data, giving unbiased performance estimates.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 5: Fit Indices
  // ══════════════════════════════════════════════════════════════════
  {
    id: "fitindices",
    title: "Model Fit Indices",
    subtitle: "KMO, RMSEA, RMSR, TLI — what they test and how to defend yours",
    color: "#C6A36A",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `After EFA extracts factors, how do you know the two-factor model is *good*?
Fit indices quantify the gap between what your model predicts (the reproduced correlation matrix)
and what you observe. Each index captures a different aspect of fit.
Your committee will probe every marginal value — you need to defend each one.`,
      },
      {
        type: "definition",
        heading: "The Four Fit Indices",
        content: `**KMO (Kaiser-Meyer-Olkin):**`,
        latex: `\\text{KMO} = \\frac{\\sum_{i \\neq j} r_{ij}^2}{\\sum_{i \\neq j} r_{ij}^2 + \\sum_{i \\neq j} p_{ij}^2}`,
        content2: `Where $r_{ij}$ = observed correlations, $p_{ij}$ = partial correlations. Close to 1 = items share common variance (factorable).

**RMSR:**`,
        latex2: `\\text{RMSR} = \\sqrt{\\frac{2\\sum_{i > j}(r_{ij} - \\hat{r}_{ij})^2}{p(p-1)}}`,
        content3: `Average residual correlation. < 0.08 = good.

**RMSEA:**`,
        latex3: `\\text{RMSEA} = \\sqrt{\\max\\left(\\frac{\\chi^2 - df}{df(n-1)}, 0\\right)}`,
        content4: `Parsimony-corrected fit. < 0.06 ideal, < 0.08 acceptable, < 0.10 marginal.

**TLI (Tucker-Lewis Index):**`,
        latex4: `\\text{TLI} = \\frac{\\chi^2_{\\text{null}}/df_{\\text{null}} - \\chi^2_{\\text{model}}/df_{\\text{model}}}{\\chi^2_{\\text{null}}/df_{\\text{null}} - 1}`,
        content5: `Compares model fit to null (all items uncorrelated) model, penalised for complexity. > 0.95 ideal.`,
      },
      {
        type: "thesis",
        heading: "Your Results & Their Meaning",
        content: `| Index | Your Value | Threshold | Verdict |
|-------|-----------|-----------|---------|
| KMO | 0.822 | > 0.80 "meritorious" | ✓ Strong |
| Bartlett χ²(55) | 592.96, p<.001 | p<.05 | ✓ Strong |
| RMSR | 0.060 | < 0.08 | ✓ Good |
| TLI | 0.867 | > 0.95 ideal | ⚠ Marginal |
| RMSEA | 0.098 | < 0.08 acceptable | ⚠ Marginal |

RMSR (0.060) and KMO (0.822) are strong. TLI and RMSEA are marginal. This divergence is partly attributable to your sample size (N=133) — these indices are sensitive to n.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "RMSEA = 0.098 — that's above 0.08. How do you defend it? RMSEA is known to be inflated with smaller samples and fewer variables. Kenny, Kaniskan & McCoach (2015) show RMSEA routinely exceeds 0.10 in small-sample EFA. Your RMSR = 0.060 (which is less n-sensitive) indicates good local fit. Report both and acknowledge the limitation.",
          "TLI = 0.867 is below 0.90. The TLI compares to a baseline null model. With 11 items on a 2-factor structure, the null model is a very poor fit — the absolute improvement is large even if TLI doesn't reach 0.95.",
          "Why use multiple fit indices? Each index captures different aspects of fit (global vs. local, penalized vs. absolute). No single index tells the whole story. Hu & Bentler's 'two-index strategy' recommends reporting at least two complementary indices.",
          "Could a 3-factor model fit better? Possibly, but your parallel analysis supported 2 factors, and the third factor would explain less variance than chance. Interpretability also favored 2 factors.",
        ],
      },
    ],
    questions: [
      {
        id: "fit-q1",
        stem: "Your RMSEA = 0.098 is above the 0.08 threshold. The most defensible response to a committee question is:",
        options: [
          { id: "a", text: "RMSEA is irrelevant for EFA; only RMSR matters" },
          { id: "b", text: "RMSEA is known to be inflated in small samples (N=133 with 11 items). RMSR=0.060 indicates good local fit, and multiple fit indices together support an adequate two-factor solution" },
          { id: "c", text: "0.098 is close enough to 0.10 that it doesn't need defending" },
          { id: "d", text: "The 0.08 threshold is arbitrary and shouldn't be used" },
        ],
        correct: "b",
        explanation: `The key defense: RMSEA's sensitivity to sample size is well-documented (Kenny, Kaniskan & McCoach, 2015). Small samples produce inflated RMSEA. RMSR (which is less n-sensitive) = 0.060 is good, and KMO = 0.822 confirms the data were suitable. A multi-index defense is more credible than dismissing any single index.`,
      },
      {
        id: "fit-q2",
        stem: "What does the Bartlett test of sphericity (χ²(55) = 592.96, p < .001) test?",
        options: [
          { id: "a", text: "Whether the factors have equal variances" },
          { id: "b", text: "Whether the correlation matrix is significantly different from an identity matrix — i.e., whether items are correlated enough to warrant factor analysis" },
          { id: "c", text: "Whether your sample size is sufficient for EFA" },
          { id: "d", text: "Whether the factor loadings are statistically significant" },
        ],
        correct: "b",
        explanation: `Bartlett's test H₀: the population correlation matrix is an identity matrix (all off-diagonal correlations = 0). Rejecting H₀ (p < .001) means the items are significantly intercorrelated — a necessary condition for factor analysis. If items weren't correlated, there'd be nothing for EFA to extract.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 6: Validity & Reliability
  // ══════════════════════════════════════════════════════════════════
  {
    id: "validity",
    title: "Validity & Reliability of the F90-CRI",
    subtitle: "Psychometric foundations for a new measurement instrument",
    color: "#6F9289",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `The F90-CRI is a *new* instrument. No instrument is useful unless we can demonstrate that:
1. It measures what it claims (validity)
2. It measures it consistently (reliability)

Your committee will challenge: "How do we know the CRI actually measures adjustment burden
and not just general distress?" You need to walk through the validity evidence chain.`,
      },
      {
        type: "definition",
        heading: "Types of Validity & Your Evidence",
        content: `**Content validity**: Do the 11 domains cover the construct space of adjustment burden?
*Your evidence*: Domains derived from prior literature on doctoral adjustment (IRB-reviewed survey design).

**Structural validity (factor validity)**: Does the internal structure match the theoretical structure?
*Your evidence*: EFA two-factor solution aligns with practical vs. interpersonal burden — theoretically coherent.

**Criterion-related / Concurrent validity**: Does the CRI correlate with an established criterion?
*Your evidence*: ρ(CRI, PHQ-2) = 0.409, p < .001 — the CRI correlates meaningfully with a validated depression screen.

**Discriminant validity**: Are the two factors distinct enough to be separate constructs?
*Your evidence*: Factor correlation = 0.395 — moderate, so they overlap but are not redundant.`,
      },
      {
        type: "notation",
        heading: "Reliability — Cronbach's α",
        content: `Internal consistency for multi-item scales:`,
        latex: `\\alpha = \\frac{k}{k-1}\\left(1 - \\frac{\\sum_{i=1}^k \\sigma_{x_i}^2}{\\sigma_T^2}\\right)`,
        content2: `Where k = number of items, σ²ₓᵢ = item variance, σ²_T = total score variance.
Rule of thumb: α > 0.70 acceptable; > 0.80 good; > 0.90 excellent.

**Note**: Your thesis should report α for each factor scale. If not yet computed, this is worth including in revisions.`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `Validity evidence chain:
1. Survey items derived from literature (content validity)
2. EFA yields theoretically interpretable 2-factor structure (structural validity)
3. CRI correlates ρ=0.409 with PHQ-2 (concurrent validity)
4. LASSO AUC=0.861 with 6.6 predictors (predictive validity)
5. PHQ-2+ group CRI = 52.53 vs. PHQ-2- group = 37.12 (known-groups validity)

Limitations to acknowledge: no test-retest reliability data, no longitudinal data to establish predictive validity over time, sample from one institution.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "What type of validity does ρ=0.409 with PHQ-2 establish? Concurrent validity (criterion-related) — the PHQ-2 is an established, validated screen. Correlating with it shows the CRI captures related construct space.",
          "Could the CRI just be measuring depression itself (redundancy)? No — ρ=0.409 is moderate, not near 1.0. The CRI and PHQ-2 share ~17% variance (r²=0.167). They're related but measuring distinct constructs. Adjustment burden ≠ depression.",
          "What would strengthen validity in future research? Longitudinal data (does CRI at entry predict persistence?), confirmatory factor analysis on a new sample, test-retest reliability over 2–4 weeks, convergent validity with established stress measures.",
          "What's the difference between reliability and validity? A bathroom scale that always reads 5kg too heavy is reliable (consistent) but not valid (wrong). Reliability is a prerequisite for validity — an unreliable measure can't be valid — but reliability alone doesn't guarantee validity.",
        ],
      },
    ],
    questions: [
      {
        id: "valid-q1",
        stem: "The correlation ρ(CRI, PHQ-2) = 0.409 supports which type of validity?",
        options: [
          { id: "a", text: "Content validity" },
          { id: "b", text: "Structural (factor) validity" },
          { id: "c", text: "Concurrent criterion-related validity" },
          { id: "d", text: "Predictive validity" },
        ],
        correct: "c",
        explanation: `Concurrent validity is established by correlating a new measure with an established criterion measured at the same time. PHQ-2 is a validated depression screen collected simultaneously with your CRI; ρ=0.409 shows they share meaningful variance, supporting the CRI's validity.`,
      },
      {
        id: "valid-q2",
        stem: "A reviewer argues that ρ=0.409 means the CRI is just measuring depression, not adjustment burden. The best rebuttal is:",
        options: [
          { id: "a", text: "0.409 is not statistically significant at α=0.01" },
          { id: "b", text: "ρ=0.409 means only ~17% shared variance (r²≈0.167). The constructs are related but distinct; adjustment burden and depression have overlapping but different etiology, as theory predicts" },
          { id: "c", text: "The PHQ-2 is too short to be a valid depression measure" },
          { id: "d", text: "Spearman correlation should not be used for validity" },
        ],
        correct: "b",
        explanation: `r²=0.409²≈0.167: 83% of variance in CRI is NOT explained by PHQ-2. This is exactly what you'd expect if adjustment burden and depression are related constructs that partially overlap — consistent with theory. Perfect correlation would suggest redundancy; zero correlation would suggest irrelevance. 0.409 is in the theoretically expected range.`,
      },
      {
        id: "valid-q3",
        stem: "What limitation does the absence of test-retest data impose on your CRI claims?",
        options: [
          { id: "a", text: "You cannot report any results without test-retest data" },
          { id: "b", text: "You cannot establish temporal reliability — it's unknown whether CRI scores are stable over time or fluctuate with day-to-day mood" },
          { id: "c", text: "The CRI is invalid without test-retest data" },
          { id: "d", text: "It means your EFA results are incorrect" },
        ],
        correct: "b",
        explanation: `Test-retest reliability asks: if the same students completed the survey 2–4 weeks later, would their CRI scores be similar? Without this data, you can't distinguish stable individual differences in adjustment burden from transient states. This is an acknowledged limitation — it doesn't invalidate the cross-sectional findings but limits interpretations about stability.`,
      },
    ],
  },
];
