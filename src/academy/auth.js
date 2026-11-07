/**
 * Academy auth module — Supabase Auth wrapper
 *
 * Uses the same project as ThesisApp. The anon key is safe for auth
 * operations (email/password, OAuth tokens). The service-role key is
 * never exposed here — it lives only in Netlify environment variables
 * and is called only from server-side Netlify functions.
 *
 * RLS policies ensure each user can only access their own rows in:
 *   - academy_mastery (topicId, mastery, attempts, lastStudied)
 *   - academy_defense_sessions (category, score, timestamp)
 */

const SUPABASE_URL = "https://sonbphyeomzzcdyuiotl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbmJwaHllb216emNkeXVpb3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTIxMzAsImV4cCI6MjA2MjcyODEzMH0.YVy_GWnbynFCOFAJBqS-Jq3lViGCGKwrS6LHRkOHBE8";

const AUTH_URL = `${SUPABASE_URL}/auth/v1`;

function authHeaders(token) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

// ── Session storage ────────────────────────────────────────────────────────
const SESSION_KEY = "academy_session";

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Check expiry
    if (session.expires_at && Date.now() / 1000 > session.expires_at - 60) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function storeSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

// ── Auth API ────────────────────────────────────────────────────────────────
export async function signUp(email, password) {
  const res = await fetch(`${AUTH_URL}/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Sign up failed");
  if (data.session) storeSession(data.session);
  return data;
}

export async function signIn(email, password) {
  const res = await fetch(`${AUTH_URL}/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Sign in failed");
  storeSession(data);
  return data;
}

export async function signOut() {
  const session = getStoredSession();
  if (session?.access_token) {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: "POST",
        headers: authHeaders(session.access_token),
      });
    } catch {}
  }
  clearSession();
}

export async function refreshSession() {
  const session = getStoredSession();
  if (!session?.refresh_token) return null;
  try {
    const res = await fetch(`${AUTH_URL}/token?grant_type=refresh_token`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!res.ok) {
      clearSession();
      return null;
    }
    const data = await res.json();
    storeSession(data);
    return data;
  } catch {
    return null;
  }
}

export function getUser() {
  const session = getStoredSession();
  return session?.user || null;
}

export function getAccessToken() {
  return getStoredSession()?.access_token || null;
}
