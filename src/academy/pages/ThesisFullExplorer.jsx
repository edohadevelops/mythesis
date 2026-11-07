/**
 * Full Thesis Explorer — Chapters 1–5
 * Content drawn directly from the actual thesis manuscript.
 * Defense annotations explain what each section means and how to defend it.
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SAMPLE, EFA, CRI, CORRELATIONS, LASSO } from "../data/thesisResults.js";
import { ChevronLeft, BookOpen, Info, Link2, ChevronDown, ChevronUp } from "lucide-react";

const CHAPTERS = [
  {
    id: "ch1",
    number: 1,
    title: "Introduction",
    color: "#C6A36A",
    sections: [
      {
        id: "ch1-background",
        heading: "1.1 Background",
        content: `In the 2023/2024 academic year there were over 1.1 million international students in US colleges and universities — a new record, up 6.6% on the previous year. These are people who face a whole host of issues beyond the normal demands of academic study: getting work authorisation, keeping up with studies, meeting family expectations, tight schedules, financial stress, social isolation, and self-doubt, all at once. For students from cultures where mental health isn't spoken about, it's even harder to get help.\n\nToo many students will only reach out when it's already too late. And when help does come, it's rarely from the institution — it's coming from the community itself. This research starts from that reality.`,
        annotation: "This is your 'why it matters' opening. The 1.1 million figure sets the scale. When a committee asks why you chose this topic — this is the answer. You can speak to it personally as an international student yourself.",
        connections: ["International student population scale", "Reactive vs. proactive support systems", "Cultural stigma as barrier"],
        mathLink: null,
      },
      {
        id: "ch1-problem",
        heading: "1.2 Statement of the Problem",
        content: `The existing measures address depression, anxiety, loneliness, and acculturative stress but they don't provide the multi-dimensional adjustment burden score developed in this study. The issue is one of measurement: can the observed adjustment domains be brought together in a clear and defensible way without equating adjustment difficulties with depression?\n\nThe F90-CRI is exploratory and will require further validation prior to any institutional use.`,
        annotation: "The key phrase is 'without equating adjustment difficulties with depression.' This is what distinguishes your CRI from the PHQ-2 — it measures burden, not diagnosis. The committee may push on this distinction. Know it cold: PHQ-2 = screening outcome, CRI = adjustment burden index.",
        connections: ["CRI ≠ PHQ-2 prediction", "Measurement vs. prediction", "Exploratory framing"],
        mathLink: null,
      },
      {
        id: "ch1-questions",
        heading: "1.3 Research Questions",
        content: `Primary research question: How can the various domains of psychosocial adjustment measured in international students at Missouri State be combined into a single, interpretable F90 composite risk index of adjustment burden as derived from the model?\n\nSecondary questions:\n• How do the eleven measured adjustment variables group into underlying dimensions?\n• How can the resulting factor structure be used to construct an interpretable, bounded F90-CRI score?\n• How do F90-CRI scores differ between students who screen positive and negative on the PHQ-2?\n• How well does a separate logistic LASSO model predict PHQ-2 screening status under nested cross-validation?`,
        annotation: "Four secondary questions map to four results: (1) EFA two-factor solution, (2) CRI bounded 0–100 construction, (3) Spearman ρ = 0.409 between CRI and PHQ-2, (4) LASSO AUC = 0.861 / 0.836. When a committee says 'walk me through your research questions' — these map directly to your findings.",
        connections: ["RQ1 → EFA", "RQ2 → CRI formula", "RQ3 → Spearman correlations", "RQ4 → LASSO"],
        mathLink: null,
      },
      {
        id: "ch1-significance",
        heading: "1.4 Significance of the Study",
        content: `Research only matters if it changes something for someone. Consider what this looks like in practice: a student arrives at Missouri State in August from another country. They don't know anyone. They don't know what their insurance covers. They're figuring all of this out alone, at the same time they're trying to perform academically and hold themselves together emotionally. That is the reality for most international students today.\n\nThe significance lies in developing an explicit measurement framework, examining how practical and emotional pressures differ, and showing how a provisional burden score could be interpreted. Its immediate contribution is methodological and descriptive.`,
        annotation: "This is the section that connects the math to the mission. The committee appreciates when a student can articulate why their work matters beyond the numbers. The phrase 'methodological and descriptive' is intentional — it manages expectations honestly while still making the case.",
        connections: ["First 90 application vision", "Proactive vs. reactive framing", "Methodological contribution"],
        mathLink: null,
      },
      {
        id: "ch1-scope",
        heading: "1.5 Scope and Delimitations",
        content: `This is a cross-sectional study of 133 complete survey responses from international students at Missouri State University. Recruitment was voluntary and non-probability based, so the findings cannot be assumed to be representative of international students at MSU or elsewhere. The analysis uses 11 scored adjustment variables derived from Q8–Q30. Q6 and Q7 are used to define the PHQ-2 outcome and are therefore not included in the factor model. There is no external validation, no longitudinal follow-up, no clinical diagnosis, and no application deployed.`,
        annotation: "This paragraph does something important — it pre-empts every generalizability criticism the committee might raise. By explicitly naming the limitations in scope, you control the narrative. When asked 'can this be applied broadly?' you can say 'as I note in Section 1.5, this is a single-institution exploratory study.'",
        connections: ["N=133 single university", "No external validation", "No clinical thresholds"],
        mathLink: null,
      },
      {
        id: "ch1-first90",
        heading: "1.7 Potential Application: First 90",
        content: `The findings could ultimately feed into First 90 (f90), a proposed application designed to assist international students in their transition to life in the US. At this point the F90-CRI is a research prototype rather than a validated decision rule. Any future application would require independent validation, appropriate safeguards, and student-centred evaluation.\n\nThe index could eventually inform a wellbeing component that summarizes different kinds of adjustment difficulty. It should not automatically classify students, make clinical judgments, or trigger interventions on the basis of this exploratory study.`,
        annotation: "This is where the name 'F90' comes from — the first 90 days. This section is your vision statement. Know the distinction clearly: the thesis develops the measurement framework; First 90 is the eventual application. They are not the same thing yet.",
        connections: ["F90 = research prototype", "Validation required before deployment", "No automatic classification"],
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
        id: "ch2-mental-health",
        heading: "2.2 International Student Mental Health",
        content: `Hyun et al. (2007) found that approximately 44% of international graduate students reported personal problems serious enough to require professional mental health services — but most had not sought help. Identified reasons: limited awareness of services, cultural stigma, and language difficulties.\n\nAcculturative stress (Sandhu & Asrabadi, 1994) encompasses perceived discrimination, homesickness, academic concerns, culture shock, and guilt about leaving home. These provide a foundation for the adjustment domains examined in this study.`,
        annotation: "The 44% figure is striking — use it in your defense if challenged on the sample's 50.38% PHQ-2 positive rate. The rates are in the same ballpark, suggesting your sample may not be as unusual as it seems. The Sandhu & Asrabadi framework directly maps to your 11 survey domains.",
        connections: ["44% need help but don't seek it", "Cultural stigma as measurement motivation", "ASSIS → study domains"],
        mathLink: null,
      },
      {
        id: "ch2-efa-lit",
        heading: "2.12 EFA and Small-Sample Considerations",
        content: `Costello and Osborne (2005) stress the importance of extraction choices, rotation, interpretable loadings, and the problems associated with small samples. Jung (2013) looks at methods for recovering factor structures in small samples and doesn't establish that any one method is automatically appropriate.\n\nWith 133 responses and 11 scored variables we need to consider factorability statistics, parallel analysis, fit, communalities, and sensitivity checks all together — rather than just the sample size as a matter of itself.`,
        annotation: "This is your methodological defense for doing EFA with N=133. The key argument: Jung (2013) says there's no single cutoff; you used a full battery of checks (KMO, Bartlett, parallel analysis, RMSR, TLI, RMSEA) rather than relying on N alone. This is exactly what the committee may challenge.",
        connections: ["N=133 justification", "Full diagnostic battery", "No single-rule reliance"],
        mathLink: "eigenvalues",
      },
      {
        id: "ch2-lasso-lit",
        heading: "2.4 LASSO Regularization",
        content: `Tibshirani (1996) introduced LASSO as a method that performs both regression estimation and variable selection. The main idea: a penalty on coefficient size causes some coefficients to shrink to exactly zero, removing those predictors. Friedman, Hastie, and Tibshirani (2010) described the glmnet package for R, providing efficient coordinate descent implementation.\n\nLASSO is useful here because the penalty can shrink coefficients and set some to zero. Its use in this thesis is supplementary to construction of the factor-based F90-CRI.`,
        annotation: "The critical phrase is 'supplementary to construction of the factor-based F90-CRI.' LASSO predicts PHQ-2; CRI measures adjustment burden. These are two different things. If a committee member conflates them, this section is your citation to redirect.",
        connections: ["LASSO = PHQ-2 prediction only", "CRI = adjustment burden measurement", "glmnet in R"],
        mathLink: "regularization",
      },
      {
        id: "ch2-gap",
        heading: "2.16 Research Gap",
        content: `The literature supports studying adjustment as multidimensional, but the F90-CRI proposed here is a locally estimated research measure. The current study looks at a two-factor model, retains the component scores for interpretation, and reports a bounded overall score using the documented fixed transformation. It does not claim external validation nor does it establish any intervention thresholds.`,
        annotation: "Three honest admissions in one paragraph: locally estimated, no external validation, no intervention thresholds. This is exactly the right tone for a thesis defense. Pre-empting these critiques is stronger than having the committee raise them.",
        connections: ["Locally estimated", "No external validation", "No thresholds"],
        mathLink: null,
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
        heading: "3.3 Study Population and Sampling",
        content: `The population consists of international students enrolled at Missouri State University. A non-probability sampling approach was used: participation was voluntary and students completed the questionnaire if they met eligibility criteria. The survey reached students via existing student networks and communication channels.\n\nA total of ${SAMPLE.N} complete responses were collected. Since the study uses voluntary, non-probability sampling, findings may not fully represent the experiences of all international students at the university.`,
        annotation: "The personal disclosure in your thesis — that you chose this topic partly because of your own experience as an international student — humanizes the work without compromising rigor. Know it and be comfortable with it. It is a strength, not a weakness.",
        connections: ["N=133", "Non-probability convenience sample", "Single institution limitation"],
        mathLink: null,
      },
      {
        id: "ch3-domains",
        heading: "3.4 Survey and Design Instruments",
        content: `The questionnaire includes established screening instruments and additional researcher-developed items. PHQ-2 (Q6–Q7): threshold ≥3 defines positive screening. Eleven predictor domains (Q8–Q30): anxiety (GAD-2), loneliness (UCLA-adapted), acculturative stress (ASSIS-adapted), financial strain, faith disruption, immigration anxiety, housing difficulty, help-seeking barriers, food adjustment, communication anxiety.\n\nQ21 and reverse-scored Q22 were kept separate rather than combined into one faith scale because the items represent different concepts and showed weak combined reliability (α = −0.302).`,
        annotation: "The α = −0.302 for the faith scale is unusual — negative alpha indicates the items are negatively correlated, meaning Q21 (faith difficulty) and Q22 (faith support) pull in opposite directions. This is why they were separated. Expect this question: 'Why didn't you combine the faith items?' Answer: they had negative inter-item correlation.",
        connections: ["Negative alpha → items separated", "Q22 reverse-scored", "11 predictor domains"],
        mathLink: null,
      },
      {
        id: "ch3-efa-method",
        heading: "3.9 EFA and CRI Construction",
        content: `The factor analysis does not require PHQ-2 as an outcome. We examine KMO and Bartlett's test, use parallel analysis to select factors, and apply oblique rotation because the dimensions may be related. Factor scores are obtained via regression scoring (Equation 3.29).\n\nThe combined raw score is Cᵢ = (Pᵢ + Eᵢ)/2, with equal weighting as a stated convention — not a finding of EFA. The bounded index: F90-CRI = 100(C + 2.004654)/(2.461879 + 2.004654). Bounds come from allowed item response ranges under the fixed linear model.`,
        annotation: "Three things to know cold: (1) equal weighting is a choice, not a statistical result; (2) bounds come from the theoretical min/max of the scoring formula, not from percentile ranks of the 133 students; (3) the factor analysis and the LASSO are completely separate analyses. CRI ≠ LASSO probabilities.",
        connections: ["Equal weighting convention", "Theoretical bounds", "EFA ≠ LASSO"],
        mathLink: "factor-scoring",
      },
      {
        id: "ch3-lasso-method",
        heading: "3.7–3.8 LASSO and Nested Cross-Validation",
        content: `The LASSO objective function minimizes the average negative log-likelihood plus λ·Σ|βⱼ|. Penalty λ selected by nested ten-fold CV: inner fold selects λ; outer fold evaluates performance. Two rules compared: λ.min (lowest CV error) and λ.1se (largest λ within 1 SE of minimum).\n\nStandardization applied within training folds only — the same standardization values are then applied to the validation fold. The PHQ-2 items (Q6–Q7) are excluded from the predictor matrix.`,
        annotation: "The 'nested' in nested cross-validation is what prevents optimistic bias. The inner loop picks λ; the outer loop evaluates the whole procedure including λ-selection. If you used only single-loop CV, you'd be evaluating the λ that was already selected to look good — that's circular. Nested CV breaks this by keeping the outer fold truly held-out.",
        connections: ["Inner loop: λ selection", "Outer loop: performance evaluation", "No data leakage"],
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
        id: "ch4-sample",
        heading: "4.2 Participant Characteristics",
        content: `Of the ${SAMPLE.N} complete responses, ${SAMPLE.phq2Positive} (${SAMPLE.phq2PositivePct}%) met the PHQ-2 threshold of at least 3, while ${SAMPLE.N - SAMPLE.phq2Positive} (49.62%) did not. 52.63% were from Nigeria; 10.53% from Ghana; 8.27% from China. 40.6% enrolled at Master's level; 18.05% at PhD level.\n\nThis proportion describes the participating students only. Because participation was voluntary and the sample was drawn from one institution, it should not be interpreted as an estimate of depression prevalence among all international students.`,
        annotation: `The 50.38% PHQ-2 positive rate is notably high. Have an answer ready: it's consistent with published rates for international graduate students (Hyun et al., 2007 found 44% with serious mental health concerns). Self-selection may also play a role — students who are struggling may be more motivated to respond to a mental health survey.`,
        connections: ["50.38% PHQ-2 positive", "Self-selection caveat", "Single institution only"],
        mathLink: "prob-odds",
      },
      {
        id: "ch4-efa",
        heading: "4.4 Exploratory Factor Analysis",
        content: `KMO = ${EFA.kmo}. Bartlett's test: χ²(${EFA.bartlettDf}) = ${EFA.bartlettChi2}, p ${EFA.bartlettP}. Parallel analysis supported retaining two factors.\n\nML two-factor solution with promax rotation: RMSR = ${EFA.rmsr}, TLI = ${EFA.tli}, RMSEA = ${EFA.rmsea}. The fit is imperfect and the solution must be treated as provisional. Estimated factor correlation = ${EFA.factorCorrelation}.\n\nThe factors are described as practical/adjustment-related pressures and emotional/interpersonal difficulties — these labels are interpretive summaries, not confirmed diagnostic constructs.`,
        annotation: `RMSEA = 0.098 exceeds the conventional 0.08 threshold — this will come up. Your answer: the thesis explicitly acknowledges imperfect fit and treats the solution as provisional. RMSR = 0.060 is good (< 0.08). TLI = 0.867 is acceptable. The full diagnostic picture is mixed but not disqualifying for an exploratory study. Also: the KMO of 0.822 is 'meritorious' by Kaiser's classification.`,
        connections: ["KMO=0.822 (meritorious)", "RMSEA=0.098 (marginal)", "Provisional two-factor solution"],
        mathLink: "eigenvalues",
      },
      {
        id: "ch4-cri",
        heading: "4.5–4.6 F90-CRI Construction and Worked Example",
        content: `The bounded CRI uses regression factor scores, standardized by reference SDs (0.941390 for practical, 0.921187 for emotional), combined with equal weight, then transformed:\n\nF90-CRI = 100(C + 2.004654) / (2.461879 + 2.004654)\n\nWorked example: a hypothetical student with moderate scores across all domains produces domain scores that, through standardization and regression factor scoring, yield ξ₁ = 0.672478, ξ₂ = 0.810704, C = 0.741591, CRI = 61.48.\n\nAcross all 133 responses: mean = ${CRI.mean}, SD = ${CRI.sd}, range ${CRI.min}–${CRI.max}.`,
        annotation: "The worked example in Section 4.6 is your most important teaching tool for the defense. Walk through it step by step if asked to show how the CRI is computed. The key numbers to have memorized: 2.004654 (lower bound magnitude), upper = 2.461879, formula denominator = 4.466533.",
        connections: ["CRI formula", "Worked example: CRI=61.48", "Mean=44.88, SD=19.01"],
        mathLink: "factor-scoring",
      },
      {
        id: "ch4-correlations",
        heading: "4.7 Association with PHQ-2 Screening",
        content: `Spearman ρ(F90-CRI, PHQ-2 binary) = ${CORRELATIONS.criVsPhq2Binary.rho}, p ${CORRELATIONS.criVsPhq2Binary.p}\nSpearman ρ(Emotional factor, PHQ-2) = ${CORRELATIONS.emotionalVsPhq2Binary.rho}, p ${CORRELATIONS.emotionalVsPhq2Binary.p}\nSpearman ρ(Practical factor, PHQ-2) = ${CORRELATIONS.practicalVsPhq2Binary.rho}, p ${CORRELATIONS.practicalVsPhq2Binary.p} (non-significant)\n\nPHQ-2+ mean CRI = ${CRI.phq2PosMean}; PHQ-2− mean CRI = ${CRI.phq2NegMean}.\nThis association is descriptive and does not establish causation or diagnostic accuracy.`,
        annotation: "The null result for the Practical factor (ρ=0.138, p=0.113) is not a failure — it's a finding. Practical stressors (financial, immigration, housing) don't significantly predict PHQ-2 at this sample size. The Emotional factor (ρ=0.571) does. This suggests different intervention targets: emotional/interpersonal support is more proximal to depression screening than practical resource problems.",
        connections: ["Emotional factor drives PHQ-2 association", "Null for Practical is a finding", "No causation claim"],
        mathLink: "cov-corr",
      },
      {
        id: "ch4-lasso",
        heading: "4.8 Supplementary LASSO Analysis",
        content: `Nested 10-fold CV results:\nλ.min: AUC = ${LASSO.lambdaMin.auc}, Brier = ${LASSO.lambdaMin.brier}, mean predictors ≈ ${LASSO.lambdaMin.meanSelected}\nλ.1se: AUC = ${LASSO.lambda1se.auc}, Brier = ${LASSO.lambda1se.brier}, mean predictors ≈ ${LASSO.lambda1se.meanSelected}\n\nCalibration (λ.min): intercept = −0.059, slope = 1.042. Calibration (λ.1se): intercept = −0.007, slope = 1.625.\n\nAnxiety and loneliness retained positive coefficients under both rules. Financial strain: −0.546 under λ.min; zero under λ.1se.`,
        annotation: "The λ.min slope of 1.042 is close to the ideal of 1.0 — good calibration. The λ.1se slope of 1.625 is further from ideal. This is one reason λ.min is preferred despite being less parsimonious. The negative coefficient for financial strain under λ.min is counterintuitive but expected: correlated predictors and penalization can reverse coefficient signs. Do not interpret these as causal effects.",
        connections: ["AUC=0.861 excellent discrimination", "Calibration: λ.min better than λ.1se", "Anxiety/loneliness: retained both rules"],
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
        heading: "5.2–5.3 Main Findings and Conclusions",
        content: `The main finding is that adjustment variables can be provisionally summarized into two related but distinguishable dimensions. Practical pressures and emotional/interpersonal difficulties may coexist, but their different relationships with PHQ-2 screening indicate that a single depressive-symptom outcome does not exhaust the adjustment experience captured by the survey.\n\nThe F90-CRI is a transparent numerical summary of estimated adjustment burden, not a PHQ-2 probability. Its two component scores remain important because the same overall value can conceal different patterns of difficulty.`,
        annotation: "The phrase 'the same overall value can conceal different patterns of difficulty' is key. Two students with CRI = 55 might get there very differently — one through emotional burden, one through practical strain. This is why reporting component scores alongside the composite matters. Know this argument.",
        connections: ["CRI ≠ PHQ-2 probability", "Component scores matter", "Two students, same CRI, different profiles"],
        mathLink: null,
      },
      {
        id: "ch5-implications",
        heading: "5.3 Implications for Practice",
        content: `For student-support practice, the results point to the potential value of considering both practical circumstances and emotional or interpersonal experiences when assessing students' needs. However, the present analysis does not justify using the F90-CRI to classify individual students, determine eligibility for services, or make clinical decisions.\n\nIts current contribution is methodological and exploratory: it offers a framework that can be examined and improved with additional evidence.`,
        annotation: "Three things the CRI cannot do yet: classify individuals, determine service eligibility, make clinical decisions. Know these explicitly. If a committee member asks 'so how would you use this?' — your answer is: not yet as a decision tool; as a research framework that informs future instrument development.",
        connections: ["No individual classification", "No service eligibility use", "No clinical decisions"],
        mathLink: null,
      },
      {
        id: "ch5-limitations",
        heading: "5.4 Limitations",
        content: `1. Cross-sectional design — cannot establish temporal or causal relationships.\n2. Voluntary, single-university sample (N=${SAMPLE.N}) — findings may not represent MSU or other institutions.\n3. RMSEA = ${EFA.rmsea} exceeds the conventional 0.08 threshold — fit is imperfect; solution is provisional.\n4. Reverse-coded Q22 has a small negative combined scoring coefficient (−0.00937) — the index is not strictly increasing in every burden domain.\n5. No external validation — calibration and discrimination results are sample-specific.\n6. PHQ-2 is a screening instrument, not a clinical diagnosis.`,
        annotation: "Six limitations. Know all six. For each, have a 2-sentence response: (1) state you acknowledge it, (2) explain why it doesn't invalidate the core finding. For RMSEA: 'the thesis explicitly treats the solution as provisional and reports all fit indices transparently.' For Q22: 'the negative coefficient is a limitation of the fitted scoring rule, not a claim that faith support increases burden.'",
        connections: ["RMSEA=0.098 response", "Q22 negative weight explanation", "No external validation"],
        mathLink: null,
      },
      {
        id: "ch5-future",
        heading: "5.5 Recommendations for Future Research",
        content: `The present findings are preliminary and suggest several directions: (1) replication in a larger, diverse international-student sample at multiple institutions; (2) longitudinal study to examine whether adjustment burden predicts PHQ-2 outcomes over time; (3) confirmatory factor analysis in an independent sample to test the two-factor structure; (4) external validation of the LASSO screening model; (5) evaluation of whether targeted interventions on the emotional/interpersonal factor reduce PHQ-2 positivity.`,
        annotation: "Five future directions matching five limitations. This mapping is intentional and shows methodological maturity. For each committee question about a limitation, you can pivot: 'That's a limitation I address in my future research recommendations — specifically, [future direction X] would directly address this.'",
        connections: ["Limitation → future direction mapping", "CFA as next step", "Longitudinal design needed"],
        mathLink: null,
      },
    ],
  },
];

function ChapterTab({ chapter, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap"
      style={
        active
          ? {
              color: chapter.color,
              background: `${chapter.color}18`,
              border: `1px solid ${chapter.color}40`,
            }
          : { color: "rgba(246,242,233,0.35)" }
      }
    >
      <span className="text-xs opacity-60">Ch{chapter.number}</span>
      {chapter.title}
    </button>
  );
}

function SectionCard({ section }) {
  const [expanded, setExpanded] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 mb-3 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen size={14} className="text-ivory/30 flex-shrink-0" />
          <span className="font-medium text-ivory/90 text-sm">{section.heading}</span>
        </div>
        {expanded ? (
          <ChevronUp size={15} className="text-ivory/30 flex-shrink-0" />
        ) : (
          <ChevronDown size={15} className="text-ivory/30 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          <p className="text-sm text-ivory/70 leading-relaxed whitespace-pre-line mb-4">
            {section.content}
          </p>

          <div className="flex gap-2 flex-wrap mb-3">
            <button
              onClick={() => setShowAnnotation(!showAnnotation)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all"
              style={
                showAnnotation
                  ? {
                      background: "rgba(198,163,106,0.15)",
                      borderColor: "rgba(198,163,106,0.4)",
                      color: "#C6A36A",
                    }
                  : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(246,242,233,0.35)" }
              }
            >
              <Info size={11} />
              {showAnnotation ? "Hide" : "Defense annotation"}
            </button>

            {section.mathLink && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-sage/15 text-sage/50">
                <Link2 size={11} />
                {section.mathLink}
              </span>
            )}
          </div>

          {showAnnotation && (
            <div className="rounded-lg bg-gold/10 border border-gold/20 p-4">
              <div className="text-xs text-gold font-semibold uppercase tracking-wider mb-2">
                Defense Coach
              </div>
              <p className="text-sm text-ivory/80 leading-relaxed">{section.annotation}</p>
              {section.connections?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {section.connections.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-ivory/40"
                    >
                      {c}
                    </span>
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
  const [activeChapter, setActiveChapter] = useState("ch4");

  const chapter = CHAPTERS.find((c) => c.id === activeChapter);

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/academy")}
          className="flex items-center gap-1 text-ivory/40 hover:text-ivory text-sm transition-colors"
        >
          <ChevronLeft size={16} /> Dashboard
        </button>
        <div className="flex-1" />
        <button
          onClick={() => navigate("/academy/thesis")}
          className="text-xs text-ivory/30 hover:text-gold transition-colors"
        >
          Ch4 Deep Dive →
        </button>
      </div>

      <h1 className="text-2xl font-bold text-ivory mb-1">Full Thesis Explorer</h1>
      <p className="text-ivory/40 text-sm mb-6">
        All 5 chapters from your manuscript, with defense coach annotations on every section.
      </p>

      {/* Chapter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-white/8">
        {CHAPTERS.map((ch) => (
          <ChapterTab
            key={ch.id}
            chapter={ch}
            active={activeChapter === ch.id}
            onClick={() => setActiveChapter(ch.id)}
          />
        ))}
      </div>

      {chapter && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: `${chapter.color}20`,
                color: chapter.color,
                border: `1px solid ${chapter.color}30`,
              }}
            >
              {chapter.number}
            </div>
            <div>
              <div className="text-xs text-ivory/30">Chapter {chapter.number}</div>
              <div className="font-semibold text-ivory">{chapter.title}</div>
            </div>
          </div>

          {chapter.sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}
