/**
 * Academy Supabase client — uses the same project as ThesisApp
 * but isolates academy operations here for clarity.
 *
 * SECURITY NOTE: The anon key is safe for public survey data and
 * RLS-protected rows. Do NOT put service-role keys here.
 * Private learning records must be protected by RLS (see SQL migrations).
 */

const SUPABASE_URL = "https://sonbphyeomzzcdyuiotl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbmJwaHllb216emNkeXVpb3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTIxMzAsImV4cCI6MjA2MjcyODEzMH0.YVy_GWnbynFCOFAJBqS-Jq3lViGCGKwrS6LHRkOHBE8";

async function supabaseRequest(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Lesson progress (stored locally + synced when auth added) ─────────────
// Key pattern: `academy_lesson_{topicId}_{userId||"anon"}`
export function getLessonProgress(topicId) {
  try {
    const raw = localStorage.getItem(`academy_lesson_${topicId}`);
    return raw ? JSON.parse(raw) : { mastery: 0, attempts: [], completedAt: null };
  } catch {
    return { mastery: 0, attempts: [], completedAt: null };
  }
}

export function saveLessonProgress(topicId, progress) {
  try {
    localStorage.setItem(`academy_lesson_${topicId}`, JSON.stringify(progress));
  } catch {
    // quota exceeded — not fatal
  }
}

export function recordAttempt(topicId, { questionId, correct, selectedAnswer, correctAnswer }) {
  const prog = getLessonProgress(topicId);
  prog.attempts = prog.attempts || [];
  prog.attempts.push({
    questionId,
    correct,
    selectedAnswer,
    correctAnswer,
    timestamp: Date.now(),
  });
  // Simple mastery: % correct across last 10 attempts per question
  const byQ = {};
  prog.attempts.forEach((a) => {
    if (!byQ[a.questionId]) byQ[a.questionId] = [];
    byQ[a.questionId].push(a.correct);
  });
  const scores = Object.values(byQ).map((arr) => {
    const last5 = arr.slice(-5);
    return last5.filter(Boolean).length / last5.length;
  });
  prog.mastery = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
    : 0;
  if (prog.mastery >= 80 && !prog.completedAt) {
    prog.completedAt = Date.now();
  }
  saveLessonProgress(topicId, prog);
  return prog;
}

export function getAllProgress() {
  const result = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("academy_lesson_")) {
      const topicId = key.replace("academy_lesson_", "");
      try {
        result[topicId] = JSON.parse(localStorage.getItem(key));
      } catch {
        // skip corrupted
      }
    }
  }
  return result;
}

// ── Mock defense session log ───────────────────────────────────────────────
export function getDefenseSessions() {
  try {
    const raw = localStorage.getItem("academy_defense_sessions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDefenseSession(session) {
  try {
    const sessions = getDefenseSessions();
    sessions.push({ ...session, timestamp: Date.now() });
    localStorage.setItem("academy_defense_sessions", JSON.stringify(sessions.slice(-20)));
  } catch {}
}

// ── Per-question mastery (defense flashcard / browse mode) ────────────────
// Stored as: { [questionId]: "known" | "partial" | null }
export function getQuestionMastery(qId) {
  try {
    const raw = localStorage.getItem("academy_q_mastery");
    const all = raw ? JSON.parse(raw) : {};
    return all[qId] || null;
  } catch {
    return null;
  }
}

export function setQuestionMastery(qId, level) {
  try {
    const raw = localStorage.getItem("academy_q_mastery");
    const all = raw ? JSON.parse(raw) : {};
    if (level === null) {
      delete all[qId];
    } else {
      all[qId] = level;
    }
    localStorage.setItem("academy_q_mastery", JSON.stringify(all));
  } catch {}
}

export function getAllMastery() {
  try {
    const raw = localStorage.getItem("academy_q_mastery");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
