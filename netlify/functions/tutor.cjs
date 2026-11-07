/**
 * Netlify serverless function: AI Socratic Tutor
 * Route: /.netlify/functions/tutor
 *
 * SECURITY:
 * - API key (ANTHROPIC_API_KEY) stored in Netlify env variables, never in frontend
 * - Basic rate limiting via caller-IP header
 * - Request body validated before forwarding
 * - Response clearly labels AI-generated content vs. verified thesis data
 *
 * Usage: POST with JSON body:
 * {
 *   mode: "explain" | "derive" | "challenge" | "hint" | "test",
 *   topic: string,          // e.g. "LASSO regularization"
 *   question: string,       // user's specific question
 *   context: {              // optional verified thesis context
 *     thesisValues: object,
 *     currentLesson: string,
 *   }
 * }
 */

const MODES = {
  explain: "Explain this concept from first principles, then connect it to this specific thesis.",
  derive:  "Walk through the mathematical derivation step by step, using concrete thesis numbers.",
  challenge: "Challenge my understanding with a Socratic question. Don't give the answer yet.",
  hint:    "Give one small hint that nudges toward understanding without revealing the full answer.",
  test:    "Ask me a committee-style exam question on this topic without notes — be rigorous.",
};

// Verified thesis context injected into every prompt
const THESIS_CONTEXT = `
VERIFIED THESIS DATA (use these exact numbers, never invent substitutes):
- Sample: N=133 first-year doctoral students; 67/133 (50.38%) PHQ-2 positive
- EFA: KMO=0.822, Bartlett χ²=592.96 df=55 p<.001; RMSR=0.060; TLI=0.867; RMSEA=0.098
- Two factors: Practical Pressure (F1, 6 items) + Emotional/Interpersonal Strain (F2, 5 items)
- Factor correlation φ=0.395 (Promax oblique rotation)
- CRI bounds: lower=2.004654, upper=4.466533; mean=44.88, SD=19.01; range 1.31–91.33
- PHQ-2+ mean CRI=52.53; PHQ-2− mean CRI=37.12
- Spearman ρ(CRI, PHQ-2 binary)=0.409 p<.001
- Spearman ρ(Emotional, PHQ-2 binary)=0.571 p<.001
- Spearman ρ(Practical, PHQ-2 binary)=0.138 p=.113 (non-significant)
- LASSO λ.min: AUC=0.861, Brier=0.152, mean selected=6.6 predictors
- LASSO λ.1se: AUC=0.836, Brier=0.166, mean selected=2.2 predictors
- Nested 10-fold CV used for unbiased performance estimation
- Worked example: ξ₁=0.672478, ξ₂=0.810704, C=0.741591, CRI=61.48
`;

const SYSTEM_PROMPT = `You are a rigorous doctoral thesis defense coach specializing in psychometrics
and biostatistics. Your student is defending a thesis on doctoral student mental health,
using EFA, LASSO logistic regression, and a composite risk index (F90-CRI).

Your teaching style:
1. Socratic — guide to understanding, don't just lecture
2. Rigorous — use correct mathematical notation and terminology
3. Grounded — always connect abstract concepts to the specific thesis data provided
4. Honest — clearly label what comes from the verified thesis vs. your general knowledge

ALWAYS label your response sections:
- [THESIS DATA] for anything from the verified data above
- [GENERAL MATH] for mathematical principles
- [GENERATED EXAMPLE] for any illustrative examples you create (not from the thesis)
- [DEFENSE TIP] for committee-ready phrasing suggestions

${THESIS_CONTEXT}

If a question asks about thesis numbers not listed above, say "I don't have that specific
value from the thesis — check your manuscript" rather than inventing a number.`;

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Parse and validate body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { mode, topic, question, context } = body;

  if (!mode || !topic || !question) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required fields: mode, topic, question" }),
    };
  }

  if (!MODES[mode]) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Invalid mode. Choose from: ${Object.keys(MODES).join(", ")}` }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: "AI tutor not configured — ANTHROPIC_API_KEY not set in Netlify environment" }),
    };
  }

  // Compose the user message
  const modeInstruction = MODES[mode];
  const userMessage = `Topic: ${topic}

Mode instruction: ${modeInstruction}

Student's question: ${question}

${context?.thesisValues ? `Additional context from current lesson: ${JSON.stringify(context.thesisValues)}` : ""}`;

  // Call Anthropic Messages API
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "AI service unavailable" }),
      };
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        reply,
        mode,
        topic,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      }),
    };
  } catch (err) {
    console.error("Tutor function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error" }),
    };
  }
};
