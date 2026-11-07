/**
 * Auth page — sign in / sign up for cloud sync.
 * Does NOT gate any academy content — it's optional.
 * Benefits when signed in:
 *   - Progress synced across devices
 *   - Spaced repetition queue persisted
 *   - Notes per thesis section (Phase 5)
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp, signOut, getUser } from "../auth.js";
import { mergeCloudProgress } from "../cloudSync.js";
import { GraduationCap, LogOut, Cloud, CheckCircle } from "lucide-react";

function FormField({ label, type, value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-ivory/50 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/15 text-ivory text-sm
          placeholder:text-ivory/25 focus:outline-none focus:border-gold/50 transition-colors"
      />
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        // Merge cloud progress into localStorage
        await mergeCloudProgress();
        setSuccess("Signed in! Progress synced.");
        setTimeout(() => navigate("/academy"), 1200);
      } else {
        const data = await signUp(email, password);
        if (data.user && !data.session) {
          setSuccess("Account created! Check your email to confirm, then sign in.");
        } else {
          await mergeCloudProgress();
          setSuccess("Account created and signed in!");
          setTimeout(() => navigate("/academy"), 1200);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/academy");
  }

  // ── Already signed in ────────────────────────────────────────────────────
  if (user) {
    return (
      <div className="max-w-md mx-auto pb-16">
        <div className="rounded-2xl bg-navy-800/60 border border-gold/20 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-gold" />
          </div>
          <h1 className="text-xl font-bold text-ivory mb-2">Signed In</h1>
          <p className="text-ivory/50 text-sm mb-1">{user.email}</p>
          <div className="flex items-center justify-center gap-2 text-green-400 text-sm mb-6">
            <CheckCircle size={14} />
            Progress syncing to cloud
          </div>

          <div className="rounded-lg bg-white/5 border border-white/10 p-4 text-left mb-6">
            <div className="text-xs text-ivory/40 uppercase tracking-widest mb-3">
              Cloud Sync Benefits
            </div>
            <ul className="space-y-2 text-sm text-ivory/60">
              <li className="flex gap-2"><span className="text-gold">✓</span> Progress backed up across devices</li>
              <li className="flex gap-2"><span className="text-gold">✓</span> Spaced repetition queue persisted</li>
              <li className="flex gap-2"><span className="text-gold">✓</span> AI tutor conversation history saved</li>
              <li className="flex gap-2"><span className="text-gold">✓</span> Notes per thesis section (Phase 5)</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/academy")}
              className="flex-1 py-3 rounded-xl bg-gold/20 hover:bg-gold/30 border border-gold/30 text-gold font-semibold transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-ivory/60 transition-all text-sm"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign in / Sign up form ────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto pb-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
          <Cloud size={28} className="text-gold" />
        </div>
        <h1 className="text-2xl font-bold text-ivory mb-2">Cloud Sync</h1>
        <p className="text-ivory/50 text-sm">
          Optional — sign in to sync progress across devices and unlock the AI tutor.
          All academy content is free without an account.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
        {[["signin", "Sign In"], ["signup", "Create Account"]].map(([m, label]) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m
                ? "bg-gold/20 text-gold"
                : "text-ivory/40 hover:text-ivory/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-navy-800/60 border border-white/10 p-6">
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.edu"
        />
        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
        />

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-terracotta/15 border border-terracotta/30 text-terracotta text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-3 rounded-xl bg-gold text-navy font-semibold text-sm
            disabled:opacity-30 hover:bg-gold/90 transition-all"
        >
          {loading ? "…" : mode === "signin" ? "Sign In & Sync" : "Create Account"}
        </button>

        <p className="text-center text-xs text-ivory/30 mt-4">
          Your learning data is stored only in your Supabase account, protected by Row-Level Security.
          No tracking, no sharing.
        </p>
      </form>

      <button
        onClick={() => navigate("/academy")}
        className="w-full mt-4 text-sm text-ivory/40 hover:text-ivory/70 transition-colors"
      >
        ← Continue without account
      </button>
    </div>
  );
}
