/**
 * Math lessons — Phase 2 expansion
 * Topics: probability/odds/log-odds, logistic regression, MLE,
 *   convex optimization, L1/L2, coordinate descent, cross-validation,
 *   ROC/AUC, Brier score, covariance matrices, standardization,
 *   eigenvalues/eigenvectors, latent variable models, factor retention,
 *   factor scoring, communalities/uniqueness, cross-loadings,
 *   fixed-bound transformation, statistical interpretation
 */

export const MATH_LESSONS_2 = [
  // ══════════════════════════════════════════════════════════════════
  // LESSON 7: Probability, Odds & Log-Odds
  // ══════════════════════════════════════════════════════════════════
  {
    id: "prob-odds",
    title: "Probability, Odds & Log-Odds",
    subtitle: "The foundation of logistic regression",
    color: "#C6A36A",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `Probability answers: out of all students, what fraction screen PHQ-2 positive?
Odds answers: for every student who screens negative, how many screen positive?
Log-odds (logit) answers: what linear scale maps the [0,1] probability space to (−∞, +∞)?

Logistic regression is built on log-odds because probabilities are bounded (can't be negative or > 1)
but linear models produce unbounded outputs. Log-odds solves this by being the natural "linearized"
form of probability.`,
      },
      {
        type: "definition",
        heading: "Formal Definitions",
        content: `**Probability** of event A:`,
        latex: `P(A) = \\frac{\\text{number of outcomes where A occurs}}{\\text{total outcomes}} \\in [0,1]`,
        content2: `**Odds** in favour of A:`,
        latex2: `\\text{Odds}(A) = \\frac{P(A)}{1 - P(A)} \\in [0, +\\infty)`,
        content3: `**Log-odds (logit)**:`,
        latex3: `\\text{logit}(p) = \\log\\frac{p}{1-p} \\in (-\\infty, +\\infty)`,
        content4: `**Inverse logit (sigmoid)** — converts log-odds back to probability:`,
        latex4: `p = \\sigma(z) = \\frac{1}{1 + e^{-z}} = \\frac{e^z}{1 + e^z}`,
      },
      {
        type: "notation",
        heading: "Key Symbols",
        latex_table: [
          ["p", "Probability of PHQ-2 positive; \\hat{p} = estimated probability"],
          ["1-p", "Probability of PHQ-2 negative (complement)"],
          ["p/(1-p)", "Odds in favour of PHQ-2 positive"],
          ["\\log", "Natural logarithm (base e) throughout logistic regression"],
          ["\\sigma(z)", "Sigmoid function; maps any real z to (0,1)"],
          ["z = \\mathbf{x}^T\\boldsymbol{\\beta}", "Linear predictor (log-odds as linear combination of features)"],
        ],
      },
      {
        type: "derivation",
        heading: "Why Log-Odds Is Linear",
        content: `In logistic regression, we model the **log-odds** as a linear function:`,
        latex: `\\log\\frac{p}{1-p} = \\beta_0 + \\beta_1 x_1 + \\cdots + \\beta_p x_p`,
        content2: `Solving for p:`,
        latex2: `p = \\frac{e^{\\beta_0 + \\mathbf{x}^T\\boldsymbol{\\beta}}}{1 + e^{\\beta_0 + \\mathbf{x}^T\\boldsymbol{\\beta}}} = \\sigma(\\beta_0 + \\mathbf{x}^T\\boldsymbol{\\beta})`,
        content3: `**Interpretation of β**: A one-unit increase in xⱼ multiplies the odds by eᵝʲ.
If βⱼ = 0.5, odds multiply by e⁰·⁵ ≈ 1.65 — a 65% increase in odds.`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `Your LASSO logistic regression models:

logit[P(PHQ-2 positive)] = β₀ + β₁(Financial strain) + β₂(Advisor relationship) + ⋯

The PHQ-2 outcome is binary (0=negative, 1=positive), so logistic regression is the correct model.
The base rate is 50.38% — odds of positive = 0.5038/0.4962 ≈ 1.015, logit ≈ 0.015.
This near-zero base logit means the model starts from near-equipoise and
the predictors move it in either direction.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "Why not linear regression for a binary outcome? Linear regression can predict probabilities outside [0,1], violating the probability axioms. Logistic regression constrains predictions to (0,1) via the sigmoid function.",
          "What does a logistic coefficient mean? The log-odds change per unit increase in the predictor. Exponentiate (eᵝ) to get the odds ratio — the multiplicative change in odds.",
          "What is the intercept β₀ in your model? The log-odds of PHQ-2 positive when all predictors equal zero. Its exponentiated value is the baseline odds.",
          "Why use log-odds and not just model probability directly? Log-odds is unbounded and linear in the predictors — this makes the linear model specification valid. Direct probability modelling violates linearity assumptions.",
        ],
      },
    ],
    questions: [
      {
        id: "prob-q1",
        stem: "In your sample, 67 of 133 students screen PHQ-2 positive. What are the odds of a positive screen, and what is the log-odds?",
        options: [
          { id: "a", text: "Odds = 0.504; log-odds = −0.692" },
          { id: "b", text: "Odds = 67/66 ≈ 1.015; log-odds = ln(1.015) ≈ 0.015" },
          { id: "c", text: "Odds = 67/133 = 0.504; log-odds = 0.504" },
          { id: "d", text: "Odds = 133/67 ≈ 1.985; log-odds = 0.686" },
        ],
        correct: "b",
        explanation: `P(positive) = 67/133 = 0.5038. Odds = P/(1−P) = 0.5038/0.4962 = 67/66 ≈ 1.015. Log-odds = ln(1.015) ≈ 0.015. The near-zero log-odds reflects the near-50/50 split — the model starts at near-equipoise.`,
      },
      {
        id: "prob-q2",
        stem: "If a logistic regression coefficient for 'Advisor Relationship' is β = 0.8, the odds ratio eᵝ ≈ 2.23 means:",
        options: [
          { id: "a", text: "P(PHQ-2 positive) increases by 2.23 percentage points per unit of advisor stress" },
          { id: "b", text: "A one-unit increase in advisor relationship stress is associated with 2.23 times higher odds of PHQ-2 positive" },
          { id: "c", text: "Students with high advisor stress are 2.23 times more likely to screen negative" },
          { id: "d", text: "The probability of PHQ-2 positive is 2.23 times the probability of negative" },
        ],
        correct: "b",
        explanation: `The odds ratio eᵝ gives the multiplicative change in odds per unit increase in the predictor. eᵝ = 2.23 means each additional unit of advisor relationship stress is associated with odds of PHQ-2 positive that are 2.23× higher. Note: odds ratio ≠ relative risk (probability ratio), especially when the outcome is common (50% base rate here).`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 8: Likelihood & Maximum Likelihood Estimation
  // ══════════════════════════════════════════════════════════════════
  {
    id: "mle",
    title: "Likelihood & Maximum Likelihood Estimation",
    subtitle: "The engine behind logistic regression fitting",
    color: "#6F9289",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `You have 133 students, each with known PHQ-2 outcome (0 or 1) and predictor scores.
You want to find β values that make your observed data most probable.

Likelihood answers: given these β values, how probable is the data I actually observed?
MLE finds the β that maximises this probability.

Intuition: if 90% of students with high emotional burden screen positive,
β values that predict 90% are more "likely" than β values predicting 50%.`,
      },
      {
        type: "definition",
        heading: "The Likelihood Function",
        content: `For binary outcomes, each observation contributes:`,
        latex: `L_i(\\boldsymbol{\\beta}) = p_i^{y_i}(1-p_i)^{1-y_i}`,
        content2: `where $p_i = \\sigma(\\mathbf{x}_i^T\\boldsymbol{\\beta})$ and $y_i \\in \\{0,1\\}$.

Joint likelihood (assuming independence):`,
        latex2: `L(\\boldsymbol{\\beta}) = \\prod_{i=1}^n p_i^{y_i}(1-p_i)^{1-y_i}`,
        content3: `Log-likelihood (easier to work with — log turns products into sums):`,
        latex3: `\\ell(\\boldsymbol{\\beta}) = \\sum_{i=1}^n \\left[ y_i \\log p_i + (1-y_i)\\log(1-p_i) \\right]`,
      },
      {
        type: "derivation",
        heading: "MLE for Logistic Regression",
        content: `Maximise ℓ(β) is equivalent to minimising the negative log-likelihood (cross-entropy loss):`,
        latex: `\\hat{\\boldsymbol{\\beta}} = \\underset{\\boldsymbol{\\beta}}{\\operatorname{argmax}} \\; \\ell(\\boldsymbol{\\beta}) = \\underset{\\boldsymbol{\\beta}}{\\operatorname{argmin}} \\left[ -\\frac{1}{n}\\ell(\\boldsymbol{\\beta}) \\right]`,
        content2: `No closed form — requires iterative optimization (Newton-Raphson or gradient descent).

**Score equations** (gradient = 0 at MLE):`,
        latex2: `\\frac{\\partial \\ell}{\\partial \\boldsymbol{\\beta}} = \\mathbf{X}^T(\\mathbf{y} - \\hat{\\mathbf{p}}) = \\mathbf{0}`,
        content3: `This says: at the MLE, the weighted residuals (actual − predicted) are orthogonal to all predictors.`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `Your LASSO logistic regression replaces the MLE objective with a penalised version:

Standard: minimise −(1/n)ℓ(β)
LASSO:    minimise −(1/n)ℓ(β) + λΣ|βⱼ|

The penalty prevents the MLE from overfitting to your N=133 sample.
glmnet (the R package you used) solves this via coordinate descent rather than Newton-Raphson.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "What is the likelihood function? The joint probability of observing all outcomes y₁,…,yₙ as a function of β. MLE chooses β to maximise this.",
          "Why log-likelihood? Products of small probabilities underflow numerically. Log converts products to sums and doesn't change the argmax (log is monotone increasing).",
          "Why can't you solve for β analytically? The gradient equations X'(y−p̂)=0 contain p̂ = σ(Xβ), which is nonlinear in β. No closed form → need iterative optimization.",
          "What is cross-entropy loss? Another name for −(1/n)ℓ(β). Same mathematical object as negative log-likelihood, used widely in machine learning.",
        ],
      },
    ],
    questions: [
      {
        id: "mle-q1",
        stem: "For a student with y=1 (PHQ-2 positive) and predicted probability p̂=0.8, what is their log-likelihood contribution?",
        options: [
          { id: "a", text: "ln(0.8) ≈ −0.223" },
          { id: "b", text: "ln(0.2) ≈ −1.609" },
          { id: "c", text: "0.8" },
          { id: "d", text: "−0.8" },
        ],
        correct: "a",
        explanation: `For y=1: contribution = y·ln(p̂) + (1−y)·ln(1−p̂) = 1·ln(0.8) + 0·ln(0.2) = ln(0.8) ≈ −0.223. The model correctly predicted high probability for a positive student — small negative contribution. If p̂ were 0.1 instead, contribution would be ln(0.1) ≈ −2.30 — a much worse fit.`,
      },
      {
        id: "mle-q2",
        stem: "LASSO minimises −(1/n)ℓ(β) + λΣ|βⱼ|. Why is β₀ (the intercept) NOT included in the penalty sum?",
        options: [
          { id: "a", text: "The intercept is always zero in logistic regression" },
          { id: "b", text: "Penalising the intercept would shift all predictions toward zero, biasing probability estimates away from the true base rate regardless of the data" },
          { id: "c", text: "The intercept has no effect on model complexity" },
          { id: "d", text: "glmnet automatically sets the intercept to zero" },
        ],
        correct: "b",
        explanation: `The intercept captures the base rate — in your case, the near-50% PHQ-2 positive rate. Penalising it would shrink it toward zero, pulling all predicted probabilities toward 50% regardless of actual prevalence. The penalty is for controlling predictor coefficients (complexity) not for controlling the baseline probability.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 9: L1 vs L2 Regularization
  // ══════════════════════════════════════════════════════════════════
  {
    id: "regularization",
    title: "L1 vs L2 Regularization",
    subtitle: "Why LASSO creates sparsity and ridge does not",
    color: "#B76C58",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `With N=133 and 11 predictors, standard logistic regression can overfit —
it memorises training data instead of learning generalizable patterns.

Regularization adds a penalty to the loss that discourages large coefficients.
Two common penalties:

**Ridge (L2)**: penalise sum of squared coefficients → shrinks all toward zero, none exactly zero
**LASSO (L1)**: penalise sum of absolute values → some become exactly zero (sparse model)

You used LASSO because sparsity is desirable: automatically identifies which of 11 domains
actually predict PHQ-2 risk.`,
      },
      {
        type: "definition",
        heading: "The Two Penalties",
        content: `**Ridge** objective:`,
        latex: `\\hat{\\boldsymbol{\\beta}}_{\\text{ridge}} = \\underset{\\boldsymbol{\\beta}}{\\operatorname{argmin}} \\left[ -\\ell(\\boldsymbol{\\beta}) + \\lambda \\sum_{j=1}^p \\beta_j^2 \\right]`,
        content2: `**LASSO** objective:`,
        latex2: `\\hat{\\boldsymbol{\\beta}}_{\\text{LASSO}} = \\underset{\\boldsymbol{\\beta}}{\\operatorname{argmin}} \\left[ -\\ell(\\boldsymbol{\\beta}) + \\lambda \\sum_{j=1}^p |\\beta_j| \\right]`,
        content3: `**Elastic net** (combines both):`,
        latex3: `-\\ell(\\boldsymbol{\\beta}) + \\lambda\\left[\\alpha\\sum_j|\\beta_j| + (1-\\alpha)\\sum_j\\beta_j^2\\right]`,
      },
      {
        type: "derivation",
        heading: "Why L1 Creates Exact Zeros",
        content: `Geometrically, the penalised optimum is where the likelihood contours first touch the constraint region.

**L2 constraint**: $\\sum_j \\beta_j^2 \\leq t$ — a sphere (smooth, no corners)
The likelihood contour touches the sphere on its surface → coefficients are small but nonzero.

**L1 constraint**: $\\sum_j |\\beta_j| \\leq t$ — a diamond (corners at coordinate axes)
The likelihood contour often first touches the diamond at a corner where some βⱼ = 0.`,
        latex: `\\text{L1 ball in 2D: } |\\beta_1| + |\\beta_2| \\leq t \\text{ has corners at } (\\pm t, 0) \\text{ and } (0, \\pm t)`,
        content2: `**Soft thresholding** (the L1 solution for orthogonal design):`,
        latex2: `\\hat{\\beta}_j^{\\text{LASSO}} = \\text{sign}(\\hat{\\beta}_j^{\\text{OLS}}) \\cdot \\max(|\\hat{\\beta}_j^{\\text{OLS}}| - \\lambda, 0)`,
        content3: `Coefficients smaller than λ are set exactly to zero. Larger ones are shrunk by λ.`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `You chose LASSO specifically for automatic variable selection among your 11 domains:
• λ.min selected ~6.6 predictors on average across CV folds
• λ.1se selected ~2.2 predictors — a highly sparse model

Ridge would have kept all 11 predictors with shrunk (but nonzero) coefficients — less interpretable
and not useful for identifying "which domains drive PHQ-2 risk."

The specific predictors selected at λ.1se are the clinically actionable finding:
these are the 2 domains that most efficiently identify at-risk students.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "Why LASSO over elastic net? Elastic net adds another tuning parameter (α). With 11 predictors, LASSO's pure sparsity is interpretable and sufficient. Elastic net is better when predictors are highly correlated in groups.",
          "Does LASSO always find the global optimum? For logistic regression with LASSO, the objective is convex (log-likelihood is concave, L1 is convex) → coordinate descent finds the global minimum.",
          "What happens as λ→∞? All coefficients go to zero — the null model (always predict base rate). As λ→0, we approach the unpenalised MLE.",
          "What is the bias-variance tradeoff here? LASSO introduces bias (shrinks true coefficients) but reduces variance (less sensitive to this particular sample). For N=133, reduced variance is worth the bias cost.",
        ],
      },
    ],
    questions: [
      {
        id: "reg-q1",
        stem: "If β̂ᴼᴸˢ = 0.3 for a predictor and λ = 0.4, what does soft thresholding give for β̂ᴸᴬˢˢᴼ?",
        options: [
          { id: "a", text: "0.3 − 0.4 = −0.1" },
          { id: "b", text: "max(0.3 − 0.4, 0) = 0 (exactly zero — this predictor is excluded)" },
          { id: "c", text: "0.3 × 0.4 = 0.12" },
          { id: "d", text: "0.3 + 0.4 = 0.7" },
        ],
        correct: "b",
        explanation: `Soft thresholding: sign(β̂ᴼᴸˢ) · max(|β̂ᴼᴸˢ| − λ, 0) = sign(0.3) · max(0.3 − 0.4, 0) = 1 · max(−0.1, 0) = 0. This predictor's OLS coefficient (0.3) is smaller than the penalty (0.4), so LASSO sets it to exactly zero — this is variable selection in action.`,
      },
      {
        id: "reg-q2",
        stem: "A reviewer asks why you didn't use ridge regression instead of LASSO. The best answer is:",
        options: [
          { id: "a", text: "LASSO always outperforms ridge regression" },
          { id: "b", text: "Ridge was not available in the glmnet package" },
          { id: "c", text: "Ridge retains all 11 predictors with shrunk coefficients. LASSO performs automatic variable selection, identifying which specific domains drive PHQ-2 risk — a more interpretable and actionable finding for the research question" },
          { id: "d", text: "Ridge requires a larger sample size" },
        ],
        correct: "c",
        explanation: `Ridge shrinks but never zeros coefficients — with 11 predictors, you'd still have an 11-predictor model. The research question asks which domains predict depression risk, not just how well all 11 together predict it. LASSO's sparsity directly answers this by identifying the 2–7 most informative predictors.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 10: Cross-Validation & Nested CV
  // ══════════════════════════════════════════════════════════════════
  {
    id: "crossval",
    title: "Cross-Validation & Nested CV",
    subtitle: "Unbiased model evaluation for LASSO",
    color: "#667C86",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `You want to know: how well will this LASSO model predict PHQ-2 status in new students?
You can't just measure performance on the same data you used to fit the model — that always looks great.

Cross-validation holds out portions of data, trains on the rest, predicts the held-out portion.
Average performance across held-out portions = honest estimate of generalization.

**Nested CV** adds another layer: the λ-selection step itself uses data.
If you use the same fold to both select λ and report performance,
you've double-dipped — the reported AUC is too optimistic.`,
      },
      {
        type: "definition",
        heading: "K-Fold Cross-Validation",
        content: `Partition n observations into K roughly equal folds. For k = 1, …, K:`,
        latex: `\\text{AUC}_{\\text{CV}} = \\frac{1}{K}\\sum_{k=1}^K \\text{AUC}\\left(\\hat{f}^{(-k)}, \\mathcal{D}_k\\right)`,
        content2: `Where $\\hat{f}^{(-k)}$ is the model trained on all folds except k, evaluated on fold k.

**Nested CV structure**:
- **Outer loop** (K=10 folds): evaluation folds
- **Inner loop** (K=10 folds within each outer training set): λ selection`,
      },
      {
        type: "derivation",
        heading: "Why Standard CV Is Biased for Tuned Models",
        content: `Suppose you use 10-fold CV to:
1. Select λ (the value with lowest CV error), AND
2. Report the AUC at that λ

The λ was selected because it had the best AUC on that specific partition.
Reporting the same AUC conflates tuning and evaluation — the reported AUC is optimistically biased.

**Nested CV fixes this**:`,
        latex: `\\text{Outer fold } k: \\underbrace{\\mathcal{D}_{\\text{train}}^{(k)}}_{\\text{inner CV selects }\\lambda_k} \\to \\hat{f}_{\\lambda_k} \\to \\text{AUC on }\\mathcal{D}_k`,
        content2: `Each outer fold gets its own independently selected λ. The outer AUC is evaluated on data the λ-selection never saw.`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `You used nested 10-fold CV:
• Inner 10-fold: selects λ.min and λ.1se within each outer training set
• Outer 10-fold: evaluates AUC and Brier score on held-out data

Result: unbiased performance estimates
• λ.min: AUC = 0.861, Brier = 0.152 (avg 6.6 predictors per fold)
• λ.1se: AUC = 0.836, Brier = 0.166 (avg 2.2 predictors per fold)

The "mean selected = 6.6" tells you that across the 10 outer folds, the inner CV selected different subsets of predictors — this is expected variability.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "Why 10 folds specifically? K=10 is a standard choice balancing computational cost and bias-variance tradeoff in AUC estimation. With N=133, each fold has ~13 observations — small but sufficient for binary outcome estimation.",
          "What does 'mean selected = 6.6' mean? Across the 10 outer folds, the inner CV selected different numbers of predictors (some folds may select 5, others 8). The average is 6.6 — no single fixed set of predictors.",
          "Could you have used leave-one-out CV (LOOCV)? Yes, but it's computationally expensive and has high variance for AUC estimation. 10-fold is preferred.",
          "What's information leakage? Using the test set (or test-influenced statistics) in the training/tuning process, causing overly optimistic performance estimates. Nested CV prevents this.",
        ],
      },
    ],
    questions: [
      {
        id: "cv-q1",
        stem: "In nested 10-fold CV, what specifically does the inner CV loop do in your LASSO analysis?",
        options: [
          { id: "a", text: "It evaluates the final model's AUC on each fold" },
          { id: "b", text: "It selects the optimal λ using only the outer training set data, keeping the outer test fold completely unseen during tuning" },
          { id: "c", text: "It splits the data into training and test sets" },
          { id: "d", text: "It computes the Brier score for each candidate model" },
        ],
        correct: "b",
        explanation: `The inner CV operates only within the outer fold's training set. It tries many λ values and picks the best one (λ.min or λ.1se) based on inner-fold performance. The outer test fold is completely hidden during this step — its data is used only once, to evaluate the model trained with the inner-CV-selected λ. This prevents double-dipping.`,
      },
      {
        id: "cv-q2",
        stem: "The 'mean selected predictors = 6.6 (λ.min)' means:",
        options: [
          { id: "a", text: "Exactly 6 predictors were selected in every fold" },
          { id: "b", text: "The final model has 6.6 predictors" },
          { id: "c", text: "Across the 10 outer folds, different sets of predictors were selected by the inner CV, averaging 6.6 predictors per fold — reflecting the natural variability in variable selection" },
          { id: "d", text: "glmnet selected 6.6 as the optimal number of predictors" },
        ],
        correct: "c",
        explanation: `Each outer fold runs its own inner CV, which may select a different λ and therefore a different subset of the 11 predictors. One fold may select 5 predictors, another 8. The average across all 10 folds is 6.6 — this variability is a feature, not a bug: it reflects uncertainty in variable selection, which is honest.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 11: ROC Curves, AUC & Brier Score
  // ══════════════════════════════════════════════════════════════════
  {
    id: "roc-auc",
    title: "ROC Curves, AUC & Brier Score",
    subtitle: "Measuring discrimination and calibration",
    color: "#C6A36A",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `After fitting a model, you have predicted probabilities for each student.
Two key questions:

**Discrimination** (AUC): When you rank students by predicted probability,
do PHQ-2 positive students tend to rank higher than negative students?

**Calibration** (Brier): Are the predicted probabilities actually accurate?
If the model says 70% chance, do ~70% of those students screen positive?

AUC = 0.861 means your model discriminates well.
Brier = 0.152 means predicted probabilities are reasonably accurate.`,
      },
      {
        type: "definition",
        heading: "ROC Curve",
        content: `At each classification threshold t ∈ [0,1], predict positive if p̂ > t:`,
        latex: `\\text{Sensitivity (TPR)} = \\frac{TP}{TP + FN} \\quad \\text{Specificity} = \\frac{TN}{TN + FP}`,
        content2: `ROC curve: plot (1−Specificity, Sensitivity) for all thresholds t.

**AUC** (Area Under the ROC Curve):`,
        latex2: `\\text{AUC} = P(\\hat{p}_{i^+} > \\hat{p}_{j^-})`,
        content3: `AUC = probability that a randomly chosen PHQ-2 positive student gets a higher predicted probability than a randomly chosen PHQ-2 negative student.

**Brier score** (mean squared error of predicted probabilities):`,
        latex3: `\\text{Brier} = \\frac{1}{n}\\sum_{i=1}^n (y_i - \\hat{p}_i)^2`,
      },
      {
        type: "notation",
        heading: "Benchmarks",
        latex_table: [
          ["\\text{AUC} = 0.5", "Random chance classifier (no discrimination)"],
          ["\\text{AUC} = 0.7{-}0.8", "Acceptable discrimination"],
          ["\\text{AUC} = 0.8{-}0.9", "Excellent (your \\lambda.\\text{min}: 0.861)"],
          ["\\text{AUC} = 1.0", "Perfect discrimination"],
          ["\\text{Brier} = 0", "Perfect probability calibration"],
          ["\\text{Brier} = 0.25", "Null model: always predict base rate 0.504; 0.504 \\times 0.496 \\approx 0.250"],
          ["\\text{Brier} = 0.152", "Your \\lambda.\\text{min} — substantial improvement over null"],
        ],
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `Your LASSO results (nested 10-fold CV):

| Model | AUC | Brier | Predictors |
|-------|-----|-------|-----------|
| λ.min | 0.861 | 0.152 | ~6.6 |
| λ.1se | 0.836 | 0.166 | ~2.2 |
| Null  | 0.500 | ~0.250 | 0 |

Brier skill score (how much better than null?):
BSS = 1 − (Brier_model / Brier_null) = 1 − (0.152/0.250) = 0.392 — 39.2% improvement over always predicting base rate.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "AUC = 0.861 — what does this mean practically? If you randomly draw one PHQ-2 positive and one negative student, your model correctly ranks the positive student higher 86.1% of the time.",
          "What's the difference between AUC and accuracy? Accuracy depends on a chosen threshold (e.g., predict positive if p̂ > 0.5). AUC summarizes performance across all thresholds — a threshold-free measure of discrimination.",
          "Why report Brier score alongside AUC? AUC measures discrimination (ranking) but not calibration (accuracy of probabilities). A model could have AUC=0.9 but badly miscalibrated probabilities. Brier captures both.",
          "What threshold would you use clinically? Depends on the cost ratio of false positives vs. false negatives. For early screening (where missing a case is costly), you'd use a low threshold (high sensitivity, lower specificity). The ROC curve maps out all options.",
        ],
      },
    ],
    questions: [
      {
        id: "roc-q1",
        stem: "Your LASSO (λ.min) AUC = 0.861. What does this mean in plain language?",
        options: [
          { id: "a", text: "The model correctly classifies 86.1% of students" },
          { id: "b", text: "If you randomly pick one PHQ-2 positive and one PHQ-2 negative student, the model assigns a higher predicted probability to the positive student 86.1% of the time" },
          { id: "c", text: "86.1% of predicted probabilities exceed 0.5" },
          { id: "d", text: "The model has 86.1% sensitivity at a 0.5 threshold" },
        ],
        correct: "b",
        explanation: `AUC = P(p̂_{positive} > p̂_{negative}) — the probability that the model correctly ranks a positive-negative pair. This is a threshold-free measure of discrimination. It doesn't tell you accuracy at any specific cutpoint; it summarizes the full ROC curve.`,
      },
      {
        id: "roc-q2",
        stem: "The null model Brier score for your data is approximately 0.250. How was this calculated?",
        options: [
          { id: "a", text: "Brier(null) = 0.5² = 0.25, since the null model always predicts 0.5" },
          { id: "b", text: "Brier(null) = P(positive) × P(negative) = 0.5038 × 0.4962 ≈ 0.250, since always predicting the base rate gives mean squared error equal to the variance of the binary outcome" },
          { id: "c", text: "0.250 is the standard Brier baseline for all binary classifiers" },
          { id: "d", text: "It was set by the glmnet package as a reference value" },
        ],
        correct: "b",
        explanation: `The null model always predicts p̂ = base rate = 0.5038. Brier = mean[(y−0.5038)²] = P(y=0)(0−0.5038)² + P(y=1)(1−0.5038)² = 0.4962 × 0.5038² + 0.5038 × 0.4962² = 0.4962 × 0.5038 ≈ 0.250. This is exactly the variance of a Bernoulli(0.5038) variable.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 12: Covariance, Correlation & Standardization
  // ══════════════════════════════════════════════════════════════════
  {
    id: "cov-corr",
    title: "Covariance, Correlation & Standardization",
    subtitle: "The input to EFA — what the correlation matrix contains",
    color: "#6F9289",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `Before running EFA, your 11 domain scores are on different scales
(some 1–5, some 0–10). EFA operates on the correlation matrix —
standardized covariances — so scale differences don't bias the factors.

Standardization transforms each domain to Z-score scale (mean=0, SD=1).
The correlation matrix then captures only *shared variation*, not scale differences.`,
      },
      {
        type: "definition",
        heading: "Covariance and Correlation",
        content: `**Sample covariance** between variables X and Y:`,
        latex: `s_{XY} = \\frac{1}{n-1}\\sum_{i=1}^n (x_i - \\bar{x})(y_i - \\bar{y})`,
        content2: `**Pearson correlation** (standardized covariance):`,
        latex2: `r_{XY} = \\frac{s_{XY}}{s_X s_Y} \\in [-1, 1]`,
        content3: `**Standardization (Z-score)**:`,
        latex3: `z_i = \\frac{x_i - \\bar{x}}{s_X}`,
        content4: `After standardization: mean = 0, SD = 1. The correlation matrix of standardized variables = covariance matrix of standardized variables.`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `EFA was run on the 11-variable correlation matrix (11×11, with 1s on the diagonal).
KMO = 0.822 tests this matrix — are the off-diagonal correlations sufficiently large relative to partial correlations?
Bartlett's test asks: is this matrix significantly different from an identity matrix (all off-diagonals = 0)?

The factor model then decomposes this correlation matrix:`,
        latex: `\\mathbf{R} \\approx \\mathbf{\\Lambda}\\mathbf{\\Phi}\\mathbf{\\Lambda}^T + \\mathbf{\\Psi}`,
        content2: `where R is the 11×11 correlation matrix, Λ is 11×2 loadings, Φ is 2×2 factor correlations, Ψ is diagonal uniqueness.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "Why standardize before EFA? Without standardization, domains with larger raw scales would dominate the factors. Standardization ensures each domain contributes equally in the initial extraction.",
          "What's on the diagonal of the correlation matrix? 1.0 (each variable correlates perfectly with itself). EFA typically replaces diagonals with communality estimates (PAF) or uses them as-is (ML).",
          "What's the difference between covariance-based and correlation-based EFA? Covariance-based EFA respects original scales (sometimes appropriate for items on the same scale). Correlation-based is standard when items use different scales — as in your case.",
        ],
      },
    ],
    questions: [
      {
        id: "cov-q1",
        stem: "Why does EFA in your thesis operate on the correlation matrix rather than the raw covariance matrix?",
        options: [
          { id: "a", text: "The covariance matrix is not available in R" },
          { id: "b", text: "Your 11 adjustment domains are on different scales, so the covariance matrix would weight higher-variance domains more heavily. The correlation matrix standardizes all domains to unit variance, ensuring equal contribution." },
          { id: "c", text: "EFA always requires the correlation matrix by definition" },
          { id: "d", text: "The correlation matrix is easier to compute" },
        ],
        correct: "b",
        explanation: `The correlation matrix is a standardized covariance matrix where all variables are on the same (unit variance) scale. If your domains have different raw scales (e.g., 1–5 vs. 0–100), the covariance matrix would let high-variance domains dominate factor extraction. The correlation matrix removes this scale dependency, so factors reflect genuine shared patterns of variation.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 13: Eigenvalues, Eigenvectors & Factor Extraction
  // ══════════════════════════════════════════════════════════════════
  {
    id: "eigenvalues",
    title: "Eigenvalues & Factor Extraction",
    subtitle: "The mathematical machinery behind EFA",
    color: "#B76C58",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `The correlation matrix encodes how 11 variables co-vary.
Eigendecomposition finds the "principal directions" of this co-variation —
directions in which the data vary most.

Eigenvalues tell you: how much variance does each direction explain?
Eigenvectors tell you: which combination of original variables defines that direction?

In EFA, eigenvalues help decide how many factors to retain (parallel analysis compares
observed eigenvalues to those expected from random data).`,
      },
      {
        type: "definition",
        heading: "Eigendecomposition",
        content: `For a symmetric matrix R (the correlation matrix), eigendecomposition gives:`,
        latex: `\\mathbf{R} = \\mathbf{Q}\\mathbf{\\Lambda}_{\\text{eig}}\\mathbf{Q}^T`,
        content2: `Where:
• Q = matrix of eigenvectors (columns), each of length 1 and orthogonal to others
• Λ_eig = diagonal matrix of eigenvalues λ₁ ≥ λ₂ ≥ ⋯ ≥ λₚ

**Key property**:`,
        latex2: `\\mathbf{R}\\mathbf{q}_k = \\lambda_k\\mathbf{q}_k`,
        content3: `The k-th eigenvector qₖ spans a direction; λₖ scales it.
Large λₖ → that direction explains much variance in the correlation matrix.

**Proportion of variance** explained by factor k:`,
        latex3: `\\frac{\\lambda_k}{p} \\quad \\text{(for a standardized }p\\text{-variable matrix, trace = }p\\text{)}`,
      },
      {
        type: "derivation",
        heading: "Parallel Analysis",
        content: `You used parallel analysis (Horn, 1965; best practice) for factor retention.

**Algorithm**:
1. Compute eigenvalues λ₁ ≥ ⋯ ≥ λₚ from your real data (11×11 R)
2. Generate B random datasets of same dimensions (133×11, standard normal)
3. For each random dataset, compute eigenvalues; take the 95th percentile across B simulations
4. Retain factor k if λₖ(real) > λₖ(95th percentile, random)`,
        latex: `\\text{Retain factor }k \\iff \\lambda_k^{\\text{real}} > \\lambda_k^{\\text{random, 95th pct}}`,
        content2: `Result: parallel analysis supported 2 factors for your 11-item, N=133 data.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "Why not use Kaiser criterion (eigenvalue > 1)? Kaiser criterion is known to overextract factors and was derived for PCA not EFA. Parallel analysis is the current best practice (Hayton et al., 2004).",
          "What do your two eigenvalues look like? They should be clearly above the parallel analysis threshold; the third eigenvalue falls below it. Report the actual values from your R output.",
          "Could you extract 3 factors? Technically yes, but parallel analysis doesn't support it, and the third factor may not be interpretable. The two-factor solution has theoretical coherence.",
          "What is the total variance explained by 2 factors? Sum of the two eigenvalues divided by p=11 gives the proportion. This should be in your R output (psych::fa summary).",
        ],
      },
    ],
    questions: [
      {
        id: "eigen-q1",
        stem: "In parallel analysis, you retain a factor if its eigenvalue from your real data exceeds the 95th percentile eigenvalue from random data. What does it mean if your 3rd eigenvalue falls below this threshold?",
        options: [
          { id: "a", text: "The 3rd factor is unreliable and should always be excluded from any analysis" },
          { id: "b", text: "The 3rd dimension of your data explains no more variance than would be expected by chance in random data of the same size — insufficient evidence to retain a 3rd factor" },
          { id: "c", text: "Your data has fewer than 3 variables" },
          { id: "d", text: "Parallel analysis failed to converge" },
        ],
        correct: "b",
        explanation: `Parallel analysis compares observed eigenvalues to those from random noise data. If the 3rd observed eigenvalue ≤ the random 95th percentile, the 3rd factor explains no more variance than chance. This means extracting a 3rd factor would be fitting noise, not genuine shared variance. This is the principal reason to retain exactly 2 factors.`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 14: Regression Factor Scoring
  // ══════════════════════════════════════════════════════════════════
  {
    id: "factor-scoring",
    title: "Regression Factor Scoring",
    subtitle: "Computing factor scores from observed item responses",
    color: "#C6A36A",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `After EFA identifies two factors, you need each student's score on each factor —
their personal "Practical Pressure" value and "Emotional Strain" value.

You can't observe factors directly (they're latent). But you can estimate them
from the 11 observed domain scores, weighted by how much each domain reflects each factor.

Regression factor scoring finds the optimal linear combination of observed scores
that best estimates each latent factor.`,
      },
      {
        type: "definition",
        heading: "The Regression Scoring Formula",
        content: `Factor scores estimated via regression:`,
        latex: `\\hat{\\boldsymbol{\\xi}} = \\mathbf{R}^{-1}\\mathbf{\\Lambda}\\mathbf{\\Phi}\\,\\mathbf{z}`,
        content2: `Where:
• $\\mathbf{z}$ = vector of standardized item scores (11×1) for one person
• $\\mathbf{\\Lambda}$ = factor loading matrix (11×2)
• $\\mathbf{\\Phi}$ = factor correlation matrix (2×2)
• $\\mathbf{R}^{-1}$ = inverse of the item correlation matrix (11×11)
• $\\hat{\\boldsymbol{\\xi}}$ = estimated factor scores (2×1) for this person`,
        content3: `The result $\\hat{\\boldsymbol{\\xi}} = (\\xi_1, \\xi_2)^T$ gives each person's Practical and Emotional factor scores on a standardized scale.`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `Regression factor scoring was applied to all 133 students after EFA.
Each student gets two factor scores: ξ₁ (Practical Pressure) and ξ₂ (Emotional Strain).

The worked example person: ξ₁ = 0.672478, ξ₂ = 0.810704 — both above zero (above average burden on both dimensions).

These are then combined into the composite C = (ξ₁ + ξ₂)/2 = 0.741591,
and min-max rescaled to CRI = 61.48.

**Important limitation**: The exact factor-scoring coefficient matrix (R⁻¹ΛΦ) depends on your R output
and is not independently reconstructable from the thesis text alone.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "Why regression scoring, not sum scoring? Sum scoring (e.g., just average the Factor 1 items) doesn't account for cross-loadings or inter-item correlations. Regression scoring uses the full correlation structure for optimal estimation.",
          "Are factor scores exact? No — they're estimates with error (indeterminacy). Multiple different factor score matrices can be consistent with the same factor model. Regression scoring minimizes mean squared error.",
          "Why do factor scores have mean 0? Because item scores were standardized (mean 0, SD 1) before EFA. The factor scores inherit this centering.",
          "What software computed these? The psych package in R (fa() function with scores='regression' or scores='Bartlett'). Report which you used.",
        ],
      },
    ],
    questions: [
      {
        id: "fs-q1",
        stem: "Why does regression factor scoring use R⁻¹ (the inverse correlation matrix) in its formula?",
        options: [
          { id: "a", text: "To normalize the factor scores to unit variance" },
          { id: "b", text: "To remove the shared variance between items — if two items are highly correlated, you shouldn't double-count their joint contribution to the factor score" },
          { id: "c", text: "Because factor scores must sum to zero" },
          { id: "d", text: "R⁻¹ converts loadings from the oblique to orthogonal scale" },
        ],
        correct: "b",
        explanation: `R⁻¹ accounts for inter-item correlations. Without it, highly correlated items (e.g., Financial strain and Housing instability, both on Factor 1) would each contribute their full weight, effectively double-counting that shared information. R⁻¹ downweights redundant shared information and upweights unique contributions — this is what makes regression scoring optimal (minimum MSE).`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LESSON 15: Communalities, Uniqueness & Cross-Loadings
  // ══════════════════════════════════════════════════════════════════
  {
    id: "communality",
    title: "Communalities, Uniqueness & Cross-Loadings",
    subtitle: "How well does the factor model represent each item?",
    color: "#6F9289",
    sections: [
      {
        type: "intuition",
        heading: "The Big Idea",
        content: `Not every item is equally well-explained by the factors.
An item that loads highly on one factor is well-captured (high communality, low uniqueness).
An item that loads moderately on both factors (cross-loading) is ambiguous —
it doesn't have a clear "home" in either factor.

Understanding these helps defend your factor structure and acknowledge its limitations.`,
      },
      {
        type: "definition",
        heading: "Formal Definitions",
        content: `**Communality** $h_i^2$ — proportion of item i's variance shared with the factors:`,
        latex: `h_i^2 = \\sum_j \\lambda_{ij}^2 + 2\\sum_{j<k}\\lambda_{ij}\\lambda_{ik}\\phi_{jk}`,
        content2: `Under oblique rotation (your thesis), cross-products of loadings weighted by factor correlations contribute.

Simplified for two factors with correlation φ:`,
        latex2: `h_i^2 = \\lambda_{i1}^2 + \\lambda_{i2}^2 + 2\\lambda_{i1}\\lambda_{i2}\\phi_{12}`,
        content3: `**Uniqueness** $\\psi_i$ — variance specific to item i (not shared):`,
        latex3: `\\psi_i = 1 - h_i^2`,
        content4: `**Cross-loading**: an item with loadings > 0.30 on both factors simultaneously.`,
      },
      {
        type: "thesis",
        heading: "In Your Thesis",
        content: `Example communalities from your loadings (approximate, using φ=0.395):

• Financial Strain (λ₁=0.782, λ₂=0.054): h² ≈ 0.782² + 0.054² + 2(0.782)(0.054)(0.395) ≈ 0.614 + 0.003 + 0.033 = 0.650
  Uniqueness ≈ 0.350 — well-explained by Factor 1

• Work-Life Balance (λ₁=0.312, λ₂=0.598): h² ≈ 0.312² + 0.598² + 2(0.312)(0.598)(0.395) ≈ 0.097 + 0.358 + 0.147 = 0.602
  This item cross-loads moderately — it has meaningful presence on both factors.`,
      },
      {
        type: "defense",
        heading: "Defense Readiness",
        points: [
          "What counts as a cross-loading? Commonly: loading ≥ 0.30 on a secondary factor alongside the primary. Work-Life Balance (0.312 on F1, 0.598 on F2) is a borderline cross-loader — worth noting.",
          "Does cross-loading invalidate the factor structure? Not necessarily. It may reflect that work-life balance genuinely spans both practical and emotional domains. Report it and interpret it theoretically.",
          "What's a good communality? Generally h² > 0.40 is considered adequate. Items with very low communality contribute little to the factors and might be candidates for removal in scale refinement.",
          "What is factor indeterminacy? Even given a factor model, the latent factors are not uniquely determined — many factor score matrices are consistent with the model. This is an inherent limitation of EFA.",
        ],
      },
    ],
    questions: [
      {
        id: "comm-q1",
        stem: "An item with communality h²=0.15 means:",
        options: [
          { id: "a", text: "The item loads 0.15 on the primary factor" },
          { id: "b", text: "Only 15% of this item's variance is shared with the extracted factors — most of its variance is unique/unexplained by the factor model" },
          { id: "c", text: "The item's factor loading is statistically significant at p=0.15" },
          { id: "d", text: "This item should be assigned to Factor 1" },
        ],
        correct: "b",
        explanation: `Communality h² is the proportion of an item's total variance explained by all factors combined. h²=0.15 means 85% of this item's variance is unique — not captured by the two-factor model. This item is poorly represented by the factors, which suggests it may be measuring something different from the two main adjustment dimensions.`,
      },
    ],
  },
];
