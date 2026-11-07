/**
 * Cloud sync — upgrades localStorage mastery to Supabase when user is signed in.
 *
 * Table: academy_mastery
 *   user_id    uuid references auth.users (RLS: user_id = auth.uid())
 *   topic_id   text
 *   mastery    int
 *   attempts   jsonb
 *   completed_at timestamptz
 *   updated_at timestamptz default now()
 *
 * RLS policy (apply in Supabase SQL editor):
 *   create policy "Users own their mastery"
 *   on academy_mastery for all
 *   using (user_id = auth.uid())
 *   with check (user_id = auth.uid());
 */

import { getAccessToken, getUser } from "./auth.js";

const SUPABASE_URL = "https://sonbphyeomzzcdyuiotl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbmJwaHllb216emNkeXVpb3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTIxMzAsImV4cCI6MjA2MjcyODEzMH0.YVy_GWnbynFCOFAJBqS-Jq3lViGCGKwrS6LHRkOHBE8";

function headers(token) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation,resolution=merge-duplicates",
  };
}

async function rest(path, method = "GET", body) {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Mastery sync ───────────────────────────────────────────────────────────

/**
 * Push a single topic's progress to Supabase (upsert).
 * Falls back silently — localStorage remains authoritative.
 */
export async function pushMastery(topicId, progress) {
  const user = getUser();
  if (!user) return;
  try {
    await rest("/academy_mastery", "POST", [{
      user_id: user.id,
      topic_id: topicId,
      mastery: progress.mastery,
      attempts: progress.attempts,
      completed_at: progress.completedAt
        ? new Date(progress.completedAt).toISOString()
        : null,
    }]);
  } catch {
    // fail silently — local copy is still there
  }
}

/**
 * Pull all mastery rows for the current user from Supabase.
 * Returns { [topicId]: { mastery, attempts, completedAt } }
 */
export async function pullMastery() {
  const user = getUser();
  if (!user) return null;
  try {
    const rows = await rest(`/academy_mastery?user_id=eq.${user.id}`);
    if (!rows) return null;
    const result = {};
    rows.forEach((row) => {
      result[row.topic_id] = {
        mastery: row.mastery,
        attempts: row.attempts || [],
        completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
      };
    });
    return result;
  } catch {
    return null;
  }
}

/**
 * Merge cloud progress into localStorage (cloud wins on higher mastery).
 * Call this after sign-in.
 */
export async function mergeCloudProgress() {
  const cloud = await pullMastery();
  if (!cloud) return;
  for (const [topicId, cloudProg] of Object.entries(cloud)) {
    const localKey = `academy_lesson_${topicId}`;
    try {
      const localRaw = localStorage.getItem(localKey);
      const local = localRaw ? JSON.parse(localRaw) : { mastery: 0, attempts: [] };
      // Cloud wins if mastery is higher
      if (cloudProg.mastery > local.mastery) {
        localStorage.setItem(localKey, JSON.stringify(cloudProg));
      }
    } catch {}
  }
}

// ── FSRS Spaced Repetition ─────────────────────────────────────────────────
/**
 * Simplified FSRS-inspired algorithm.
 * Full FSRS requires tracking stability, difficulty, retrievability.
 * This implements the core idea: intervals grow exponentially with successful reviews.
 *
 * Card state stored in localStorage (Phase 3; will move to Supabase if auth added):
 * {
 *   stability: number  (1–30+ days),
 *   difficulty: number (1–10),
 *   due: timestamp,
 *   reps: number,
 *   lapses: number,
 * }
 */
const FSRS_DEFAULT = { stability: 1, difficulty: 5, due: Date.now(), reps: 0, lapses: 0 };

export function getCardState(cardId) {
  try {
    const raw = localStorage.getItem(`fsrs_${cardId}`);
    return raw ? JSON.parse(raw) : { ...FSRS_DEFAULT };
  } catch {
    return { ...FSRS_DEFAULT };
  }
}

/**
 * rating: 1=Again, 2=Hard, 3=Good, 4=Easy
 */
export function reviewCard(cardId, rating) {
  const state = getCardState(cardId);
  const now = Date.now();

  let { stability, difficulty, reps, lapses } = state;

  if (rating === 1) {
    // Again — reset
    lapses += 1;
    stability = 1;
    difficulty = Math.min(10, difficulty + 1.5);
  } else {
    reps += 1;
    // Difficulty update
    difficulty = Math.max(1, difficulty + (0.1 - (4 - rating) * 0.08));
    // Stability update: grows with successful reviews, dampened by difficulty
    const factor = 1 + (rating - 2) * 0.2; // 0.8 for Hard, 1.0 for Good, 1.2 for Easy
    stability = Math.max(1, stability * (2 - difficulty / 10) * factor * (1 + reps * 0.05));
    stability = Math.min(stability, 90); // cap at 90 days
  }

  const due = now + stability * 24 * 60 * 60 * 1000;
  const nextState = { stability, difficulty, due, reps, lapses };

  try {
    localStorage.setItem(`fsrs_${cardId}`, JSON.stringify(nextState));
  } catch {}

  return { nextState, intervalDays: Math.round(stability) };
}

/**
 * Get all cards due now, sorted by most overdue first.
 * cardIds: array of card IDs to check.
 */
export function getDueCards(cardIds) {
  const now = Date.now();
  return cardIds
    .map((id) => ({ id, state: getCardState(id) }))
    .filter(({ state }) => state.due <= now)
    .sort((a, b) => a.state.due - b.state.due);
}
