/**
 * First 90 — Thesis Tracker v3
 * ================================
 * Rebuilt August 20 2026 with Amen's real Fall 2026 schedule.
 *
 * SCHEDULE (from fall_schedule_overview.png):
 *   Mon  — no dedicated thesis slot (Class + Teaching day)
 *   Tue  — 9am–1pm Thesis deep work (4 hrs)
 *   Wed  — no dedicated thesis slot (Class + Teaching day)
 *   Thu  — 10am–2pm Thesis deep work (4 hrs, before Impact Fellowship)
 *   Fri  — Grading + Projects day, light thesis possible
 *   Sat  — 1pm–4pm Thesis (3 hrs)
 *   Sun  — Church + Clean morning, then Review + Family afternoon
 *           Spark evening — NO thesis (rest day)
 *
 *   Weekly thesis hours: ~11 guaranteed
 *   Weeks to defense (Nov 15): 13
 *   Total thesis hours available: ~143
 *
 * DEPLOY:
 *   1. Replace SUPABASE_URL + SUPABASE_ANON_KEY below
 *   2. Run: create table thesis_state (key text primary key, value jsonb);
 *   3. npm install && npm run build
 *   4. Push to GitHub → Netlify auto-deploys
 *   5. Add VAPID keys in Netlify env vars for push notifications
 *      Generate with: npx web-push generate-vapid-keys
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, BookOpen, Calendar, CheckCircle2, Circle, ChevronDown, ChevronRight,
  Clock, Flame, Shield, Database, BarChart2, GraduationCap, Heart, HelpCircle,
  Settings, Bell, BellOff, Download, RefreshCcw, Plus, Trash2, Copy, Check,
  Play, Pause, RotateCcw, Sparkles, BookMarked, PenTool, Smartphone, Star,
  AlertCircle, Edit3, Target, Save, ChevronLeft, Zap, ClipboardList,
} from "lucide-react";

/* ─── DESIGN TOKENS ──────────────────────────────────────────────────── */
const T = {
  bg: "var(--bg)", bgDeep: "var(--bg-deep)", surface: "var(--surface)",
  surface2: "var(--surface2)", chalk: "var(--text)", chalkDim: "var(--text-dim)",
  chalkFaint: "var(--border)", amber: "var(--primary)", amberDim: "var(--primary-dim)",
  coral: "var(--danger)", coralDim: "var(--danger-dim)", blue: "var(--info)",
  blueDim: "var(--info-dim)",
};
const LIGHT = {
  "--bg":"#f7f5ef","--bg-deep":"#eef2ec","--surface":"#ffffff","--surface2":"#eef2ec",
  "--text":"#1c2a22","--text-dim":"#5a6f62","--border":"#dde3da",
  "--primary":"#2f6b4f","--primary-dim":"rgba(47,107,79,0.12)",
  "--danger":"#b3503d","--danger-dim":"rgba(179,80,61,0.12)",
  "--info":"#3d7a8a","--info-dim":"rgba(61,122,138,0.12)","--on-primary":"#f6fbf7",
};
const DARK = {
  "--bg":"#122019","--bg-deep":"#0c1712","--surface":"#1a2b22","--surface2":"#22392c",
  "--text":"#eef3ee","--text-dim":"#9fb5a6","--border":"rgba(238,243,238,0.14)",
  "--primary":"#5fae82","--primary-dim":"rgba(95,174,130,0.16)",
  "--danger":"#dd8a72","--danger-dim":"rgba(221,138,114,0.16)",
  "--info":"#7fb8c9","--info-dim":"rgba(127,184,201,0.16)","--on-primary":"#0e1f16",
};

/* ─── SUPABASE ───────────────────────────────────────────────────────── */
const SB_URL = "YOUR_SUPABASE_URL";
const SB_KEY = "YOUR_SUPABASE_ANON_KEY";
const SBH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function sbLoad(key, fallback) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/thesis_state?key=eq.${encodeURIComponent(key)}&select=value`, { headers: SBH });
    const d = await r.json();
    return d?.[0]?.value ?? fallback;
  } catch {
    try { const v = localStorage.getItem(`ts-${key}`); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }
}
async function sbSave(key, value) {
  try {
    await fetch(`${SB_URL}/rest/v1/thesis_state`, {
      method: "POST", headers: { ...SBH, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ key, value }),
    });
  } catch { try { localStorage.setItem(`ts-${key}`, JSON.stringify(value)); } catch {} }
}

/* ─── CONSTANTS ─────────────────────────────────────────────────────── */
const DEFENSE_DATE = "2026-11-15";
const TODAY = () => new Date().toISOString().slice(0, 10);
const DAYS_UNTIL = (d) => Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000));
const WEEKS_LEFT = () => Math.ceil(DAYS_UNTIL(DEFENSE_DATE) / 7);

/* ─── FALL 2026 SCHEDULE — thesis slots only ─────────────────────────
   Based on fall_schedule_overview.png uploaded by Amen.
   0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
   Mon: Class + Teaching — no thesis block
   Tue: 9am-1pm thesis deep work — PRIMARY (4 hrs)
   Wed: Class + Teaching — no thesis block
   Thu: 10am-2pm thesis deep work — PRIMARY (4 hrs)
   Fri: Grading + Projects — opportunistic, 1 hr possible
   Sat: 1pm-4pm thesis — SECONDARY (3 hrs)
   Sun: Rest/Church/Spark — no thesis
──────────────────────────────────────────────────────────────────── */
const SCHEDULE = {
  1: null,   // Monday — no thesis slot
  2: { label: "Tue 9am–1pm", hours: 4, slot: "9:00 AM – 1:00 PM", type: "deep" },
  3: null,   // Wednesday — no thesis slot
  4: { label: "Thu 10am–2pm", hours: 4, slot: "10:00 AM – 2:00 PM", type: "deep" },
  5: { label: "Fri grading day", hours: 1, slot: "Opportunistic — 1 hr if possible", type: "light" },
  6: { label: "Sat 1pm–4pm", hours: 3, slot: "1:00 PM – 4:00 PM", type: "work" },
  0: null,   // Sunday — rest
};

/* ─── CHAPTER STRUCTURE ─────────────────────────────────────────────── */
const CHAPTERS = [
  { id:"front", label:"Front Matter", icon:BookMarked, sections:[
    {id:"title",label:"Title page"},
    {id:"decl",label:"Declaration"},
    {id:"cert",label:"Certification"},
    {id:"ded",label:"Dedication"},
    {id:"ack",label:"Acknowledgements"},
    {id:"toc",label:"Table of contents — generate LAST in Word"},
    {id:"abs",label:"Abstract"},
  ]},
  { id:"ch1", label:"Chapter 1 — Introduction", icon:BookOpen, done:true, sections:[
    {id:"ch1-1",label:"1.1 Background ✓"},
    {id:"ch1-2",label:"1.2 Statement of the problem ✓"},
    {id:"ch1-3",label:"1.3 Research questions ✓"},
    {id:"ch1-4",label:"1.4 Hypotheses ✓"},
    {id:"ch1-5",label:"1.5 Significance ✓"},
    {id:"ch1-6",label:"1.6 Scope and limitations ✓"},
    {id:"ch1-7",label:"1.7 Definition of key terms ✓"},
  ]},
  { id:"ch2", label:"Chapter 2 — Literature Review", icon:BookOpen, sections:[
    {id:"ch2-1",label:"2.1 Introduction"},
    {id:"ch2-2",label:"2.2 Mental health among international students (Hyun 2007, Yeh 2003)"},
    {id:"ch2-3",label:"2.3 Acculturative stress and the ASSIS (Sandhu 1994)"},
    {id:"ch2-4",label:"2.4 Loneliness, isolation, social support (Russell 1996)"},
    {id:"ch2-5",label:"2.5 Financial stress and academic outcomes"},
    {id:"ch2-6",label:"2.6 Faith, spirituality, and protective factors"},
    {id:"ch2-7",label:"2.7 Statistical methods in mental health research"},
    {id:"ch2-8",label:"2.8 LASSO regularization (Tibshirani 1996)"},
  ]},
  { id:"ch3", label:"Chapter 3 — Methodology", icon:Database, sections:[
    {id:"ch3-1",label:"3.1 Study design"},
    {id:"ch3-2",label:"3.2 Participants and sampling"},
    {id:"ch3-3",label:"3.3 Data collection"},
    {id:"ch3-4",label:"3.4 Measures"},
    {id:"ch3-5",label:"3.5 Statistical analysis plan"},
    {id:"ch3-6",label:"3.6 Ethical considerations"},
  ]},
  { id:"ch4", label:"Chapter 4 — Results", icon:BarChart2, sections:[
    {id:"ch4-1",label:"4.1 Introduction"},
    {id:"ch4-2",label:"4.2 Descriptive statistics"},
    {id:"ch4-3",label:"4.3 Logistic regression results"},
    {id:"ch4-4",label:"4.4 LASSO variable selection"},
    {id:"ch4-5",label:"4.5 Composite risk index and ROC analysis"},
    {id:"ch4-6",label:"4.6 Summary"},
  ]},
  { id:"ch5", label:"Chapter 5 — Discussion", icon:PenTool, sections:[
    {id:"ch5-1",label:"5.1 Introduction"},
    {id:"ch5-2",label:"5.2 Discussion of findings — H1 through H4"},
    {id:"ch5-3",label:"5.3 Limitations"},
    {id:"ch5-4",label:"5.4 Future research directions"},
    {id:"ch5-5",label:"5.5 Conclusion"},
  ]},
  { id:"back", label:"Back Matter", icon:BookOpen, sections:[
    {id:"refs",label:"References — 7 APA citations"},
    {id:"app1",label:"Applied output: First 90 app"},
  ]},
];

/* ─── IRB CHECKLIST ─────────────────────────────────────────────────── */
const IRB = [
  { id:"pre", phase:"Before you apply", tasks:[
    {id:"irb-citi-sbr",label:"Complete CITI Social-Behavioral-Educational Researchers course",note:"~3 hrs via MSU CITI portal"},
    {id:"irb-citi-ferpa",label:"Complete CITI FERPA for Researchers"},
    {id:"irb-citi-sec",label:"Complete CITI Research Security Basic Training"},
    {id:"irb-citi-cert",label:"Download all CITI certificates as PDF"},
    {id:"irb-survey",label:"Finalize all 30 survey questions"},
    {id:"irb-consent",label:"Draft informed consent statement (MSU IRB template)"},
    {id:"irb-email",label:"Email Dr. Zheng requesting faculty supervisor signature"},
  ]},
  { id:"cayuse", phase:"Cayuse application — msu.app.cayuse.com", tasks:[
    {id:"irb-login",label:"Log in to Cayuse with MSU credentials"},
    {id:"irb-new",label:"Create new protocol — Expedited Review (anonymous survey)"},
    {id:"irb-fwa",label:"Enter FWA number: 00004733"},
    {id:"irb-desc",label:"Write study description"},
    {id:"irb-recr",label:"Write recruitment section (DSO, fellowship, associations, QR flyers)"},
    {id:"irb-data",label:"Write data collection section"},
    {id:"irb-storage",label:"Write data storage section (MSU OneDrive, password-protected)"},
    {id:"irb-risk",label:"Write risk and benefit assessment"},
    {id:"irb-vuln",label:"Write vulnerable populations section"},
    {id:"irb-distress",label:"Add distress protocol (PHQ-2 ≥ 3 → MSU Counseling + 988)"},
    {id:"irb-att1",label:"Attach survey instrument — all 30 questions"},
    {id:"irb-att2",label:"Attach informed consent statement"},
    {id:"irb-att3",label:"Attach all CITI certificates"},
  ]},
  { id:"submit", phase:"Submission", tasks:[
    {id:"irb-review",label:"Send to Dr. Zheng for review"},
    {id:"irb-sig",label:"Dr. Zheng co-signs in Cayuse"},
    {id:"irb-submit",label:"Submit through Cayuse"},
    {id:"irb-approve",label:"Receive written IRB approval — DO NOT collect data before this"},
  ]},
];

/* ─── WEEKLY TASK PLAN ───────────────────────────────────────────────
   Built around Amen's real schedule. Each entry maps to a specific
   calendar date and the thesis topic appropriate for that week.
   Starting August 20 2026 (today, Thursday).
──────────────────────────────────────────────────────────────────── */
function buildTaskPlan() {
  // ── ADVISOR MEETINGS — once per month, always on a Thursday ─────────
  // Scheduled on the first Thursday of each month where there is thesis work.
  // Prepare an agenda the Tuesday before each meeting.
  // Sep 3 Thu → meeting + agenda prep Aug 1 Tue
  // Oct 1 Thu → meeting + agenda prep Sep 29 Tue
  // Nov 5 Thu → meeting + agenda prep Nov 3 Tue

  const plan = [
    // ── WEEK 1: Aug 20–22 (today is Thursday) ──────────────────────
    // CITI courses are the single most urgent thing — IRB cannot start without them.
    { date:"2026-08-20", dow:4, task:"IRB: Complete CITI Social-Behavioral-Educational Researchers course online (~3 hrs). Log in via MSU portal → CITI program. Use today's 10am–2pm block.", phase:"IRB", urgent:true },
    { date:"2026-08-22", dow:6, task:"IRB: Complete CITI FERPA for Researchers + Research Security Basic Training. Download and save all 3 certificates as PDF. Saturday 1–4pm.", phase:"IRB", urgent:true },

    // ── WEEK 2: Aug 25–29 ───────────────────────────────────────────
    // Research funding application starts this week alongside Chapter 2 writing.
    { date:"2026-08-26", dow:2, task:"Chapter 2: Write Section 2.1 Introduction + 2.2 Mental health among international students (Hyun et al. 2007 — 44% stat; Yeh & Inose 2003). Tuesday 9am–1pm.", phase:"Writing" },
    { date:"2026-08-27", dow:4, task:"Funding: Email Dr. Zheng TODAY requesting a letter of support for the MSU Thesis Research Funding application (~$500). Deadline is September 1 — 5 days away. Also write Chapter 2 Section 2.3 Acculturative stress. Thursday 10am–2pm.", phase:"Funding", urgent:true },
    { date:"2026-08-29", dow:6, task:"Funding: Compile ONE PDF — application form + budget + timeline + CITI certificates. Email to Graduate College before September 1. Also draft IRB informed consent and begin Cayuse application. Saturday 1–4pm.", phase:"Funding", urgent:true },

    // ── WEEK 3: Sep 1–5 ─────────────────────────────────────────────
    { date:"2026-09-01", dow:2, task:"Chapter 2: Write Section 2.4 Loneliness and social support (Russell 1996) + Section 2.5 Financial stress and academic outcomes. Tuesday 9am–1pm.", phase:"Writing" },
    { date:"2026-09-03", dow:4, task:"📅 ADVISOR MEETING — Dr. Zheng. Bring: Chapter 1 printed, Chapter 2 draft progress, IRB application status, funding plans, timeline to defense. Thursday 10am.", phase:"Advisor", milestone:true },
    { date:"2026-09-05", dow:6, task:"IRB: Complete Cayuse application — data storage, risk assessment, vulnerable populations section, distress protocol (PHQ-2 ≥ 3 → MSU Counseling + 988). Attach all documents. Saturday 1–4pm.", phase:"IRB" },

    // ── WEEK 4: Sep 8–12 ────────────────────────────────────────────
    { date:"2026-09-08", dow:2, task:"Chapter 2: Write Section 2.6 Faith and spirituality as protective factor + Section 2.7 Statistical methods. Tuesday 9am–1pm.", phase:"Writing" },
    { date:"2026-09-10", dow:4, task:"Funding: Draft research funding application — study rationale, research design summary, budget justification, expected outcomes. Thursday 10am–2pm.", phase:"Funding" },
    { date:"2026-09-12", dow:6, task:"Chapter 2: Write Section 2.8 LASSO regularization (Tibshirani 1996). Chapter 2 complete. Also send Cayuse IRB application to Dr. Zheng for co-signature. Saturday 1–4pm.", phase:"Writing" },

    // ── WEEK 5: Sep 15–19 ───────────────────────────────────────────
    { date:"2026-09-15", dow:2, task:"Chapter 3: Write Sections 3.1 Study design + 3.2 Participants and sampling (EPV rule — 13 predictors × 10 events/predictor ÷ 0.30 prevalence ÷ 0.75 retention = ~578 target). Tuesday 9am–1pm.", phase:"Writing" },
    { date:"2026-09-17", dow:4, task:"IRB: Submit through Cayuse after Dr. Zheng co-signs. Confirm submission received. Set up R environment — install tidyverse, glmnet, pROC, psych, car. Thursday 10am–2pm.", phase:"IRB" },
    { date:"2026-09-19", dow:6, task:"Funding: Finalize and submit research funding application. Keep a copy. Log submission date in the app. Saturday 1–4pm.", phase:"Funding" },

    // ── WEEK 6: Sep 22–26 ───────────────────────────────────────────
    { date:"2026-09-22", dow:2, task:"Chapter 3: Write Sections 3.3 Data collection + 3.4 Measures (PHQ-2, GAD-2, UCLA, ASSIS, Financial Stress — all 5 validated scales + 10 original items + Q22 reverse scoring). Tuesday 9am–1pm.", phase:"Writing" },
    { date:"2026-09-24", dow:4, task:"Chapter 3: Write Sections 3.5 Statistical analysis plan (5-step plan, all R packages named) + 3.6 Ethical considerations. Chapter 3 complete. Thursday 10am–2pm.", phase:"Writing" },
    { date:"2026-09-26", dow:6, task:"Deploy survey (Google Forms or Qualtrics). Share at Impact Fellowship — personal ask. IRB approval must be in hand before this step. Saturday 1–4pm.", phase:"Data" },

    // ── WEEK 7: Sep 29 – Oct 3 ──────────────────────────────────────
    { date:"2026-09-29", dow:2, task:"📋 Prepare advisor meeting agenda for Oct 1: Chapter 2 + 3 complete, IRB submitted/approved status, survey deployed and response count, funding application submitted. Tuesday 9am–1pm.", phase:"Advisor" },
    { date:"2026-10-01", dow:4, task:"📅 ADVISOR MEETING — Dr. Zheng. Bring: Chapter 2 + 3 drafts, IRB approval copy (or status), survey response count, funding confirmation. Thursday 10am.", phase:"Advisor", milestone:true },
    { date:"2026-10-03", dow:6, task:"Survey recruitment: DSO office email blast + international student associations + WhatsApp groups + QR code flyers on campus. Saturday 1–4pm.", phase:"Data" },

    // ── WEEK 8: Oct 6–10 ────────────────────────────────────────────
    { date:"2026-10-06", dow:2, task:"Survey: second round reminders to all channels. Reach out to Missouri S&T + UMKC DSO offices for partner recruitment. Tuesday 9am–1pm.", phase:"Data" },
    { date:"2026-10-08", dow:4, task:"Survey: check response count — if ≥ 300, plan closing date for Oct 10. If < 200, intensify outreach immediately. Thursday 10am–2pm.", phase:"Data" },
    { date:"2026-10-10", dow:6, task:"Close survey. Export CSV. Run data check — completeness, duplicates, out-of-range values. Count final responses and log in app. Saturday 1–4pm.", phase:"Analysis" },

    // ── WEEK 9: Oct 13–17 ───────────────────────────────────────────
    { date:"2026-10-13", dow:2, task:"R Step 1–2: Load data, clean variables, score all scales — PHQ-2, GAD-2, UCLA, ASSIS, Financial Stress. Reverse-score Q22. Confirm at_risk distribution. Tuesday 9am–1pm.", phase:"Analysis" },
    { date:"2026-10-15", dow:4, task:"R Step 3–4: Descriptive stats + bivariate correlations. Then binary logistic regression — PHQ-2 ≥ 3 as outcome. Odds ratios + CIs + VIF check. Thursday 10am–2pm.", phase:"Analysis" },
    { date:"2026-10-17", dow:6, task:"R Step 5: LASSO with glmnet — 10-fold CV, optimal lambda, which predictors survive. Plot LASSO path. Saturday 1–4pm.", phase:"Analysis" },

    // ── WEEK 10: Oct 20–24 ──────────────────────────────────────────
    { date:"2026-10-20", dow:2, task:"R Step 6: Composite risk index + ROC analysis. 70/30 train/holdout split. Compute AUC — target ≥ 0.75 (H4). Plot ROC curve. Enter AUC in app tracker. Tuesday 9am–1pm.", phase:"Analysis" },
    { date:"2026-10-22", dow:4, task:"Create all Chapter 4 tables and figures: Table 1 demographics, Table 2 descriptives, Table 3 regression, LASSO path plot, ROC curve figure. Thursday 10am–2pm.", phase:"Analysis" },
    { date:"2026-10-24", dow:6, task:"Chapter 4: Write Sections 4.1 Introduction + 4.2 Descriptive statistics + 4.3 Logistic regression results. Saturday 1–4pm.", phase:"Writing" },

    // ── WEEK 11: Oct 27–31 ──────────────────────────────────────────
    { date:"2026-10-27", dow:2, task:"Chapter 4: Write Sections 4.4 LASSO variable selection + 4.5 Composite risk index and ROC analysis + 4.6 Summary. Chapter 4 complete. Tuesday 9am–1pm.", phase:"Writing" },
    { date:"2026-10-29", dow:4, task:"Chapter 5: Write Sections 5.1 Introduction + 5.2 Discussion of findings — address all 4 hypotheses, discuss visa anxiety finding and faith as protective factor. Thursday 10am–2pm.", phase:"Writing" },
    { date:"2026-10-31", dow:6, task:"Chapter 5: Write Sections 5.3 Limitations (7 numbered from Ch1) + 5.4 Future research + 5.5 Conclusion. Complete references in APA format. Chapter 5 done. Saturday 1–4pm.", phase:"Writing" },

    // ── WEEK 12: Nov 3–7 ────────────────────────────────────────────
    { date:"2026-11-03", dow:2, task:"📋 Prepare final advisor meeting agenda: full thesis draft attached, defense date confirmed, committee confirmed. Compile full thesis document — all chapters in one Word file. Check formatting. Tuesday 9am–1pm.", phase:"Advisor" },
    { date:"2026-11-05", dow:4, task:"📅 ADVISOR MEETING — Dr. Zheng. Final check before defense. Bring complete thesis draft. Confirm committee, defense date, room booking. Thursday 10am.", phase:"Advisor", milestone:true },
    { date:"2026-11-07", dow:6, task:"Full thesis read-through. Address all gaps from advisor feedback. Final proofread — grammar, APA citations, page numbers. Export PDF. Saturday 1–4pm.", phase:"Polish" },

    // ── WEEK 13: Nov 10–15 (defense week) ───────────────────────────
    { date:"2026-11-10", dow:2, task:"Build defense presentation: all 15 slides. Title, intro, methods, results (tables + ROC curve), discussion (H1–H4), First 90 app applied output, conclusion, references. Tuesday 9am–1pm.", phase:"Defense" },
    { date:"2026-11-12", dow:4, task:"Full defense run-through — time yourself, target 20–25 min. Draft answers to all 10 committee questions. Send slides to Dr. Zheng for a final look. Thursday 10am–2pm.", phase:"Defense" },
    { date:"2026-11-14", dow:6, task:"Rest. Pray. Review your notes gently. You have done the work. Trust what God has built in you.", phase:"Defense" },
    { date:"2026-11-15", dow:0, task:"🎓 DEFENSE DAY — You are ready. God has brought you this far.", phase:"Defense", milestone:true },
  ];

  return plan.map((t, i) => ({ ...t, id: `task-${i}`, done: false }));
}

/* ─── TASK GUIDES ────────────────────────────────────────────────────────
   Step-by-step implementation guide for every task in the plan.
   Keyed by task id (task-0 through task-37).
──────────────────────────────────────────────────────────────────────── */
const TASK_GUIDES = {
  "task-0": {
    title:"Complete CITI Social-Behavioral-Educational Researchers course",
    why:"You cannot submit an IRB application or apply for the $500 MSU thesis research funding without this certificate. It is the single gate blocking both. Do this today.",
    timeEstimate:"3–4 hours",
    steps:[
      {step:"Go to citiprogram.org and log in using your MSU credentials (SSO). If you have never logged in before, select Register and affiliate with Missouri State University."},
      {step:"Once logged in, click Add a Course. Under Social and Behavioral Research, select the Social-Behavioral-Educational (SBE) Researchers course — NOT the refresher, the full basic course."},
      {step:"Work through all modules in order. Do not skip any. Each module ends with a short quiz. You need at least 80% on each quiz to pass."},
      {step:"The modules cover: research ethics basics, informed consent, confidentiality, research with vulnerable populations, internet-based research, and research misconduct. Take notes — this content directly informs your Chapter 3 ethics section."},
      {step:"When you complete all modules, click View/Print Completion Report and save it as a PDF named: CITI_SBE_Amen_Engworo_Edoha.pdf"},
      {step:"Email the certificate PDF to yourself as a backup. You will attach this to both the IRB application and the funding application."},
    ],
    tips:["Work through this in your 10am–2pm Thursday block today. Put your phone on Do Not Disturb.","Your quiz scores do not affect your certificate — only passing (≥80%) matters."],
    resources:["citiprogram.org","MSU IRB: irb@missouristate.edu · 417-836-3737"],
  },
  "task-1": {
    title:"Complete CITI FERPA + Research Security courses and download all certificates",
    why:"These two shorter courses complete your required compliance training. You need all 3 CITI certificates attached to both the IRB application and the MSU funding application due September 1.",
    timeEstimate:"2–3 hours total",
    steps:[
      {step:"Log back into citiprogram.org with your MSU credentials."},
      {step:"Add the FERPA for Researchers course. Complete all modules and save the completion certificate as: CITI_FERPA_Amen_Engworo_Edoha.pdf"},
      {step:"Add the Research Security Basic Training course. Complete all modules and save as: CITI_ResearchSecurity_Amen_Engworo_Edoha.pdf"},
      {step:"Confirm you now have 3 PDF certificates: SBE (from Thursday), FERPA, and Research Security."},
      {step:"Create a folder on your MSU OneDrive called Thesis IRB Documents and put all 3 certificates there."},
    ],
    tips:["FERPA takes about 45 minutes. Research Security takes about 30 minutes. Do both in your Saturday 1–4pm block."],
    resources:["citiprogram.org","MSU OneDrive: onedrive.missouristate.edu"],
  },
  "task-2": {
    title:"Write Chapter 2 Sections 2.1 and 2.2",
    why:"Chapter 2 is the backbone of your argument. Section 2.2 houses your strongest citation — Hyun et al. 2007 with the 44% statistic that anchors H1.",
    timeEstimate:"4 hours (full Tuesday block)",
    steps:[
      {step:"Open your thesis Word document. Under Chapter 2 heading, create subheadings: 2.1 Introduction, 2.2 Mental Health Among International Students."},
      {step:"Write 2.1 Introduction (2–3 paragraphs): what this chapter reviews, the topic areas covered, and how the literature connects to your 4 hypotheses."},
      {step:"Write 2.2 Mental Health Among International Students (4–5 paragraphs). Start with the 1,126,690 IIE 2024 statistic. Then cite Hyun et al. 2007: 44% of international students reported significant levels of personal problems requiring professional mental health services."},
      {step:"Also cite Yeh and Inose 2003 on acculturative stress and social connectedness as predictors of distress. Discuss the service utilization gap."},
      {step:"End 2.2 by connecting to your study: The present study builds on these findings by developing a composite risk index capable of identifying students at elevated risk before distress becomes a crisis."},
      {step:"Read both sections aloud. If it sounds like AI wrote it, rewrite it in your own voice. No em dashes."},
    ],
    tips:["Write in past tense for cited studies and present tense for enduring facts.","Aim for 600–800 words total for both sections."],
    resources:["Hyun, J., Quinn, B., Madon, T., & Lustig, S. (2007). Mental health need, awareness, and use of counseling services among international graduate students. Journal of American College Health, 56(2), 109–118.","Yeh, C. J., & Inose, M. (2003). International students reported English fluency, social support satisfaction, and social connectedness as predictors of acculturative stress. Counselling Psychology Quarterly, 16(1), 15–28."],
  },
  "task-3": {
    title:"Email Dr. Zheng for funding letter of support + write Chapter 2 Section 2.3",
    why:"The MSU Thesis Research Funding deadline is September 1 — only 5 days away. Dr. Zheng needs at least a week to write a letter. Email him first, then write.",
    timeEstimate:"30 min email · 2.5 hrs writing",
    steps:[
      {step:"FIRST — send this email to Dr. Zheng (SongfengZheng@missouristate.edu): Subject: Request for Letter of Support — MSU Thesis Research Funding (Deadline Sept 1). Dear Dr. Zheng, I am writing to request a brief letter of support for the MSU Graduate College Thesis Research Funding application (~$500). The fall deadline is September 1. Would you be able to provide a short letter by August 28? I am happy to draft talking points. Thank you. Amen Engworo Edoha M03617692"},
      {step:"Download the funding application Word template from graduate.missouristate.edu. Search Thesis Research Funding."},
      {step:"Write Section 2.3 Acculturative Stress and the ASSIS (3–4 paragraphs). Define acculturative stress. Introduce the ASSIS — Acculturative Stress Inventory for International Students (Sandhu & Asrabadi, 1994). Name the 6 subscales."},
      {step:"Explain why you use a 6-item short form: survey burden and EPV constraints with 13 predictors."},
      {step:"Connect to H1: acculturative stress will be among the three strongest predictors."},
    ],
    tips:["Send the email within the first 15 minutes of your session. Do not delay it."],
    resources:["SongfengZheng@missouristate.edu","Sandhu, D. S., & Asrabadi, B. R. (1994). Development of an acculturative stress scale for international students. Psychological Reports, 75(1), 435–448."],
  },
  "task-4": {
    title:"Compile funding PDF + submit before Sept 1 + begin IRB informed consent",
    why:"This is the last day before the September 1 deadline. Email the complete PDF today.",
    timeEstimate:"3 hours",
    steps:[
      {step:"Fill in the funding application: full name (Amen Engworo Edoha), student ID (M03617692), department (Mathematics), advisor (Dr. Songfeng Zheng), thesis title."},
      {step:"Write the Research Goals section (1 paragraph): cross-sectional survey, PHQ-2 outcome, logistic regression + LASSO, composite risk index, First 90 app."},
      {step:"Write the Budget section: survey platform, printing for flyers and consent forms, any participant incentives. Total requested: up to $500."},
      {step:"Write the Timeline: IRB Sep, survey Sep, data collection Sep–Oct, analysis Oct, writing Oct–Nov, defense Nov 15."},
      {step:"Merge into ONE PDF: application + Dr. Zheng letter (if received) + all 3 CITI certificates. Use ilovepdf.com if needed."},
      {step:"Email the single PDF to the Graduate College before September 1. Subject: Thesis Research Funding Application — Amen Engworo Edoha — Fall 2026. CC yourself."},
      {step:"Start the IRB informed consent draft — 150–200 words covering: study purpose, voluntary participation, anonymity, no academic or immigration consequences, researcher contact info."},
    ],
    tips:["ilovepdf.com is free and merges PDFs in seconds.","If Dr. Zheng letter has not arrived, include a note that it will follow and send a reminder email."],
    resources:["ilovepdf.com","graduate.missouristate.edu","irb@missouristate.edu"],
  },
  "task-5": {
    title:"Write Chapter 2 Sections 2.4 and 2.5 — Loneliness and financial stress",
    why:"The UCLA Loneliness Scale (Russell 1996) and financial stress items feed directly into your predictor set.",
    timeEstimate:"4 hours (full Tuesday block)",
    steps:[
      {step:"Write Section 2.4 Loneliness (3–4 paragraphs). Open with the distinction between structural isolation and emotional loneliness. Introduce the UCLA Loneliness Scale (Russell, 1996) — full 20-item scale, you use a validated 2-item short form."},
      {step:"Connect to your study: UCLA loneliness scores are treated as a predictor rather than an outcome variable."},
      {step:"Write Section 2.5 Financial Stress (2–3 paragraphs). Describe the unique financial pressures: tuition 2–3× domestic rates, 20hr/week F-1 work restriction, banking access difficulties in the first 90 days."},
      {step:"Describe the feedback loop: financial stress → anxiety → reduced academic performance → increased financial stress."},
      {step:"Connect to your 3-item financial stress subscale."},
    ],
    tips:["Russell, D. W. (1996). UCLA Loneliness Scale (Version 3): Reliability, validity, and factor structure. Journal of Personality Assessment, 66(1), 20–40."],
    resources:["MSU library: library.missouristate.edu → PsycINFO, ERIC"],
  },
  "task-6": {
    title:"Advisor meeting — Dr. Zheng (September 3)",
    why:"Your first formal meeting since the thesis plan was finalized. Align on Chapter 2 progress, IRB status, defense date, and funding.",
    timeEstimate:"1 hour meeting",
    steps:[
      {step:"PREP (Tuesday before): Print Chapter 1 and whatever Chapter 2 sections you have. Write a one-page agenda: current status, IRB status, funding submitted, survey plan, defense November 15, questions for him."},
      {step:"Arrive on time Thursday 10am. Bring printed materials and your agenda."},
      {step:"Walk Dr. Zheng through: what is done, what is in progress, what is coming. Confirm November 15 defense date."},
      {step:"Ask: Does he approve the defense date? Does he need to review chapters before IRB submission? Has he received the funding letter request?"},
      {step:"Email Dr. Zheng a brief meeting summary within 24 hours."},
    ],
    tips:["Do not arrive to this meeting without printed materials.","If Dr. Zheng suggests changes to your research design, bring them back to Claude to assess the methodology impact."],
    resources:["SongfengZheng@missouristate.edu"],
  },
  "task-7": {
    title:"Complete Cayuse IRB application — data storage, risk, distress protocol",
    why:"The IRB application must be complete before you can deploy your survey.",
    timeEstimate:"3 hours (Saturday block)",
    steps:[
      {step:"Log into msu.app.cayuse.com with your MSU Bear Pass credentials."},
      {step:"Complete Data Storage: anonymous survey, no IP addresses, password-protected OneDrive folder, accessible only to PI and faculty supervisor."},
      {step:"Complete Risk and Benefit Assessment: minimal risk, anonymous, voluntary, no immigration consequences."},
      {step:"Complete Vulnerable Populations: F-1 and J-1 students, fully voluntary, no effect on immigration status or academic standing."},
      {step:"Add distress protocol: if PHQ-2 score ≥ 3, survey displays message directing to MSU Counseling Services (417) 836-5116 and 988 Lifeline."},
      {step:"Attach: informed consent statement, full 30-question survey, all 3 CITI certificates. Submit to Dr. Zheng for co-signature. Email him the Cayuse link."},
    ],
    tips:["Call IRB at 417-836-3737 if stuck on any section — this is their job.","The distress protocol is not optional for a PHQ-2 study."],
    resources:["msu.app.cayuse.com","irb@missouristate.edu · 417-836-3737","FWA: 00004733"],
  },
  "task-8": {
    title:"Write Chapter 2 Sections 2.6 and 2.7 — Faith and statistical methods",
    why:"Section 2.6 supports H2 (faith as protective factor). Section 2.7 justifies logistic regression over alternatives.",
    timeEstimate:"4 hours (Tuesday block)",
    steps:[
      {step:"Write Section 2.6 Faith, Spirituality, and Protective Factors (3 paragraphs). Establish faith community involvement as associated with lower depression and anxiety. Connect to international students — for many, faith community is the primary social network in a new country."},
      {step:"Explain your operationalization: Q21 (faith disruption) and Q22r (reverse-scored protective factor). State H2."},
      {step:"Write Section 2.7 Statistical Methods (3–4 paragraphs). Justify binary logistic regression: binary outcome variable, no normality assumption, interpretable odds ratios. Explain why OLS regression is inappropriate for binary outcomes."},
      {step:"Introduce LASSO as the variable selection method. End: logistic regression and LASSO provide a robust framework for identifying the strongest predictors."},
    ],
    tips:["For faith literature, general religion and mental health literature is acceptable if international student-specific studies are unavailable."],
    resources:["Koenig, H. G. (2012). Religion, spirituality, and health. ISRN Psychiatry."],
  },
  "task-9": {
    title:"Research funding application — strengthen for spring or departmental funds",
    why:"September 1 fall deadline has passed. Use this session to either submit late or prepare a stronger spring application.",
    timeEstimate:"4 hours (Thursday block)",
    steps:[
      {step:"If fall application was not submitted on time: attempt to submit now and email the Graduate College — some flexibility exists."},
      {step:"Email Dr. Bray (William.Bray@missouristate.edu) asking about department-level research funding for thesis students."},
      {step:"Strengthen the research rationale: 1,126,690 international students (IIE 2024), 44% mental health gap (Hyun 2007), absence of validated early-warning tools, dual output of statistical model plus First 90 app."},
      {step:"Refine budget: Qualtrics access (check MSU library), printing costs, any conference travel."},
    ],
    tips:["The spring deadline is February 1. A stronger application now sets you up for that cycle if needed."],
    resources:["graduate.missouristate.edu","William.Bray@missouristate.edu"],
  },
  "task-10": {
    title:"Write Chapter 2 Section 2.8 (LASSO) + complete Chapter 2 + send IRB to Dr. Zheng",
    why:"Section 2.8 is the technical anchor of your methodology. Chapter 2 completion is a major milestone.",
    timeEstimate:"3 hours writing + 1 hour IRB",
    steps:[
      {step:"Write Section 2.8 LASSO Regularization (4 paragraphs). Explain the problem LASSO solves: overfitting with 13 predictors and a limited sample."},
      {step:"Cite Tibshirani (1996). Explain the lambda penalty in plain language: higher lambda means more coefficients shrink to exactly zero — those predictors are dropped."},
      {step:"Explain your implementation: 10-fold cross-validation using glmnet in R, 70/30 train/holdout split, AUC to validate."},
      {step:"Write the Chapter 2 synthesis paragraph connecting to Chapter 3."},
      {step:"Send the Cayuse IRB application to Dr. Zheng for co-signature if not already done."},
    ],
    tips:["Tibshirani, R. (1996). Regression shrinkage and selection via the lasso. Journal of the Royal Statistical Society, 58(1), 267–288.","Friedman, J., Hastie, T., & Tibshirani, R. (2010). Regularization paths for generalized linear models via coordinate descent. Journal of Statistical Software, 33(1), 1–22."],
    resources:["R Guide tab in this app — Step 5 code for reference"],
  },
  "task-11": {
    title:"Write Chapter 3 Sections 3.1 and 3.2 — Study design and participants",
    why:"Chapter 3 contains your EPV calculation — the statistical basis for your target sample size. The committee will scrutinize this.",
    timeEstimate:"4 hours (Tuesday block)",
    steps:[
      {step:"Write Section 3.1 Study Design (2 paragraphs). State: cross-sectional survey design. Justify: appropriate for exploratory predictive modeling at a single time point. Acknowledge the causation limitation — already addressed in Chapter 1."},
      {step:"Write Section 3.2 Participants and Sampling (3–4 paragraphs). Who qualifies: all enrolled international students at MSU with F-1 or J-1 visas, undergraduate and graduate."},
      {step:"Write the EPV justification: EPV rule requires 10 outcome events per predictor. 13 predictors × 10 events = 130 distressed respondents needed. At 30% prevalence, 25% dropout: target approximately 578, minimum 450."},
      {step:"Describe sampling strategy: DSO email blasts, international student associations, Impact Fellowship, WhatsApp groups, QR code flyers, partner institutions (Missouri S&T, UMKC, Mizzou)."},
    ],
    tips:["Peduzzi, P., et al. (1996). A simulation study of the number of events per variable in logistic regression. Journal of Clinical Epidemiology, 49(12), 1373–1379."],
    resources:["Chapter 1 Section 1.6 for EPV constraint language to reference"],
  },
  "task-12": {
    title:"Submit IRB through Cayuse after Dr. Zheng co-signs + set up R environment",
    why:"IRB submission starts the 2–4 week expedited review clock. Every day of delay is a day less for data collection.",
    timeEstimate:"4 hours (Thursday block)",
    steps:[
      {step:"Check Cayuse — confirm Dr. Zheng has co-signed. If not, email him the Cayuse link with a polite reminder."},
      {step:"Review the complete application one final time: every section complete, all documents attached, distress protocol in place."},
      {step:"Click Submit. Save the submission confirmation with timestamp."},
      {step:"Email irb@missouristate.edu to confirm receipt and introduce your study."},
      {step:"Open RStudio. Run: install.packages(c('tidyverse','glmnet','pROC','psych','car'))"},
      {step:"Verify: library(tidyverse); library(glmnet); library(pROC) — no errors means you are ready. Create R project called thesis_analysis in your OneDrive folder."},
    ],
    tips:["Email the IRB office after submitting — you are not being annoying, you are being professional."],
    resources:["msu.app.cayuse.com","irb@missouristate.edu · 417-836-3737","r-project.org · posit.co (RStudio)"],
  },
  "task-13": {
    title:"Write Chapter 3 Sections 3.3 and 3.4 — Data collection and measures",
    why:"Section 3.4 describes every scale and must correctly cite all validated instruments.",
    timeEstimate:"4 hours (Tuesday block)",
    steps:[
      {step:"Write Section 3.3 Data Collection (2 paragraphs): online survey, 30 questions, 6–8 minutes, anonymous, PHQ-2 distress protocol described."},
      {step:"Write Section 3.4 Measures (6–8 paragraphs, one per scale). For each validated scale: full name + citation, item count, response scale, scoring, psychometric properties."},
      {step:"Scales to cover: PHQ-2 (Kroenke 2003), GAD-2 (Kroenke 2007), UCLA 2-item (Russell 1996), ASSIS 6-item (Sandhu & Asrabadi 1994), Financial Stress 3-item (original), Original 10 items."},
      {step:"For original items: explicitly state they have not been independently validated. Internal consistency will be assessed with Cronbach's alpha."},
      {step:"Include Q22 reverse scoring: Item 22 was reverse-scored (6 − Q22) so higher scores reflect greater faith disruption."},
    ],
    tips:["PHQ-2: Kroenke, K., Spitzer, R. L., & Williams, J. B. (2003). Medical Care, 41(11), 1284–1292.","GAD-2: Kroenke, K., et al. (2007). Annals of Internal Medicine, 146(5), 317–325."],
    resources:["Your 30-question survey instrument in the Survey concept from this app"],
  },
  "task-14": {
    title:"Write Chapter 3 Sections 3.5 and 3.6 — Statistical analysis plan and ethics",
    why:"Section 3.5 must be specific enough that a reader could replicate your analysis. Write in future tense since data collection has not begun.",
    timeEstimate:"4 hours (Thursday block)",
    steps:[
      {step:"Write Section 3.5 Statistical Analysis Plan — 5 paragraphs, one per step. Use future tense throughout ('will be computed', 'will be estimated')."},
      {step:"Step 1 — Descriptives: means, SDs, frequencies using describe() in psych package."},
      {step:"Step 2 — Bivariate correlations: Pearson correlations with binary outcome, all 13 predictors retained in full model."},
      {step:"Step 3 — Logistic regression: binary GLM, Hosmer-Lemeshow fit test, VIF for multicollinearity."},
      {step:"Step 4 — LASSO: glmnet package, 10-fold CV, lambda.min for optimal penalty."},
      {step:"Step 5 — Composite risk index and ROC: 70/30 train/holdout split, AUC target ≥ 0.75 (H4)."},
      {step:"Write Section 3.6 Ethical Considerations (2 paragraphs): IRB approval (FWA 00004733), anonymity, voluntary participation, no immigration consequences, distress protocol, data storage."},
    ],
    tips:["Hosmer-Lemeshow test: a goodness-of-fit test for logistic regression. Mention it here, report the result in Chapter 4."],
    resources:["R Guide tab — all 6 steps with code for reference"],
  },
  "task-15": {
    title:"Deploy survey + share at Impact Fellowship",
    why:"Data collection starts here. IRB approval must be in hand before you deploy.",
    timeEstimate:"3 hours (Saturday block)",
    steps:[
      {step:"FIRST — confirm IRB approval is in your email inbox. Do not proceed without it. If 4+ weeks since submission with no response, call 417-836-3737."},
      {step:"Build survey in Google Forms or Qualtrics: informed consent page first, then all 30 questions in section order."},
      {step:"Set up PHQ-2 branching: if Q6+Q7 ≥ 3, display distress message before survey ends. Test this logic before publishing."},
      {step:"Test the complete survey yourself end to end including the distress branch."},
      {step:"Publish. Copy the shareable link. Save it in the Data Hub tab of this app."},
      {step:"At Impact Fellowship that evening, give a 2-minute personal announcement and send the link in the group chat."},
    ],
    tips:["Personal asks outperform mass emails significantly. Face-to-face at fellowship will get you 15+ responses in one evening."],
    resources:["Google Forms: forms.google.com (free)","Qualtrics: check library.missouristate.edu for MSU access"],
  },
  "task-16": {
    title:"Survey recruitment — DSO, associations, WhatsApp, QR flyers + R practice",
    why:"Multi-channel outreach is necessary to reach 450 responses. Each channel reaches a different segment.",
    timeEstimate:"4 hours (Tuesday block)",
    steps:[
      {step:"Email DSO: internationalservices@missouristate.edu. Ask them to include your IRB-approved survey in their next email blast. Attach IRB approval. 3 sentences max."},
      {step:"Email MSU International Student Association president — ask them to share with membership."},
      {step:"Share in WhatsApp groups — personal and academic. Ask 5 specific friends to each share with one person they know."},
      {step:"Design a QR code flyer on canva.com (free): 2 sentences, QR code, Takes 6 minutes — completely anonymous. Print 20 copies. Post in international student common room, library, graduate spaces."},
      {step:"Use remaining 1.5–2 hrs to practice logistic regression in R: glm(vs ~ wt + hp, data=mtcars, family=binomial). Interpret the output. This builds muscle memory for your real data."},
    ],
    tips:["Generate QR code free at qr-code-generator.com.","Send DSO outreach early in your session — a single email can yield 50+ responses."],
    resources:["internationalservices@missouristate.edu","canva.com","qr-code-generator.com"],
  },
  "task-17": {
    title:"Survey recruitment — second push + LASSO practice in R",
    why:"Surveys lose momentum quickly after launch. A second push 1 week in typically produces a second wave of responses.",
    timeEstimate:"4 hours (Thursday block)",
    steps:[
      {step:"Check response count. Calculate EPV: (responses × 0.75 × 0.30) ÷ 13. Log in Data Hub tab."},
      {step:"Send second-round reminders in all channels with a different message angle."},
      {step:"Practice LASSO in R: library(glmnet); x <- model.matrix(vs ~ ., data=mtcars)[,-1]; y <- mtcars$vs; cv_lasso <- cv.glmnet(x, y, family='binomial', nfolds=10); plot(cv_lasso); coef(cv_lasso, s='lambda.min')"},
      {step:"Practice ROC: library(pROC); preds <- predict(cv_lasso, newx=x, s='lambda.min', type='response'); roc_obj <- roc(y, as.vector(preds)); auc(roc_obj); plot(roc_obj)"},
      {step:"Email Missouri S&T international student services asking them to share your IRB-approved survey."},
    ],
    tips:["The LASSO on mtcars is simple practice. Goal: get comfortable with glmnet output format before real data arrives."],
    resources:["cran.r-project.org/package=glmnet","cran.r-project.org/package=pROC"],
  },
  "task-18": {
    title:"Check response count + send second-wave reminders",
    why:"Strategic reminders 1–2 weeks after launch produce a reliable second wave of responses.",
    timeEstimate:"3 hours (Saturday block)",
    steps:[
      {step:"Log into survey platform. Export current responses. Count complete responses. Log in Data Hub tab."},
      {step:"Check EPV in the Data Hub — it updates automatically. If fewer than 150 responses, you need significantly broader outreach."},
      {step:"Send follow-up to DSO office: thank them, report current count, request one more reminder."},
      {step:"Post a progress update in fellowship chat and WhatsApp with current count and the link."},
      {step:"Use remaining time to check Chapter 3 progress and address any Dr. Zheng feedback from the Sept 3 meeting."},
    ],
    tips:["Best time for reminder emails: Tuesday–Thursday, 9–11am."],
    resources:["Your survey platform dashboard","Data Hub tab in this app"],
  },
  "task-19": {
    title:"Second-round reminders + Missouri S&T and UMKC outreach",
    why:"Expanding to partner institutions multiplies your potential sample. Gloria is at S&T — a personal connection is your strongest asset.",
    timeEstimate:"4 hours (Tuesday block)",
    steps:[
      {step:"Email Missouri S&T International Affairs (internationalaffairs@mst.edu): introduce yourself, explain IRB-approved research, ask them to share survey. Attach IRB approval."},
      {step:"Email UMKC International Student Affairs with similar message."},
      {step:"Ask Gloria to personally share the link with international students she knows at S&T — a personal endorsement outperforms a mass email."},
      {step:"Send second-round reminders in all existing channels with fresh messaging: I am getting close to my response target — 6 minutes would mean a lot."},
      {step:"Check response count and log. If ≥ 300, start planning survey close date around Oct 3."},
    ],
    tips:["CC yourself on all outreach emails to maintain a record."],
    resources:["internationalaffairs@mst.edu","Missouri S&T has a strong Nigerian student community — Gloria may know the international student organization president."],
  },
  "task-20": {
    title:"Check count — decision point: close Oct 3 or extend",
    why:"Based on the response count today, you either plan to close the survey October 3 or decide to extend. This is your key decision point.",
    timeEstimate:"4 hours (Thursday block)",
    steps:[
      {step:"Export current data. Count complete responses. Calculate EPV. EPV ≥ 10: close Oct 3 as planned. EPV 5–10: acceptable for LASSO, proceed. EPV < 5: extend and intensify outreach for 2 more weeks."},
      {step:"If closing Oct 3: compose a last-call message for all channels: Last call — survey closing October 3. If you have 6 minutes, please fill it out now."},
      {step:"If extending: email Dr. Zheng to inform him and update your timeline. Analysis dates shift 1–2 weeks but defense Nov 15 should hold if extension is short."},
      {step:"Use remaining time for Chapter 3 final read-through — read it aloud, rewrite anything unclear. Chapter 3 should be fully polished before data analysis begins."},
    ],
    tips:["A sample of 350–400 gives EPV ~6.7 — workable. A sample of 200–250 gives EPV ~3.8 — too low for stable logistic regression but acceptable if you use LASSO primarily and report it carefully in limitations."],
    resources:["EPV calculator is in the Data Hub tab"],
  },
  "task-21": {
    title:"Close survey, export CSV, run data check",
    why:"Data cleaning is often underestimated. Messy data will corrupt all downstream analyses if not caught here.",
    timeEstimate:"3 hours (Saturday block)",
    steps:[
      {step:"Close the survey in your platform. Export all responses as CSV. Save raw file as: thesis_raw_data_YYYYMMDD.csv — keep this file unmodified forever."},
      {step:"Open R: data <- read_csv('thesis_raw_data.csv'). Run: dim(data); names(data); head(data)."},
      {step:"Check for duplicates and partial responses. Decide on exclusion threshold: more than 20% missing items in a row → exclude."},
      {step:"Check for out-of-range values: summary(data) — flag any values outside valid scale ranges."},
      {step:"Create clean dataset: thesis_clean_data.csv. Document every exclusion in a notes file — this goes in Chapter 4 as a data cleaning paragraph."},
    ],
    tips:["Never overwrite the raw data file.","data_clean <- data[complete.cases(data),] — this keeps only rows with no missing values."],
    resources:["R Guide tab — Step 1 code"],
  },
  "task-22": {
    title:"R Steps 1–2: Load data, clean, score all scales, reverse-score Q22",
    why:"Every scale must be scored correctly. One error in Q22 reverse scoring propagates through all downstream analyses.",
    timeEstimate:"4 hours (Tuesday block)",
    steps:[
      {step:"Open RStudio. Load libraries: library(tidyverse); library(psych); library(glmnet); library(pROC); library(car)"},
      {step:"Load clean data: data <- read_csv('thesis_clean_data.csv'). Run glimpse(data)."},
      {step:"Run the Step 2 code from the R Guide tab exactly as written. Pay special attention to Q22r = 6 - Q22 and at_risk = as.integer(phq2 >= 3)."},
      {step:"Verify at_risk distribution: table(data$at_risk). Should be approximately 70% zeros and 30% ones."},
      {step:"Run describe() on all predictor variables. Save this output — it becomes Table 2 in your thesis."},
    ],
    tips:["If column names in your CSV do not match Q6, Q7 etc., rename them first.","Save your R script after every step."],
    resources:["R Guide tab — Step 1 and Step 2 code to copy"],
  },
  "task-23": {
    title:"R Steps 3–4: Descriptive statistics, correlations, logistic regression",
    why:"These steps produce the core quantitative results — which predictors are statistically significant after accounting for all others.",
    timeEstimate:"4 hours (Thursday block)",
    steps:[
      {step:"Run Step 3: descriptive statistics and bivariate correlations. Note the top 3 correlators — compare to H1 (isolation, financial stress, acculturative stress)."},
      {step:"Run Step 4 logistic regression. Interpret the Estimate column (log-odds) and Pr(>|z|) column (p-value) for each predictor."},
      {step:"Run exp(cbind(OR=coef(model), confint(model))) — odds ratios with 95% CIs. This is Table 3 in your thesis."},
      {step:"Run car::vif(model) — values above 10 are problematic multicollinearity. Note for Chapter 5 limitations."},
      {step:"Save all output. Paste key results into R Guide tab results notes. These numbers are the raw material for Chapter 4 Section 4.3."},
    ],
    tips:["OR = 2.3 means the odds of being at risk are 2.3× higher per unit increase in that predictor, holding all others constant.","If model does not converge, remove predictors one at a time to diagnose complete separation."],
    resources:["R Guide tab — Step 3 and Step 4 code"],
  },
  "task-24": {
    title:"R Step 5: LASSO variable selection",
    why:"LASSO answers which predictors matter most when everything is considered together. The surviving predictors become your composite risk index.",
    timeEstimate:"3 hours (Saturday block)",
    steps:[
      {step:"Run Step 5 from R Guide tab. set.seed(42) is critical for reproducibility."},
      {step:"After cv.glmnet, run plot(cv_lasso). Left vertical line is lambda.min, right is lambda.1se."},
      {step:"Run coef(cv_lasso, s='lambda.min') — non-zero coefficients are the LASSO-selected predictors."},
      {step:"Table the selected predictors and their coefficients. Compare to H1 — were the top 3 as hypothesized?"},
      {step:"Run plot(glmnet(x, y, family='binomial', alpha=1)) — save as lasso_path.png for Figure 1 in Chapter 4."},
    ],
    tips:["If all 13 predictors survive, try lambda.1se for a more selective model.","set.seed(42) — any number works but must be the same every time you re-run."],
    resources:["R Guide tab — Step 5 code and interpretation notes"],
  },
  "task-25": {
    title:"R Step 6: Composite risk index + ROC analysis — test H4",
    why:"The AUC value you get here is the answer to H4. Enter it in the app tracker immediately.",
    timeEstimate:"4 hours (Tuesday block)",
    steps:[
      {step:"Run Step 6 from R Guide tab. set.seed(42) before the 70/30 split."},
      {step:"Run auc(roc_obj). Write down the value. Enter it in the R Guide AUC tracker in this app right now."},
      {step:"Run ci.auc(roc_obj) for the 95% confidence interval."},
      {step:"Save the ROC curve plot as roc_curve.png — Figure 2 in Chapter 4."},
      {step:"Interpret: AUC ≥ 0.75 = H4 confirmed. AUC 0.70–0.75 = below threshold but clinically meaningful, report honestly in Ch5. AUC < 0.70 = poor discrimination, discuss reasons in Ch5."},
    ],
    tips:["If AUC < 0.75, try running the model with only LASSO-selected predictors. The reduced model may have better AUC."],
    resources:["R Guide tab — Step 6 code","AUC tracker at top of R Guide tab"],
  },
  "task-26": {
    title:"Create all Chapter 4 tables and figures",
    why:"Creating tables and figures before writing Chapter 4 means you write by describing what you see — not trying to remember numbers.",
    timeEstimate:"4 hours (Thursday block)",
    steps:[
      {step:"Create Table 1 — Demographics: region of origin, level of study, time in US, gender, faith community. APA format: no vertical borders, three horizontal lines only."},
      {step:"Create Table 2 — Descriptive statistics: mean, SD, min, max, bivariate correlation with at_risk for all predictors."},
      {step:"Create Table 3 — Logistic regression: Predictor, B, SE, Wald, OR, 95% CI, p. Bold significant predictors."},
      {step:"Caption Figure 1 (LASSO path): Figure 1. LASSO regularization path. Coefficients plotted as function of log penalty parameter. Vertical dashed line = lambda.min via 10-fold CV."},
      {step:"Caption Figure 2 (ROC curve): Figure 2. ROC curve for composite risk index on 30% holdout sample. AUC = [value] (95% CI: [lower, upper])."},
      {step:"Insert all tables and figures into the thesis Word document under placeholder Chapter 4 headings."},
    ],
    tips:["APA table: no side borders, three horizontal lines only (top, below headers, bottom). Use Word table tools.","Number tables and figures separately: Table 1, 2, 3; Figure 1, 2."],
    resources:["apastyle.apa.org — APA 7th edition table and figure guidelines"],
  },
  "task-27": {
    title:"Write Chapter 4 Sections 4.1, 4.2, and 4.3",
    why:"With tables created, writing Chapter 4 is describing what you see in front of you.",
    timeEstimate:"3 hours (Saturday block)",
    steps:[
      {step:"Write 4.1 Introduction (1 paragraph): results of five-step analysis, organized around four hypotheses."},
      {step:"Write 4.2 Descriptive Statistics (3–4 paragraphs): sample demographics from Table 1, PHQ-2 prevalence, predictor descriptives from Table 2. Report the percent at-risk — compare to assumed 30%."},
      {step:"Write 4.3 Logistic Regression (3–4 paragraphs): model fit, significant predictors with ORs from Table 3, H1 addressed. Report visa anxiety finding explicitly."},
      {step:"Keep writing factual and tied to tables. Do not interpret — that is Chapter 5."},
    ],
    tips:["One sentence per result, anchored to a table: As shown in Table 3, acculturative stress was the strongest predictor (OR = 2.4, 95% CI [1.8, 3.2], p < .001)."],
    resources:["Chapter 1 H1–H4 to check results against"],
  },
  "task-28": {
    title:"Write Chapter 4 Sections 4.4, 4.5, 4.6 — LASSO, ROC, summary",
    why:"Sections 4.4 and 4.5 contain the most technically sophisticated results — scrutinize every claim.",
    timeEstimate:"4 hours (Tuesday block)",
    steps:[
      {step:"Write 4.4 LASSO Variable Selection: report lambda.min, which predictors selected, which dropped, reference Figure 1."},
      {step:"Write 4.5 Composite Risk Index and ROC: index construction from LASSO predictors, AUC value with CI, ROC curve reference (Figure 2), H4 confirmed or not."},
      {step:"Write 4.6 Summary: one paragraph recapping the key finding from each section and pointing to Chapter 5."},
      {step:"Read entire Chapter 4 aloud — every claim tied to a table or figure, no interpretation."},
      {step:"Chapter 4 is complete."},
    ],
    tips:["An AUC below 0.75 is not a failure — it is an important finding about the complexity of predicting mental health outcomes. Report it honestly."],
    resources:["All R output saved in R Guide tab results notes"],
  },
  "task-29": {
    title:"Write Chapter 5 Sections 5.1 and 5.2 — Introduction and discussion of findings",
    why:"Section 5.2 is the most important writing in the thesis — it connects results back to hypotheses and literature.",
    timeEstimate:"4 hours (Thursday block)",
    steps:[
      {step:"Write 5.1 Introduction (1 paragraph): what this chapter does — interprets findings, addresses limitations, proposes future research, concludes with practical implications."},
      {step:"Write 5.2 Discussion — address H1 through H4 in order, 2–3 paragraphs each."},
      {step:"H1: Did isolation, financial stress, acculturative stress emerge as top 3? Connect to Hyun 2007 and Sandhu & Asrabadi 1994. Address visa anxiety finding explicitly."},
      {step:"H2: Was faith a significant protective factor (negative predictor)? Connect to Section 2.6."},
      {step:"H3: Were first-year students significantly more at risk? Report demographic analysis from Table 1."},
      {step:"H4: What does the AUC mean for early identification? Compare to other mental health screening tools in the literature."},
    ],
    tips:["Discussion is where you have a voice. The writing is interpretive, not just factual.","Do not re-report raw statistics in Chapter 5 — reference them: As shown in Chapter 4..."],
    resources:["Chapter 2 for literature to connect back to","Chapter 4 results for reference"],
  },
  "task-30": {
    title:"Write Chapter 5 Sections 5.3, 5.4, 5.5 + complete references",
    why:"Finishing Chapter 5 completes the thesis body. The conclusion connects everything back to Chapter 1's opening.",
    timeEstimate:"3 hours writing + 1 hour references",
    steps:[
      {step:"Write 5.3 Limitations — 7 numbered limitations from Chapter 1 Section 1.6. Expand each with its statistical implication."},
      {step:"Write 5.4 Future Research (2–3 paragraphs): longitudinal design, multi-institution validation, independent validation of original 10 items, physiological indicators."},
      {step:"Write 5.5 Conclusion (2–3 paragraphs): return to the opening image of an international student arriving. End with First 90 as the practical translation of the statistical findings."},
      {step:"Write the References section. Core 7 APA citations: Hyun 2007, Kroenke PHQ-9 2003, Kroenke GAD-7 2007, Russell 1996, Sandhu & Asrabadi 1994, Tibshirani 1996, Yeh & Inose 2003. Add all additional citations from Chapter 2."},
      {step:"In Word, apply hanging indent to all references: Ctrl+T. Double-space all references."},
    ],
    tips:["The conclusion is the last thing your committee reads before your defense. Make it memorable and human."],
    resources:["Chapter 1 Section 1.6 — 7 limitations list","apastyle.apa.org — APA reference format"],
  },
  "task-31": {
    title:"Compile full thesis document + check formatting",
    why:"Formatting errors will be flagged by the graduate school. Fix them now, not after the defense.",
    timeEstimate:"4 hours (Tuesday block)",
    steps:[
      {step:"Combine all chapters into one Word document: Insert → Object → Text from File for each chapter in order."},
      {step:"Check margins: 1 inch all sides (Layout → Margins → Normal)."},
      {step:"Check font: Times New Roman 12pt throughout. Select all (Ctrl+A), set font."},
      {step:"Check page numbers: front matter uses lowercase Roman numerals, body uses Arabic numerals starting at Chapter 1."},
      {step:"Generate Table of Contents: References → Table of Contents. Requires heading styles applied to all headings."},
      {step:"Read complete document: every figure has a numbered caption below it, every table has a numbered caption above it, every in-text citation has a References entry."},
    ],
    tips:["Download MSU thesis formatting guide from graduate.missouristate.edu — check every requirement before submission."],
    resources:["graduate.missouristate.edu — thesis formatting requirements"],
  },
  "task-32": {
    title:"Full thesis read-through — find every gap",
    why:"Reading the complete thesis aloud will surface errors your eyes skip over when writing.",
    timeEstimate:"4 hours (Thursday block)",
    steps:[
      {step:"Print the thesis or use a tablet in non-editing mode. Read aloud from title page through references."},
      {step:"Mark every place where: a claim lacks a citation, a sentence is unclear, a section does not flow, a table or figure is referenced but missing, a statistic in text does not match the table."},
      {step:"Make a prioritized list: critical (missing content), important (clarity), minor (typos)."},
      {step:"Begin fixing critical issues immediately: every missing citation, every table mismatch, every logic gap."},
      {step:"Check the abstract: mentions PHQ-2/GAD-2, LASSO, AUC result, and First 90? Under 300 words?"},
    ],
    tips:["Reading aloud is non-negotiable. Your ear will catch what your eye misses."],
    resources:["Chapter 1 hypotheses — verify Chapter 5 addresses all 4 directly"],
  },
  "task-33": {
    title:"Fix gaps from read-through + send complete draft to Dr. Zheng",
    why:"Dr. Zheng needs at least one week to review before the defense. Sending November 7 gives him 8 days.",
    timeEstimate:"3 hours (Saturday block)",
    steps:[
      {step:"Fix every critical issue: missing citations, table mismatches, uncited statistical claims."},
      {step:"Fix important issues: unclear sentences, missing transitions, awkward phrasing."},
      {step:"Final proofread: grammar, spelling, APA citation format, page numbers, consistent headings."},
      {step:"Export as PDF: File → Save As → PDF. Check every page renders correctly."},
      {step:"Email to Dr. Zheng: complete PDF, note the defense date November 15, request feedback by November 12."},
      {step:"CC your own email as a timestamped backup record."},
    ],
    tips:["A good complete draft is better than a perfect partial one.","CC your MSU email and personal email on the send."],
    resources:["SongfengZheng@missouristate.edu"],
  },
  "task-34": {
    title:"Build defense presentation — all 15 slides",
    why:"A clear presentation demonstrates command of your material before a single question is asked.",
    timeEstimate:"4 hours (Tuesday block)",
    steps:[
      {step:"Create 15 slides: (1) Title, (2) Why this matters — the 1.1M problem, (3) Literature review summary, (4) The gap, (5) Research questions and H1–H4, (6) Study design and participants, (7) Survey instrument, (8) Statistical analysis plan, (9) Sample demographics Table 1, (10) Logistic regression key findings, (11) LASSO selected predictors, (12) ROC curve and AUC, (13) Discussion H1–H4, (14) First 90 applied output, (15) Conclusion, limitations, future research."},
      {step:"Each slide: one main idea, minimal text, bullet points only. Speak to the slide — do not read it."},
      {step:"Slide 12 (ROC): embed Figure 2 directly. Add a large AUC callout. If ≥ 0.75: H4 confirmed. If below: report honestly."},
      {step:"Slide 14 (First 90): show a screenshot or mockup of the app. Connect explicitly to the statistical findings."},
      {step:"Send slides to Dr. Zheng for feedback."},
    ],
    tips:["Less text is always better in presentations. If a slide has more than 20 words of body text, cut it."],
    resources:["All figures already in your thesis Word document"],
  },
  "task-35": {
    title:"Full defense run-through (timed) + draft all 10 committee question answers",
    why:"The most common defense failure is running out of time. Practice timed, out loud, from slide 1 to 15.",
    timeEstimate:"4 hours (Thursday block)",
    steps:[
      {step:"Set a 25-minute timer. Present the entire thesis out loud as if the committee is present. Note which slide you are on when the timer goes off."},
      {step:"Identify the 3 places where you spent the most time. Ensure results and discussion get the most time, not the introduction."},
      {step:"Run through again, faster in identified overruns. Target: finish slide 15 with 1–2 minutes to spare."},
      {step:"Open the Defense tab. Draft an answer for all 10 committee questions: specific (cite your data), honest (acknowledge limitations), confident."},
      {step:"Focus on: Q2 (EPV rule for sample size), Q4 (LASSO vs stepwise — cite Tibshirani 1996), Q7 (visa anxiety — report what your data actually showed)."},
    ],
    tips:["Record yourself on your phone. Watching yourself back is uncomfortable but extremely effective.","Ask Gloria to quiz you on the 10 questions randomly — that is closest to the actual defense experience."],
    resources:["Defense tab in this app — question list and practice timer"],
  },
  "task-36": {
    title:"Rest day — review notes gently, trust the work",
    why:"Cramming the night before does not help a defense. Rest is the best preparation.",
    timeEstimate:"As long as you need",
    steps:[
      {step:"Do not open the thesis document today. The writing is done."},
      {step:"Briefly review your 10 committee question answers once. Do not rewrite them."},
      {step:"Confirm logistics: defense location, time, laptop, projector connection, clicker."},
      {step:"Pack: laptop, charger, USB drive with slides, printed thesis copy, water bottle, food for before."},
      {step:"Pray. Rest. Sleep at a decent hour."},
    ],
    tips:["The committee wants you to pass. Their questions are opportunities to show you understand your own research, not traps.","Text Gloria and your family tonight."],
    resources:[],
  },
  "task-37": {
    title:"Defense day",
    why:"This is the day every session built toward.",
    timeEstimate:"The rest of your life starts here",
    steps:[
      {step:"Eat something. Drink water. Arrive 15 minutes early."},
      {step:"Set up laptop, test projector, slides open on slide 1."},
      {step:"Speak clearly. Make eye contact. You know this material."},
      {step:"When questions come — pause before answering. Take a breath. Answer what was asked."},
      {step:"You are ready. God brought you this far."},
    ],
    tips:[],
    resources:[],
  },
};


/* ─── SURVEY FIELDS ─────────────────────────────────────────────────────
   All 30 questions with type, options, and scoring info.
   Used by both the in-app survey form and the data table.
──────────────────────────────────────────────────────────────────────── */
const SURVEY_FIELDS = [
  // Section 1 — Demographics
  { id:"q1",  section:"Demographics", label:"Country of origin", type:"text", required:true },
  { id:"q2",  section:"Demographics", label:"Level of study", type:"select", options:["Undergraduate","Graduate (Master's)","Graduate (PhD)","Other"], required:true },
  { id:"q3",  section:"Demographics", label:"Time in the United States", type:"select", options:["Less than 6 months","6 to 12 months","1 to 2 years","More than 2 years"], required:true },
  { id:"q4",  section:"Demographics", label:"Gender", type:"select", options:["Man","Woman","Non-binary","Prefer not to say","Prefer to self-describe"], required:true },
  { id:"q5",  section:"Demographics", label:"Active faith or religious community in the US", type:"select", options:["Yes","No","Still looking for one"], required:true },
  // Section 2 — PHQ-2
  { id:"q6",  section:"PHQ-2", label:"Little interest or pleasure in doing things", type:"scale4", scale:"0=Not at all, 3=Nearly every day", required:true },
  { id:"q7",  section:"PHQ-2", label:"Feeling down, depressed, or hopeless", type:"scale4", scale:"0=Not at all, 3=Nearly every day", required:true },
  // Section 3 — GAD-2
  { id:"q8",  section:"GAD-2", label:"Feeling nervous, anxious, or on edge", type:"scale4", scale:"0=Not at all, 3=Nearly every day", required:true },
  { id:"q9",  section:"GAD-2", label:"Not being able to stop or control worrying", type:"scale4", scale:"0=Not at all, 3=Nearly every day", required:true },
  // Section 4 — UCLA Loneliness
  { id:"q10", section:"UCLA Loneliness", label:"I feel that I lack companionship", type:"scale3", scale:"1=Hardly ever, 3=Often", required:true },
  { id:"q11", section:"UCLA Loneliness", label:"I feel isolated from other people", type:"scale3", scale:"1=Hardly ever, 3=Often", required:true },
  // Section 5 — ASSIS
  { id:"q12", section:"ASSIS", label:"People here do not understand my cultural values", type:"scale5", scale:"1=Not at all stressful, 5=Extremely stressful", required:true },
  { id:"q13", section:"ASSIS", label:"I miss my family and friends back home", type:"scale5", scale:"1=Not at all stressful, 5=Extremely stressful", required:true },
  { id:"q14", section:"ASSIS", label:"People here treat me differently because of where I am from", type:"scale5", scale:"1=Not at all stressful, 5=Extremely stressful", required:true },
  { id:"q15", section:"ASSIS", label:"I am afraid I will not be able to complete my studies here", type:"scale5", scale:"1=Not at all stressful, 5=Extremely stressful", required:true },
  { id:"q16", section:"ASSIS", label:"Adjusting to a new way of life here has been difficult", type:"scale5", scale:"1=Not at all stressful, 5=Extremely stressful", required:true },
  { id:"q17", section:"ASSIS", label:"I feel guilty about leaving my family back home", type:"scale5", scale:"1=Not at all stressful, 5=Extremely stressful", required:true },
  // Section 6 — Financial Stress
  { id:"q18", section:"Financial Stress", label:"I feel stressed about my ability to cover basic expenses here", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  { id:"q19", section:"Financial Stress", label:"My financial situation affects my ability to focus on my studies", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  { id:"q20", section:"Financial Stress", label:"I have had to go without something I needed because I could not afford it", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  // Section 7 — Original items
  { id:"q21", section:"Faith", label:"Since arriving in the US, I have found it difficult to maintain my faith or spiritual practice", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  { id:"q22", section:"Faith", label:"My faith community has been a source of strength during my time here (REVERSE SCORED)", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true, reverse:true },
  { id:"q23", section:"Visa Anxiety", label:"I frequently worry about changes to immigration policy affecting my student visa", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  { id:"q24", section:"Visa Anxiety", label:"Uncertainty about my visa status affects my ability to focus on my studies", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  { id:"q25", section:"Housing", label:"I have had difficulty finding suitable housing since arriving in the US", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  { id:"q26", section:"Help-seeking", label:"I feel uncomfortable seeking help from a counselor or therapist", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  { id:"q27", section:"Help-seeking", label:"I do not know how to access mental health or medical services at my university", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  { id:"q28", section:"Food", label:"I find it difficult to access foods that are familiar to me from home", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  { id:"q29", section:"Communication", label:"I feel nervous speaking up in class or participating in academic discussions", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
  { id:"q30", section:"Communication", label:"I sometimes avoid reaching out to professors or staff because I am unsure how to communicate with them", type:"scale5", scale:"1=Strongly disagree, 5=Strongly agree", required:true },
];

const SCALE4_OPTS = ["0 — Not at all","1 — Several days","2 — More than half the days","3 — Nearly every day"];
const SCALE3_OPTS = ["1 — Hardly ever","2 — Sometimes","3 — Often"];
const SCALE5_STRESS = ["1 — Not at all stressful","2 — Slightly stressful","3 — Moderately stressful","4 — Very stressful","5 — Extremely stressful"];
const SCALE5_AGREE  = ["1 — Strongly disagree","2 — Disagree","3 — Neutral","4 — Agree","5 — Strongly agree"];

function getOpts(field) {
  if (field.type === "scale4") return SCALE4_OPTS;
  if (field.type === "scale3") return SCALE3_OPTS;
  if (field.type === "scale5") return field.section === "ASSIS" ? SCALE5_STRESS : SCALE5_AGREE;
  if (field.type === "select") return field.options;
  return [];
}

function parseVal(str) {
  if (!str) return null;
  const n = parseInt(str[0]);
  return isNaN(n) ? str : n;
}

function scorePHQ2(resp) {
  const v6 = parseVal(resp.q6) || 0;
  const v7 = parseVal(resp.q7) || 0;
  return v6 + v7;
}

/* ─── QUOTES ─────────────────────────────────────────────────────────── */
const QUOTES = [
  { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "Commit to the Lord whatever you do, and he will establish your plans.", ref: "Proverbs 16:3" },
  { text: "Being confident of this, that he who began a good work in you will carry it on to completion.", ref: "Philippians 1:6" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
  { text: "The journey of a thousand miles begins with a single step.", ref: "Lao Tzu" },
  { text: "You did not come this far to only come this far.", ref: "Unknown" },
  { text: "Success is the sum of small efforts repeated day in and day out.", ref: "Robert Collier" },
  { text: "Every international student who reads your thesis will recognize themselves in it. That is worth finishing.", ref: "A reminder" },
  { text: "Do not watch the clock. Do what it does. Keep going.", ref: "Sam Levenson" },
  { text: "You are more capable than you think. The proof is that you are still here.", ref: "Your story" },
  { text: "Hard days are the best because that is when champions are made.", ref: "Gabby Douglas" },
  { text: "The secret of getting ahead is getting started.", ref: "Mark Twain" },
  { text: "Research is creating new knowledge.", ref: "Neil Armstrong" },
  { text: "God does not call the equipped. He equips the called.", ref: "Unknown" },
];

const MY_WHY = `Being an international student in the United States is hard. I do not say that lightly. There were nights I sat alone in a country that did not feel like home, carrying the weight of expectations, bills, deadlines, and the quiet fear that I might not make it.

But I did make it. And I did not make it alone.

This thesis exists because I want to make the path easier for at least one international student who comes after me. If my data can identify who is struggling before the struggle becomes a crisis — and if the First 90 app can give that student a guide through their first 90 days — then every hour I put into this work will have been worth it.

This is not just academic work. It is something that will actually help people.`;

/* ─── PUSH NOTIFICATIONS ─────────────────────────────────────────────── */
async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

async function subscribeToPush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    // VAPID public key — replace with yours from: npx web-push generate-vapid-keys
    const VAPID_PUBLIC = "YOUR_VAPID_PUBLIC_KEY";
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
    return sub;
  } catch { return null; }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function scheduleLocalNotification(task, timeStr) {
  // Uses browser Notification API for local (no server) reminders
  if (Notification.permission !== "granted") return;
  // Parse time and schedule
  const [time, period] = timeStr.split(" ");
  const [h, m] = time.split(":").map(Number);
  const hour = period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h;
  const now = new Date();
  const target = new Date();
  target.setHours(hour, m || 0, 0, 0);
  const delay = target - now;
  if (delay > 0 && delay < 86400000) {
    setTimeout(() => {
      new Notification("📚 Thesis time", {
        body: task.slice(0, 80) + "…",
        icon: "/icon-192.png",
        tag: "thesis-reminder",
      });
    }, delay);
  }
}

/* ─── SMALL UI COMPONENTS ────────────────────────────────────────────── */
function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: T.surface, borderRadius: 12, border: `1px solid ${T.chalkFaint}`,
      padding: "14px 16px", marginBottom: 10,
      cursor: onClick ? "pointer" : undefined, ...style,
    }}>{children}</div>
  );
}

function ProgressBar({ value, color, height = 5 }) {
  return (
    <div style={{ background: T.bgDeep, borderRadius: 99, overflow: "hidden", height }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`, height: "100%",
        background: color || T.amber, borderRadius: 99, transition: "width .4s ease",
      }} />
    </div>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: T.surface2, borderRadius: 10, padding: "11px 13px", flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 11, color: T.chalkDim, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.chalk, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.chalkDim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
      background: (color || T.amber) + "22", color: color || T.amber,
      border: `1px solid ${(color || T.amber)}44`,
    }}>{text}</span>
  );
}

// SVG readiness ring
function ReadinessRing({ pct }) {
  const r = 38, circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(100, pct) / 100);
  const c = pct >= 80 ? T.blue : pct >= 50 ? T.amber : T.coral;
  return (
    <div style={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
      <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="46" cy="46" r={r} fill="none" stroke={T.bgDeep} strokeWidth="8" />
        <circle cx="46" cy="46" r={r} fill="none" stroke={c} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: c }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

// Confetti
function useConfetti() {
  const [show, setShow] = useState(false);
  const trigger = useCallback(() => { setShow(true); setTimeout(() => setShow(false), 3000); }, []);
  const el = show ? (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999 }}>
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}%`,
          width: 8, height: 8, borderRadius: Math.random() > 0.5 ? "50%" : 2,
          background: [T.amber, T.blue, T.coral, "#7f56d9", "#0F6E56"][Math.floor(Math.random() * 5)],
          animation: `fall ${1.5 + Math.random() * 2}s ease-in forwards`,
          animationDelay: `${Math.random() * 0.8}s`,
        }} />
      ))}
    </div>
  ) : null;
  return { el, trigger };
}

// Pomodoro timer
function PomodoroTimer() {
  const [mode, setMode]     = useState("work");
  const [secs, setSecs]     = useState(25 * 60);
  const [running, setRun]   = useState(false);
  const [cycles, setCycles] = useState(0);
  const iv = useRef(null);

  useEffect(() => {
    if (running) {
      iv.current = setInterval(() => {
        setSecs((s) => {
          if (s <= 1) {
            clearInterval(iv.current); setRun(false);
            if (mode === "work") { setMode("break"); setSecs(5 * 60); setCycles((c) => c + 1); }
            else { setMode("work"); setSecs(25 * 60); }
            if (Notification.permission === "granted") {
              new Notification(mode === "work" ? "🎉 Pomodoro done! Take a 5min break." : "⏰ Break over. Back to thesis.", { icon: "/icon-192.png" });
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(iv.current);
    return () => clearInterval(iv.current);
  }, [running, mode]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const pct = mode === "work" ? ((25 * 60 - secs) / (25 * 60)) * 100 : ((5 * 60 - secs) / (5 * 60)) * 100;
  const c = mode === "work" ? T.amber : T.blue;

  return (
    <Card>
      <div style={{ fontSize: 11, fontWeight: 600, color: c, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
        {mode === "work" ? "Focus" : "Break"} · {cycles} {cycles === 1 ? "cycle" : "cycles"}
      </div>
      <div style={{ fontSize: 42, fontWeight: 700, color: T.chalk, fontFamily: "monospace", marginBottom: 8 }}>{mm}:{ss}</div>
      <ProgressBar value={pct} color={c} height={4} />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setRun((r) => !r)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, background: c, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
          {running ? <Pause size={15} /> : <Play size={15} />} {running ? "Pause" : "Start"}
        </button>
        <button onClick={() => { setRun(false); setSecs(mode === "work" ? 25 * 60 : 5 * 60); }} style={{ padding: "8px 12px", borderRadius: 8, background: "none", border: `1px solid ${T.chalkFaint}`, color: T.chalkDim, cursor: "pointer" }}>
          <RotateCcw size={15} />
        </button>
      </div>
    </Card>
  );
}

// Daily plan modal — shows on first open each day
function DailyModal({ open, onClose, todayTask, scheduleInfo }) {
  if (!open) return null;
  const todayStr = TODAY();
  const dow = new Date(todayStr + "T12:00:00").getDay();
  const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dow];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(8,20,15,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn .2s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: T.surface, borderRadius: 18, padding: 24, border: `1px solid ${T.chalkFaint}`, animation: "popIn .25s cubic-bezier(.2,.9,.25,1.15)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          <Sparkles size={12} style={{ display: "inline", marginRight: 4 }} />
          {dayName} {todayStr}
        </div>

        {scheduleInfo ? (
          <>
            <div style={{ fontSize: 13, color: T.chalkDim, marginBottom: 10 }}>
              Your thesis slot today: <strong style={{ color: T.amber }}>{scheduleInfo.slot}</strong>
            </div>
            {todayTask ? (
              <div style={{ fontSize: 15, fontWeight: 600, color: T.chalk, lineHeight: 1.45, marginBottom: 14 }}>
                {todayTask.task}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: T.chalk, marginBottom: 14 }}>
                No specific task scheduled — work on the current chapter section.
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 14, color: T.chalkDim, marginBottom: 14 }}>
            {dow === 0 ? "Sunday — rest day. Church, family, Spark. No thesis today." :
             dow === 1 ? "Monday — Class and teaching day. No thesis block today." :
             dow === 3 ? "Wednesday — Class and teaching day. No thesis block today." :
             "No thesis slot today. Rest or review notes."}
          </div>
        )}

        <div style={{ fontSize: 12, color: T.chalkDim, marginBottom: 16 }}>
          {DAYS_UNTIL(DEFENSE_DATE)} days to defense · {WEEKS_LEFT()} weeks remaining
        </div>

        <button onClick={onClose} style={{ width: "100%", padding: "11px 0", borderRadius: 10, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>
          {scheduleInfo ? "Let's go 🔥" : "Got it"}
        </button>
      </div>
    </div>
  );
}

/* ─── VIEWS ──────────────────────────────────────────────────────────── */


/* ─── TODAY VIEW ─────────────────────────────────────────────────────────
   The primary "Resume Thesis" screen.
   Shows: today's tasks + overdue carried-over tasks + step-by-step guide
   per task in an expandable drawer.
──────────────────────────────────────────────────────────────────────── */
function TodayView({ tasks, onToggle, onOverride }) {
  const todayStr = TODAY();
  const [activeGuide, setActiveGuide] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  // Today's tasks
  const todayTasks = tasks.filter((t) => t.date === todayStr);

  // Overdue — undone tasks from before today
  const overdueTasks = tasks.filter((t) => t.date < todayStr && !t.done);

  const allVisible = [...overdueTasks, ...todayTasks];
  const doneCount = allVisible.filter((t) => t.done).length;

  const dow = new Date(todayStr + "T12:00:00").getDay();
  const slot = SCHEDULE[dow];
  const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dow];

  const phaseColor = (phase) => PHASE_COLOR[phase] || T.amber;

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.amber, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{dayName} {todayStr}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.chalk, marginBottom: 4 }}>Today's thesis work</div>
        {slot ? (
          <div style={{ fontSize: 13, color: T.chalkDim }}>
            Your window: <strong style={{ color: T.amber }}>{slot.slot}</strong> · {slot.hours} hrs
          </div>
        ) : (
          <div style={{ fontSize: 13, color: T.chalkDim }}>
            {dow === 0 ? "Rest day — no thesis today." : dow === 6 ? "Saturday — no thesis today." : "Class and teaching day — no thesis block."}
          </div>
        )}
      </div>

      {/* Progress for today */}
      {allVisible.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.chalk }}>
              {doneCount === allVisible.length ? "All done! 🎉" : `${doneCount} of ${allVisible.length} complete`}
            </span>
            <span style={{ fontSize: 12, color: T.chalkDim }}>{allVisible.length - doneCount} remaining</span>
          </div>
          <ProgressBar value={(doneCount / allVisible.length) * 100} color={T.amber} height={8} />
        </Card>
      )}

      {/* Overdue tasks banner */}
      {overdueTasks.length > 0 && (
        <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          ⚠️ Carried over from previous days ({overdueTasks.length})
        </div>
      )}

      {allVisible.length === 0 && (
        <Card style={{ background: T.amberDim, border: `1px solid ${T.amber}44` }}>
          <div style={{ fontSize: 14, color: T.chalk, lineHeight: 1.6 }}>
            {slot ? "No specific tasks scheduled today. Use your " + slot.slot + " block to work on the current chapter section or review notes." : "Rest today. You cannot pour from an empty cup."}
          </div>
        </Card>
      )}

      {/* Task list with step-by-step guides */}
      {allVisible.map((task) => {
        const isOverdue = task.date < todayStr;
        const guide = TASK_GUIDES[task.id];
        const isOpen = activeGuide === task.id;
        const color = phaseColor(task.phase);
        const isEditing = editId === task.id;

        return (
          <div key={task.id} style={{ background: T.surface, borderRadius: 14, marginBottom: 10, border: isOverdue ? `1.5px solid ${T.coral}88` : `1px solid ${T.chalkFaint}`, overflow: "hidden", opacity: task.done ? 0.6 : 1 }}>
            {/* Task header */}
            <div style={{ padding: "14px 16px" }}>
              {isOverdue && (
                <div style={{ fontSize: 10, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  Carried over from {task.date}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {/* Checkbox */}
                <button
                  onClick={() => onToggle(task.id, !task.done)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: task.done ? T.amber : T.chalkDim, padding: 0, flexShrink: 0, marginTop: 2 }}
                >
                  {task.done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>

                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 13, fontFamily: "inherit", resize: "vertical", marginBottom: 6 }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { onOverride(task.id, editText); setEditId(null); }} style={{ padding: "5px 12px", borderRadius: 6, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Save</button>
                        <button onClick={() => setEditId(null)} style={{ padding: "5px 10px", borderRadius: 6, background: "none", border: `1px solid ${T.chalkFaint}`, color: T.chalkDim, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.chalk, lineHeight: 1.45, textDecoration: task.done ? "line-through" : "none", marginBottom: 6 }}>
                        {task.milestone ? "📅 " : task.urgent ? "🔴 " : ""}{task.task.split(".")[0]}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <Badge text={task.phase} color={color} />
                        {task.urgent && <Badge text="urgent" color={T.coral} />}
                        {task.milestone && <Badge text="milestone" color="#0e7490" />}
                        {guide && <Badge text={guide.timeEstimate} color={T.chalkDim} />}
                        <button onClick={() => { setEditId(task.id); setEditText(task.task); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.chalkDim, padding: 0 }}>
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Step-by-step guide toggle */}
              {guide && !isEditing && (
                <button
                  onClick={() => setActiveGuide(isOpen ? null : task.id)}
                  style={{
                    width: "100%", marginTop: 12, padding: "9px 14px",
                    borderRadius: 8, background: isOpen ? color + "22" : T.bgDeep,
                    border: `1px solid ${isOpen ? color + "55" : T.chalkFaint}`,
                    color: isOpen ? color : T.chalkDim, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Play size={12} style={{ flexShrink: 0 }} />
                    {isOpen ? "Hide guide" : "Step-by-step guide — how to do this"}
                  </span>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
            </div>

            {/* Expanded guide */}
            {guide && isOpen && (
              <div style={{ borderTop: `1px solid ${T.chalkFaint}`, padding: "16px 16px 18px", background: T.bgDeep }}>
                {/* Why this matters */}
                <div style={{ fontSize: 11, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  Why this matters
                </div>
                <div style={{ fontSize: 13, color: T.chalk, lineHeight: 1.65, marginBottom: 14 }}>
                  {guide.why}
                </div>

                {/* Steps */}
                <div style={{ fontSize: 11, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  Step by step
                </div>
                {guide.steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                      background: color + "22", color, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, fontWeight: 700,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 13, color: T.chalk, lineHeight: 1.65, flex: 1 }}>
                      {s.step}
                    </div>
                  </div>
                ))}

                {/* Tips */}
                {guide.tips && guide.tips.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.1em", margin: "12px 0 8px" }}>
                      Tips
                    </div>
                    {guide.tips.map((tip, i) => (
                      <div key={i} style={{ fontSize: 12, color: T.chalkDim, lineHeight: 1.6, marginBottom: 6, display: "flex", gap: 8 }}>
                        <span style={{ color, flexShrink: 0 }}>💡</span>
                        {tip}
                      </div>
                    ))}
                  </>
                )}

                {/* Resources */}
                {guide.resources && guide.resources.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.1em", margin: "12px 0 8px" }}>
                      Resources
                    </div>
                    {guide.resources.map((r, i) => (
                      <div key={i} style={{ fontSize: 12, color: T.chalkDim, lineHeight: 1.6, marginBottom: 4 }}>
                        → {r}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DashboardView({ tasks, chapterStatus, sessions, irbStatus, fundingStatus, navigate, notifEnabled, onEnableNotif }) {
  const allSections = CHAPTERS.flatMap((c) => c.sections);
  const doneSections = allSections.filter((s) => chapterStatus[s.id] === "complete");
  const pct = Math.round((doneSections.length / allSections.length) * 100);
  const daysLeft = DAYS_UNTIL(DEFENSE_DATE);
  const weeksLeft = WEEKS_LEFT();
  const totalHrs = sessions.reduce((s, a) => s + (a.duration || 0), 0) / 60;

  const todayStr = TODAY();
  const todayTask = tasks.find((t) => t.date === todayStr);
  const nextTask = tasks.find((t) => !t.done && t.date >= todayStr);
  const doneTasks = tasks.filter((t) => t.done).length;

  const label = pct >= 80 ? "Almost there!" : pct >= 60 ? "Good progress" : pct >= 30 ? "Building momentum" : "Just starting";

  const quoteIdx = Math.floor(new Date(todayStr).getTime() / 86400000) % QUOTES.length;
  const quote = QUOTES[quoteIdx];

  const allIrb = IRB.flatMap((s) => s.tasks);
  const doneIrb = allIrb.filter((t) => irbStatus[t.id]).length;

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      {/* Quote */}
      <Card style={{ background: T.amberDim, border: `1px solid ${T.amber}33` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Word for today</div>
        <div style={{ fontSize: 13, color: T.chalk, lineHeight: 1.6, fontStyle: "italic", marginBottom: 4 }}>"{quote.text}"</div>
        <div style={{ fontSize: 11, color: T.chalkDim }}>— {quote.ref}</div>
      </Card>

      {/* Notification nudge */}
      {!notifEnabled && (
        <Card style={{ background: T.blueDim, border: `1px solid ${T.blue}44` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Bell size={18} color={T.blue} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: T.chalk, fontWeight: 600 }}>Enable daily reminders</div>
              <div style={{ fontSize: 12, color: T.chalkDim }}>Get notified when your thesis session starts</div>
            </div>
            <button onClick={onEnableNotif} style={{ padding: "7px 12px", borderRadius: 8, background: T.blue, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", flexShrink: 0 }}>
              Enable
            </button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <StatCard label="To defense" value={daysLeft} color={daysLeft < 21 ? T.coral : T.amber} sub={DEFENSE_DATE} />
        <StatCard label="Weeks left" value={weeksLeft} color={T.amber} sub="Nov 15 target" />
        <StatCard label="Hrs logged" value={totalHrs.toFixed(1)} color={T.blue} sub="thesis sessions" />
        <StatCard label="IRB done" value={`${doneIrb}/${allIrb.length}`} color="#7f56d9" sub="tasks complete" />
      </div>

      {/* Readiness ring */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ReadinessRing pct={pct} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.chalk, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 12, color: T.chalkDim, marginBottom: 8 }}>
              {doneSections.length} of {allSections.length} sections complete · {doneTasks} tasks done
            </div>
            <ProgressBar value={pct} color={T.amber} height={6} />
          </div>
        </div>
      </Card>

      {/* RESUME THESIS — primary CTA */}
      <button
        onClick={() => navigate("today")}
        style={{
          width: "100%", padding: "18px 20px", borderRadius: 14, marginBottom: 12,
          background: `linear-gradient(135deg, ${T.amber}, #1a5c3a)`,
          color: "var(--on-primary)", border: "none", cursor: "pointer",
          fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {(() => { const d = new Date(TODAY()+"T12:00:00").getDay(); return SCHEDULE[d] ? SCHEDULE[d].slot : "Review your progress"; })()}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Resume thesis →</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            {(() => {
              const todayStr = TODAY();
              const overdue = tasks.filter((t) => t.date < todayStr && !t.done).length;
              const today = tasks.filter((t) => t.date === todayStr).length;
              if (overdue > 0) return overdue + " overdue + " + today + " today";
              return today > 0 ? today + " task" + (today !== 1 ? "s" : "") + " today" : "See your plan";
            })()}
          </div>
        </div>
        <div style={{ fontSize: 32 }}>📚</div>
      </button>

      {/* Today's schedule slot */}
      {(() => {
        const dow = new Date(todayStr + "T12:00:00").getDay();
        const slot = SCHEDULE[dow];
        return slot ? (
          <Card style={{ border: `1px solid ${T.amber}44` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Today's thesis window
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.chalk }}>{slot.slot}</div>
            <div style={{ fontSize: 12, color: T.chalkDim, marginTop: 3 }}>{slot.hours} hours · {slot.type === "deep" ? "Deep work — no interruptions" : slot.type === "work" ? "Focused work session" : "Light work — 1 hr opportunistic"}</div>
          </Card>
        ) : (
          <Card style={{ background: T.surface2 }}>
            <div style={{ fontSize: 13, color: T.chalkDim }}>
              {new Date(todayStr + "T12:00:00").getDay() === 0 ? "Sunday — rest, church, and family. No thesis today." : "No thesis block today. Class and teaching day."}
            </div>
          </Card>
        );
      })()}

      {/* Today's task */}
      {todayTask && (
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Today's task
          </div>
          <div style={{ fontSize: 13, color: T.chalk, lineHeight: 1.55 }}>{todayTask.task}</div>
          <div style={{ marginTop: 6 }}><Badge text={todayTask.phase} color={PHASE_COLOR[todayTask.phase]} /></div>
        </Card>
      )}

      {/* Funding deadline warning */}
      {DAYS_UNTIL("2026-09-01") <= 12 && !fundingStatus["fund-14"] && (
        <Card style={{ background: T.coralDim, border: `1px solid ${T.coral}44` }} onClick={() => navigate("funding")}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <AlertCircle size={15} color={T.coral} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: T.chalk }}>
              <strong>Funding deadline: September 1</strong> — {DAYS_UNTIL("2026-09-01")} days away. MSU Thesis Research Funding (~$500). Email Dr. Zheng for a letter of support today. Tap to see checklist.
            </div>
          </div>
        </Card>
      )}

      {/* IRB warning */}
      {!irbStatus["irb-approve"] && (
        <Card style={{ background: T.coralDim, border: `1px solid ${T.coral}44` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <AlertCircle size={15} color={T.coral} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: T.chalk }}>
              IRB approval not yet confirmed. Do not deploy or collect survey data before written approval arrives.
              {!irbStatus["irb-submit"] && " → Go to IRB tab to complete your Cayuse application."}
            </div>
          </div>
        </Card>
      )}

      {/* Next action */}
      {nextTask && (
        <button onClick={() => navigate("plan")} style={{ width: "100%", padding: "13px 18px", borderRadius: 12, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ textAlign: "left", lineHeight: 1.4 }}>
            {nextTask.date === todayStr ? "Now: " : `${nextTask.date}: `}
            {nextTask.task.length > 50 ? nextTask.task.slice(0, 50) + "…" : nextTask.task}
          </span>
          <ChevronRight size={18} style={{ flexShrink: 0, marginLeft: 8 }} />
        </button>
      )}

      {/* Quick nav */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {[["plan","Plan",Calendar],["chapters","Chapters",BookOpen],["irb","IRB",Shield],["analysis","R guide",BarChart2],["defense","Defense",GraduationCap],["motivation","Why",Heart]].map(([v,l,Icon]) => (
          <button key={v} onClick={() => navigate(v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 8, background: T.surface, border: `1px solid ${T.chalkFaint}`, color: T.chalk, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <Icon size={12} /> {l}
          </button>
        ))}
      </div>
    </div>
  );
}

const PHASE_COLOR = {
  IRB: "#7f56d9", Writing: T.blue, Data: T.amber,
  Analysis: T.coral, Polish: "#0f766e", Defense: T.amber,
  Funding: "#b45309", Advisor: "#0e7490",
};

/* ─── RESEARCH FUNDING CHECKLIST ─────────────────────────────────────── */
// MSU Graduate College Thesis Research Funding
// Value: ~$500 per thesis project
// Fall deadline: SEPTEMBER 1 — this is 12 days away from today (Aug 20)
// Submit as ONE PDF to the Graduate College via email
// Full info + Word application template: graduate.missouristate.edu
const FUNDING = [
  { id:"fund-urgent", phase:"⚠️ Urgent — Fall deadline: September 1", tasks:[
    { id:"fund-1", label:"Download the application Word document from graduate.missouristate.edu", note:"Search 'Thesis Research Funding' on the Graduate College site — download the Word doc template dated 08/16/2024" },
    { id:"fund-2", label:"Email Dr. Zheng TODAY to request his letter of support", note:"Give him the application and deadline — he needs at least a week. Subject: 'Thesis Research Funding — need letter of support by Aug 28'" },
    { id:"fund-3", label:"Confirm your CITI training certificates are downloaded and ready to attach", note:"The application requires all research compliance documentation — CITI certs are mandatory" },
    { id:"fund-4", label:"Confirm IRB application is submitted or in progress", note:"You must have 'progressed to the point where there is clarity in research goals and completed relevant research compliance approvals'" },
  ]},
  { id:"fund-apply", phase:"Complete the application (Aug 20–28)", tasks:[
    { id:"fund-5",  label:"Fill in project title, your name, student ID (M03617692), department, advisor name", note:"Department: Mathematics. Advisor: Dr. Songfeng Zheng" },
    { id:"fund-6",  label:"Write the research goals section — what you are studying and why", note:"Cross-sectional survey of international students. 30 questions. PHQ-2 ≥ 3 as outcome. LASSO + logistic regression. Composite risk index. First 90 app." },
    { id:"fund-7",  label:"Write the budget section — what the $500 will cover", note:"Survey hosting fees (Qualtrics license if needed), printing for IRB consent forms and recruitment flyers, any participant incentives, statistical software if required" },
    { id:"fund-8",  label:"Write the timeline — show the project will be completed this semester", note:"IRB approval Sep, survey collection Sep–Oct, data analysis Oct, writing Oct–Nov, defense Nov 15" },
    { id:"fund-9",  label:"Attach Dr. Zheng's letter of support once received" },
    { id:"fund-10", label:"Attach all CITI training completion certificates (3 certificates)", note:"Social-Behavioral-Educational, FERPA for Researchers, Research Security Basic Training" },
    { id:"fund-11", label:"Attach any other IRB or compliance documentation you have", note:"Cayuse submission confirmation, IRB approval letter if received" },
    { id:"fund-12", label:"Proofread the entire application — incomplete applications will NOT receive funding", note:"MSU is explicit: check that ALL information is included before submitting" },
  ]},
  { id:"fund-submit", phase:"Submit by September 1", tasks:[
    { id:"fund-13", label:"Combine all documents into ONE PDF file", note:"Application form + budget + timeline + Dr. Zheng letter + CITI certificates + any compliance docs — all in one PDF" },
    { id:"fund-14", label:"Email the single PDF to the Graduate College", note:"Email: graduate@missouristate.edu — confirm the address on the application form. Subject: 'Thesis Research Funding Application — Amen Engworo Edoha'" },
    { id:"fund-15", label:"Screenshot or save the sent email as confirmation you submitted before the deadline" },
    { id:"fund-16", label:"Follow up with Graduate College if no confirmation received within 5 business days" },
  ]},
  { id:"fund-after", phase:"After submission", tasks:[
    { id:"fund-17", label:"If awarded — keep all receipts for any costs covered by the grant", note:"You will likely need to provide receipts and a brief report on how funds were used" },
    { id:"fund-18", label:"If not awarded — email the Graduate College asking for feedback", note:"And apply for the Spring cycle (deadline February 1) if your research continues" },
  ]},
];

function PlanView({ tasks, onToggle, onOverride }) {
  const [editId,   setEditId]   = useState(null);
  const [editText, setEditText] = useState("");
  const todayStr = TODAY();

  const grouped = {};
  tasks.forEach((t) => {
    const d = new Date(t.date + "T12:00:00");
    const wk = Math.ceil((new Date(t.date) - new Date("2026-08-20")) / (7 * 86400000)) + 1;
    if (!grouped[wk]) grouped[wk] = [];
    grouped[wk].push(t);
  });

  const currentWeek = Math.ceil((new Date(todayStr) - new Date("2026-08-20")) / (7 * 86400000)) + 1;
  const [openWeek, setOpenWeek] = useState(currentWeek);

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.chalk, marginBottom: 4 }}>Thesis task plan</div>
      <div style={{ fontSize: 13, color: T.chalkDim, marginBottom: 14 }}>
        Aug 20 → Nov 15 · Tue 9am–1pm · Thu 10am–2pm · Sat 1pm–4pm
      </div>

      {Object.entries(grouped).map(([wk, wkTasks]) => {
        const wkNum = parseInt(wk);
        const done = wkTasks.filter((t) => t.done).length;
        const isCurrent = wkNum === currentWeek;
        const isPast = wkNum < currentWeek;
        const isOpen = openWeek === wkNum;

        return (
          <div key={wk} style={{ background: T.surface, borderRadius: 12, marginBottom: 8, border: isCurrent ? `1.5px solid ${T.amber}` : `1px solid ${T.chalkFaint}`, overflow: "hidden" }}>
            <button onClick={() => setOpenWeek(isOpen ? null : wkNum)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", textAlign: "left" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: isCurrent ? T.amber : isPast ? T.bgDeep : T.surface2, color: isCurrent ? "var(--on-primary)" : T.chalkDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {wkNum}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.chalk }}>Week {wkNum}</span>
                  {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, color: T.amber, background: T.amberDim, padding: "1px 6px", borderRadius: 99 }}>THIS WEEK</span>}
                </div>
                <ProgressBar value={(done / wkTasks.length) * 100} color={isPast && done < wkTasks.length ? T.coral : T.amber} height={4} />
              </div>
              <span style={{ fontSize: 12, color: T.chalkDim }}>{done}/{wkTasks.length}</span>
              {isOpen ? <ChevronDown size={14} color={T.chalkDim} /> : <ChevronRight size={14} color={T.chalkDim} />}
            </button>

            {isOpen && (
              <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${T.chalkFaint}` }}>
                {wkTasks.map((task) => {
                  const dow = new Date(task.date + "T12:00:00").getDay();
                  const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dow];
                  const isToday = task.date === todayStr;
                  return (
                    <div key={task.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.chalkFaint}`, opacity: task.done ? 0.5 : 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <button onClick={() => onToggle(task.id, !task.done)} style={{ background: "none", border: "none", cursor: "pointer", color: task.done ? T.amber : T.chalkDim, padding: 0, flexShrink: 0, marginTop: 2 }}>
                          {task.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </button>
                        <div style={{ flex: 1 }}>
                          {editId === task.id ? (
                            <div>
                              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 12, fontFamily: "inherit", resize: "vertical", marginBottom: 6 }} />
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => { onOverride(task.id, editText); setEditId(null); }} style={{ padding: "4px 10px", borderRadius: 6, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Save</button>
                                <button onClick={() => setEditId(null)} style={{ padding: "4px 8px", borderRadius: 6, background: "none", border: `1px solid ${T.chalkFaint}`, color: T.chalkDim, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: 11, color: isToday ? T.amber : T.chalkDim, marginBottom: 2, fontWeight: isToday ? 700 : 400 }}>
                                {dayName} {task.date} {isToday ? "← today" : ""}
                              </div>
                              <div style={{ fontSize: 13, color: T.chalk, lineHeight: 1.5, textDecoration: task.done ? "line-through" : "none" }}>
                                {task.milestone ? "🎓 " : ""}{task.task}
                              </div>
                              <div style={{ display: "flex", gap: 6, marginTop: 5, alignItems: "center" }}>
                                <Badge text={task.phase} color={PHASE_COLOR[task.phase]} />
                                {task.urgent && <Badge text="urgent" color={T.coral} />}
                                <button onClick={() => { setEditId(task.id); setEditText(task.task); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.chalkDim, padding: 0, marginLeft: 4 }}>
                                  <Edit3 size={12} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChaptersView({ chapterStatus, onUpdateStatus, chapterNotes, onUpdateNote, confettiTrigger }) {
  const [expanded, setExpanded] = useState("ch1");
  const [noteEdit, setNoteEdit] = useState({});
  const [noteInput, setNoteInput] = useState({});

  const sc = { "not-started": T.chalkDim, "in-progress": T.amber, "complete": T.blue };
  const next = { "not-started": "in-progress", "in-progress": "complete", "complete": "not-started" };
  const label = { "not-started": "Not started", "in-progress": "In progress", "complete": "Complete" };

  const allSections = CHAPTERS.flatMap((c) => c.sections);
  const doneSections = allSections.filter((s) => chapterStatus[s.id] === "complete").length;

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.chalk, marginBottom: 4 }}>Chapter tracker</div>
      <div style={{ fontSize: 13, color: T.chalkDim, marginBottom: 12 }}>Tap status icon to cycle: not started → in progress → complete</div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.chalk }}>Overall</span>
          <span style={{ fontSize: 13, color: T.chalkDim }}>{doneSections}/{allSections.length} sections</span>
        </div>
        <ProgressBar value={(doneSections / allSections.length) * 100} color={T.amber} height={8} />
        <div style={{ fontSize: 11, color: T.chalkDim, marginTop: 4 }}>
          Chapter 1 is complete ✓ — front matter is drafted ✓ — start here with Chapter 2
        </div>
      </Card>

      {CHAPTERS.map((chapter) => {
        const done = chapter.sections.filter((s) => chapterStatus[s.id] === "complete").length;
        const total = chapter.sections.length;
        const p = Math.round((done / total) * 100);
        const isOpen = expanded === chapter.id;
        const Icon = chapter.icon;

        return (
          <div key={chapter.id} style={{ background: T.surface, borderRadius: 12, marginBottom: 8, border: `1px solid ${T.chalkFaint}`, overflow: "hidden" }}>
            <button onClick={() => setExpanded(isOpen ? null : chapter.id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", textAlign: "left" }}>
              <Icon size={17} color={T.amber} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 4 }}>{chapter.label}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <ProgressBar value={p} color={T.amber} height={4} />
                  <span style={{ fontSize: 11, color: T.chalkDim, flexShrink: 0 }}>{done}/{total}</span>
                </div>
              </div>
              {isOpen ? <ChevronDown size={14} color={T.chalkDim} /> : <ChevronRight size={14} color={T.chalkDim} />}
            </button>

            {isOpen && (
              <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${T.chalkFaint}` }}>
                {chapter.sections.map((section) => {
                  const status = chapterStatus[section.id] || "not-started";
                  const color = sc[status];
                  const isEditingNote = noteEdit[section.id];
                  return (
                    <div key={section.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.chalkFaint}` }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <button onClick={() => { const n = next[status]; onUpdateStatus(section.id, n); if (n === "complete") confettiTrigger(); }} style={{ background: "none", border: "none", cursor: "pointer", color, padding: 0, flexShrink: 0, marginTop: 2 }}>
                          {status === "complete" ? <CheckCircle2 size={17} /> : status === "in-progress" ? <Target size={17} /> : <Circle size={17} />}
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: T.chalk }}>{section.label}</div>
                          <div style={{ fontSize: 11, color, marginTop: 1, textTransform: "capitalize" }}>{label[status]}</div>
                          {isEditingNote ? (
                            <div style={{ marginTop: 6 }}>
                              <textarea value={noteInput[section.id] || ""} onChange={(e) => setNoteInput((n) => ({ ...n, [section.id]: e.target.value }))} placeholder="Add a note..." rows={2} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
                              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                                <button onClick={() => { onUpdateNote(section.id, noteInput[section.id] || ""); setNoteEdit((n) => ({ ...n, [section.id]: false })); }} style={{ padding: "4px 10px", borderRadius: 6, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Save</button>
                                <button onClick={() => setNoteEdit((n) => ({ ...n, [section.id]: false }))} style={{ padding: "4px 8px", borderRadius: 6, background: "none", border: `1px solid ${T.chalkFaint}`, color: T.chalkDim, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginTop: 4 }}>
                              {chapterNotes[section.id] && <div style={{ fontSize: 11, color: T.chalkDim, fontStyle: "italic", marginBottom: 3 }}>{chapterNotes[section.id]}</div>}
                              <button onClick={() => { setNoteEdit((n) => ({ ...n, [section.id]: true })); setNoteInput((n) => ({ ...n, [section.id]: chapterNotes[section.id] || "" })); }} style={{ fontSize: 11, color: T.chalkDim, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                                <Edit3 size={11} /> {chapterNotes[section.id] ? "Edit note" : "Add note"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IrbView({ irbStatus, onToggle }) {
  const [expanded, setExpanded] = useState("pre");
  const allTasks = IRB.flatMap((s) => s.tasks);
  const doneCount = allTasks.filter((t) => irbStatus[t.id]).length;
  const approved = irbStatus["irb-approve"];

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.chalk, marginBottom: 4 }}>IRB application</div>
      <div style={{ fontSize: 12, color: T.chalkDim, marginBottom: 8 }}>msu.app.cayuse.com · FWA 00004733 · irb@missouristate.edu · 417-836-3737</div>

      {approved ? (
        <Card style={{ background: T.amberDim, border: `1px solid ${T.amber}44`, marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: T.chalk, fontWeight: 600 }}>✓ IRB approval confirmed — cleared to collect data</div>
        </Card>
      ) : (
        <Card style={{ background: T.coralDim, border: `1px solid ${T.coral}44`, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <AlertCircle size={15} color={T.coral} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: T.chalk }}>⚠️ Do NOT collect survey data before written IRB approval arrives in your inbox.</div>
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.chalk }}>Progress</span>
          <span style={{ fontSize: 13, color: T.chalkDim }}>{doneCount}/{allTasks.length}</span>
        </div>
        <ProgressBar value={(doneCount / allTasks.length) * 100} color="#7f56d9" height={6} />
      </Card>

      {IRB.map((step) => {
        const done = step.tasks.filter((t) => irbStatus[t.id]).length;
        const isOpen = expanded === step.id;
        return (
          <div key={step.id} style={{ background: T.surface, borderRadius: 12, marginBottom: 8, border: `1px solid ${T.chalkFaint}`, overflow: "hidden" }}>
            <button onClick={() => setExpanded(isOpen ? null : step.id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", textAlign: "left" }}>
              <Shield size={16} color="#7f56d9" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 4 }}>{step.phase}</div>
                <ProgressBar value={(done / step.tasks.length) * 100} color="#7f56d9" height={4} />
              </div>
              <span style={{ fontSize: 12, color: T.chalkDim }}>{done}/{step.tasks.length}</span>
              {isOpen ? <ChevronDown size={14} color={T.chalkDim} /> : <ChevronRight size={14} color={T.chalkDim} />}
            </button>
            {isOpen && (
              <div style={{ padding: "0 14px 10px", borderTop: `1px solid ${T.chalkFaint}` }}>
                {step.tasks.map((task) => {
                  const done = irbStatus[task.id];
                  return (
                    <div key={task.id} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.chalkFaint}`, opacity: done ? 0.5 : 1 }}>
                      <button onClick={() => onToggle(task.id, !done)} style={{ background: "none", border: "none", cursor: "pointer", color: done ? "#7f56d9" : T.chalkDim, padding: 0, flexShrink: 0, marginTop: 2 }}>
                        {done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                      </button>
                      <div>
                        <div style={{ fontSize: 13, color: T.chalk, textDecoration: done ? "line-through" : "none", lineHeight: 1.4 }}>{task.label}</div>
                        {task.note && <div style={{ fontSize: 11, color: T.chalkDim, marginTop: 2 }}>{task.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const R_STEPS = [
  { id:"r1", step:1, title:"Install packages and load data", done_key:"r-1",
    code:`install.packages(c("tidyverse","glmnet","pROC","psych","car"))
library(tidyverse); library(glmnet); library(pROC); library(psych)
data <- read_csv("survey_data.csv")
glimpse(data)` },
  { id:"r2", step:2, title:"Clean and score all scales", done_key:"r-2",
    code:`data <- data %>% mutate(
  phq2 = Q6 + Q7, gad2 = Q8 + Q9,
  ucla = Q10 + Q11, assis = Q12+Q13+Q14+Q15+Q16+Q17,
  fin = Q18+Q19+Q20,
  Q22r = 6 - Q22,  # REVERSE SCORE
  faith = Q21 + Q22r, visa = Q23+Q24,
  house=Q25, help=Q26+Q27, food=Q28, comm=Q29+Q30,
  at_risk = as.integer(phq2 >= 3)
)
cat("At risk:", sum(data$at_risk), "of", nrow(data))` },
  { id:"r3", step:3, title:"Descriptives and bivariate correlations", done_key:"r-3",
    code:`describe(data %>% select(phq2,gad2,ucla,assis,fin,faith,visa,house,help,food,comm))
predictors <- c("ucla","assis","fin","faith","visa","house","help","food","comm")
cor(data[,predictors], data$at_risk, use="complete.obs") %>% round(3)
table(data$phq2)` },
  { id:"r4", step:4, title:"Logistic regression + VIF check", done_key:"r-4",
    code:`model <- glm(at_risk ~ ucla+assis+fin+faith+visa+house+help+food+comm,
             data=data, family=binomial)
summary(model)
exp(cbind(OR=coef(model), confint(model)))
car::vif(model)  # check for VIF > 10` },
  { id:"r5", step:5, title:"LASSO variable selection", done_key:"r-5",
    code:`x <- model.matrix(at_risk ~ ucla+assis+fin+faith+visa+house+help+food+comm, data)[,-1]
y <- data$at_risk
set.seed(42)
cv_lasso <- cv.glmnet(x, y, family="binomial", alpha=1, nfolds=10)
plot(cv_lasso)
cat("Best lambda:", cv_lasso$lambda.min)
coef(cv_lasso, s="lambda.min")` },
  { id:"r6", step:6, title:"Composite risk index + ROC (AUC target ≥ 0.75)", done_key:"r-6",
    code:`set.seed(42)
train_idx <- sample(nrow(data), 0.7*nrow(data))
x_tr <- x[train_idx,]; x_ho <- x[-train_idx,]
cv_tr <- cv.glmnet(x_tr, data$at_risk[train_idx], family="binomial", alpha=1)
preds <- predict(cv_tr, newx=x_ho, s="lambda.min", type="response")
roc_obj <- roc(data$at_risk[-train_idx], as.vector(preds))
cat("AUC:", round(auc(roc_obj),3))
ci.auc(roc_obj)
plot(roc_obj, main=paste("ROC — AUC =", round(auc(roc_obj),3)))` },
];

function AnalysisView({ rStatus, onToggleStep, rNotes, onUpdateNote, aucValue, onSetAuc }) {
  const [expanded, setExpanded] = useState("r1");
  const [noteEdit, setNoteEdit] = useState({});
  const [noteInput, setNoteInput] = useState({});
  const [aucInput, setAucInput] = useState(String(aucValue || ""));
  const [copied, setCopied] = useState(null);

  const doneSteps = R_STEPS.filter((s) => rStatus[s.done_key]).length;
  const aucNum = parseFloat(aucValue);
  const aucMet = aucNum >= 0.75;

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.chalk, marginBottom: 4 }}>R analysis guide</div>
      <div style={{ fontSize: 13, color: T.chalkDim, marginBottom: 14 }}>6 steps · Copy-paste code · Check each step when done</div>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.chalk, marginBottom: 8 }}>AUC tracker — H4 target: ≥ 0.75</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" value={aucInput} onChange={(e) => setAucInput(e.target.value)} placeholder="0.000" step="0.001" min={0} max={1} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 16, fontFamily: "monospace", fontWeight: 700 }} />
          <button onClick={() => onSetAuc(parseFloat(aucInput) || null)} style={{ padding: "8px 14px", borderRadius: 8, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Save</button>
        </div>
        {aucValue && <div style={{ marginTop: 8, fontSize: 13, color: aucMet ? T.blue : T.coral, fontWeight: 600 }}>AUC = {aucValue} — {aucMet ? "✓ H4 confirmed!" : "✗ Below 0.75 — check model"}</div>}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.chalk }}>Progress</span>
          <span style={{ fontSize: 12, color: T.chalkDim }}>{doneSteps}/{R_STEPS.length} steps</span>
        </div>
        <ProgressBar value={(doneSteps / R_STEPS.length) * 100} color={T.blue} height={6} />
      </Card>

      {R_STEPS.map((step) => {
        const done = rStatus[step.done_key];
        const isOpen = expanded === step.id;
        return (
          <div key={step.id} style={{ background: T.surface, borderRadius: 12, marginBottom: 8, border: `1px solid ${T.chalkFaint}`, overflow: "hidden" }}>
            <button onClick={() => setExpanded(isOpen ? null : step.id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", textAlign: "left" }}>
              <button onClick={(e) => { e.stopPropagation(); onToggleStep(step.done_key, !done); }} style={{ background: "none", border: "none", cursor: "pointer", color: done ? T.blue : T.chalkDim, padding: 0, flexShrink: 0 }}>
                {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.chalkDim }}>Step {step.step}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk }}>{step.title}</div>
              </div>
              {isOpen ? <ChevronDown size={14} color={T.chalkDim} /> : <ChevronRight size={14} color={T.chalkDim} />}
            </button>
            {isOpen && (
              <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${T.chalkFaint}` }}>
                <div style={{ position: "relative", marginTop: 10 }}>
                  <pre style={{ background: T.bgDeep, borderRadius: 8, padding: "12px", fontSize: 12, fontFamily: "monospace", color: T.chalk, overflowX: "auto", lineHeight: 1.6, margin: 0, border: `1px solid ${T.chalkFaint}` }}>{step.code}</pre>
                  <button onClick={() => { navigator.clipboard?.writeText(step.code); setCopied(step.id); setTimeout(() => setCopied(null), 2000); }} style={{ position: "absolute", top: 8, right: 8, padding: "4px 8px", borderRadius: 6, background: copied === step.id ? T.blue : T.surface, color: copied === step.id ? "var(--on-primary)" : T.chalkDim, border: `1px solid ${T.chalkFaint}`, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                    {copied === step.id ? <Check size={11} /> : <Copy size={11} />} {copied === step.id ? "Copied" : "Copy"}
                  </button>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.chalkDim, marginBottom: 5 }}>Results notes</div>
                  {noteEdit[step.id] ? (
                    <div>
                      <textarea value={noteInput[step.id] || ""} onChange={(e) => setNoteInput((n) => ({ ...n, [step.id]: e.target.value }))} placeholder="Paste findings here..." rows={3} style={{ width: "100%", padding: "7px 9px", borderRadius: 6, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <button onClick={() => { onUpdateNote(step.id, noteInput[step.id] || ""); setNoteEdit((n) => ({ ...n, [step.id]: false })); }} style={{ padding: "5px 12px", borderRadius: 6, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Save</button>
                        <button onClick={() => setNoteEdit((n) => ({ ...n, [step.id]: false }))} style={{ padding: "5px 10px", borderRadius: 6, background: "none", border: `1px solid ${T.chalkFaint}`, color: T.chalkDim, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {rNotes[step.id] && <div style={{ fontSize: 12, color: T.chalk, background: T.bgDeep, borderRadius: 6, padding: "8px 10px", marginBottom: 4, lineHeight: 1.5 }}>{rNotes[step.id]}</div>}
                      <button onClick={() => { setNoteEdit((n) => ({ ...n, [step.id]: true })); setNoteInput((n) => ({ ...n, [step.id]: rNotes[step.id] || "" })); }} style={{ fontSize: 11, color: T.chalkDim, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                        <Edit3 size={11} /> {rNotes[step.id] ? "Edit" : "Add results"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SessionsView({ sessions, onAdd, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [date, setDate]     = useState(TODAY());
  const [dur,  setDur]      = useState(60);
  const [chap, setChap]     = useState("ch2");
  const [notes, setNotes]   = useState("");

  const totalHrs = sessions.reduce((s, a) => s + (a.duration || 0), 0) / 60;
  const chapOpts = [
    ["ch1","Ch1 — Introduction"],["ch2","Ch2 — Literature Review"],
    ["ch3","Ch3 — Methodology"],["ch4","Ch4 — Results"],
    ["ch5","Ch5 — Discussion"],["irb","IRB application"],
    ["r","R analysis"],["def","Defense prep"],["front","Front matter"],["back","Back matter"],
  ];

  const submit = () => {
    if (!notes.trim()) return;
    onAdd({ id: `s-${Date.now()}`, date, duration: dur, chapter: chap, notes });
    setNotes(""); setAdding(false);
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: T.chalk }}>Sessions</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.amber }}>{totalHrs.toFixed(1)} hrs total</div>
      </div>
      <div style={{ fontSize: 13, color: T.chalkDim, marginBottom: 14 }}>Log every session — even 30 minutes counts.</div>

      <PomodoroTimer />

      {!adding ? (
        <button onClick={() => setAdding(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 8, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", marginBottom: 14, marginTop: 4 }}>
          <Plus size={15} /> Log a session
        </button>
      ) : (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 11, color: T.chalkDim, display: "block", marginBottom: 3 }}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 13, fontFamily: "inherit" }} />
            </div>
            <div style={{ flex: 1, minWidth: 80 }}>
              <label style={{ fontSize: 11, color: T.chalkDim, display: "block", marginBottom: 3 }}>Minutes</label>
              <input type="number" value={dur} onChange={(e) => setDur(Number(e.target.value))} min={15} max={300} step={15} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 13, fontFamily: "inherit" }} />
            </div>
          </div>
          <select value={chap} onChange={(e) => setChap(e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 13, fontFamily: "inherit", marginBottom: 8 }}>
            {chapOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you work on?" rows={2} style={{ width: "100%", padding: "7px 9px", borderRadius: 6, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 13, fontFamily: "inherit", resize: "vertical", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={submit} style={{ padding: "7px 14px", borderRadius: 8, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Save</button>
            <button onClick={() => setAdding(false)} style={{ padding: "7px 12px", borderRadius: 8, background: "none", border: `1px solid ${T.chalkFaint}`, color: T.chalkDim, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        </Card>
      )}

      {[...sessions].reverse().map((s) => {
        const ch = chapOpts.find(([v]) => v === s.chapter);
        return (
          <Card key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: T.chalkDim }}>{s.date}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>{s.duration}min</span>
                <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.chalkDim, padding: 0 }}><Trash2 size={13} /></button>
              </div>
            </div>
            {ch && <div style={{ fontSize: 11, color: T.amber, marginBottom: 3 }}>{ch[1]}</div>}
            <div style={{ fontSize: 13, color: T.chalk, lineHeight: 1.5 }}>{s.notes}</div>
          </Card>
        );
      })}
    </div>
  );
}

function DefenseView({ defenseAnswers, onUpdateAnswer, defenseDone, onToggleDefense, practiceLog, onAddPractice }) {
  const [expanded, setExpanded] = useState(null);
  const [ansEdit, setAnsEdit]   = useState({});
  const [ansInput, setAnsInput] = useState({});
  const [timerSecs, setTimerSecs] = useState(0);
  const [timerRun, setTimerRun]   = useState(false);
  const iv = useRef(null);

  useEffect(() => {
    if (timerRun) iv.current = setInterval(() => setTimerSecs((s) => s + 1), 1000);
    else clearInterval(iv.current);
    return () => clearInterval(iv.current);
  }, [timerRun]);

  const mm = String(Math.floor(timerSecs / 60)).padStart(2, "0");
  const ss = String(timerSecs % 60).padStart(2, "0");

  const QUESTIONS = [
    "Why did you choose a cross-sectional design rather than a longitudinal one?",
    "How do you justify the sample size given 13 predictor variables?",
    "What steps did you take to address self-report response bias?",
    "Why LASSO instead of stepwise regression for variable selection?",
    "How do you interpret your AUC value practically for university administrators?",
    "Your original 10 items are not independently validated — how does that affect your conclusions?",
    "Did your data support H1 — that visa anxiety rivals acculturative stress as a top predictor?",
    "How does faith community membership function as a protective factor in your model?",
    "What are the practical implications of your composite risk index for MSU?",
    "How does First 90 connect to your statistical findings, and what is your scale-up plan?",
  ];

  const SLIDES = [
    "Title — name, thesis title, advisor, date","Introduction — problem + 1,126,690 statistic",
    "Research questions and H1 through H4","Study design and participants (450+ target, EPV rule)",
    "Survey instrument — 30 questions, 5 validated scales","Results: Table 1 demographics + Table 2 descriptives",
    "Results: Logistic regression — odds ratios + CIs","Results: LASSO selected predictors",
    "Results: Composite risk index + ROC curve","Discussion — H1 through H4 addressed",
    "Limitations — 7 numbered","First 90 app — applied output",
    "Conclusion + future research","References","Thank you + questions",
  ];

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.chalk, marginBottom: 14 }}>Defense prep</div>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 8 }}>Practice timer</div>
        <div style={{ fontSize: 38, fontWeight: 700, color: T.amber, fontFamily: "monospace", textAlign: "center", marginBottom: 8 }}>{mm}:{ss}</div>
        <div style={{ fontSize: 11, color: T.chalkDim, textAlign: "center", marginBottom: 10 }}>Target: 20–25 minutes</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {!timerRun ? (
            <button onClick={() => setTimerRun(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
              <Play size={14} /> Start run-through
            </button>
          ) : (
            <button onClick={() => { setTimerRun(false); if (timerSecs > 60) onAddPractice({ id: `p-${Date.now()}`, date: TODAY(), duration: Math.round(timerSecs / 60) }); setTimerSecs(0); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, background: T.coral, color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
              <Pause size={14} /> Stop + log
            </button>
          )}
        </div>
        {practiceLog.length > 0 && (
          <div style={{ fontSize: 12, color: T.chalkDim, textAlign: "center", marginTop: 8 }}>
            {practiceLog.length} runs · Avg {Math.round(practiceLog.reduce((s, p) => s + p.duration, 0) / practiceLog.length)} min
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 10 }}>15 defense slides</div>
        {SLIDES.map((slide, i) => {
          const key = `slide-${i}`, done = defenseDone[key];
          return (
            <div key={key} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.chalkFaint}` }}>
              <button onClick={() => onToggleDefense(key, !done)} style={{ background: "none", border: "none", cursor: "pointer", color: done ? T.blue : T.chalkDim, padding: 0, flexShrink: 0 }}>
                {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>
              <span style={{ fontSize: 13, color: T.chalk, textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1 }}>{slide}</span>
            </div>
          );
        })}
      </Card>

      <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 8 }}>10 committee questions</div>
      {QUESTIONS.map((q, i) => {
        const key = `q-${i}`, isOpen = expanded === key;
        return (
          <div key={key} style={{ background: T.surface, borderRadius: 10, marginBottom: 6, border: `1px solid ${T.chalkFaint}`, overflow: "hidden" }}>
            <button onClick={() => setExpanded(isOpen ? null : key)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.amber, flexShrink: 0, marginTop: 1 }}>Q{i + 1}</span>
              <span style={{ fontSize: 13, color: T.chalk, flex: 1, lineHeight: 1.45 }}>{q}</span>
              {isOpen ? <ChevronDown size={13} color={T.chalkDim} style={{ flexShrink: 0 }} /> : <ChevronRight size={13} color={T.chalkDim} style={{ flexShrink: 0 }} />}
            </button>
            {isOpen && (
              <div style={{ padding: "0 12px 10px", borderTop: `1px solid ${T.chalkFaint}` }}>
                {ansEdit[key] ? (
                  <div style={{ marginTop: 8 }}>
                    <textarea value={ansInput[key] || ""} onChange={(e) => setAnsInput((a) => ({ ...a, [key]: e.target.value }))} placeholder="Draft your answer..." rows={3} style={{ width: "100%", padding: "7px 9px", borderRadius: 6, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 13, fontFamily: "inherit", resize: "vertical", marginBottom: 6 }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { onUpdateAnswer(key, ansInput[key] || ""); setAnsEdit((a) => ({ ...a, [key]: false })); }} style={{ padding: "5px 12px", borderRadius: 6, background: T.amber, color: "var(--on-primary)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Save</button>
                      <button onClick={() => setAnsEdit((a) => ({ ...a, [key]: false }))} style={{ padding: "5px 10px", borderRadius: 6, background: "none", border: `1px solid ${T.chalkFaint}`, color: T.chalkDim, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    {defenseAnswers[key] ? <div style={{ fontSize: 13, color: T.chalk, lineHeight: 1.55, background: T.bgDeep, borderRadius: 6, padding: "8px 10px", marginBottom: 6 }}>{defenseAnswers[key]}</div> : <div style={{ fontSize: 12, color: T.chalkDim, fontStyle: "italic", marginBottom: 6 }}>No answer drafted yet.</div>}
                    <button onClick={() => { setAnsEdit((a) => ({ ...a, [key]: true })); setAnsInput((a) => ({ ...a, [key]: defenseAnswers[key] || "" })); }} style={{ fontSize: 11, color: T.chalkDim, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                      <Edit3 size={11} /> {defenseAnswers[key] ? "Edit answer" : "Draft answer"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FundingView({ fundingStatus, onToggle }) {
  const [expanded, setExpanded] = useState("fund-urgent");
  const allTasks  = FUNDING.flatMap((s) => s.tasks);
  const doneCount = allTasks.filter((t) => fundingStatus[t.id]).length;
  const daysToDeadline = DAYS_UNTIL("2026-09-01");

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.chalk, marginBottom: 4 }}>Research funding</div>
      <div style={{ fontSize: 13, color: T.chalkDim, marginBottom: 8 }}>
        MSU Graduate College — Thesis Research Funding · ~$500 award
      </div>

      {/* Urgent deadline banner */}
      <Card style={{ background: T.coralDim, border: `1px solid ${T.coral}55`, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertCircle size={18} color={T.coral} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.chalk, marginBottom: 4 }}>
              Fall deadline: September 1 — {daysToDeadline} days away
            </div>
            <div style={{ fontSize: 12, color: T.chalk, lineHeight: 1.6 }}>
              Submit ONE PDF to the Graduate College by email. Incomplete applications will not receive funding. You need your CITI certificates attached — start those today.
            </div>
          </div>
        </div>
      </Card>

      {/* Key facts */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.chalk, marginBottom: 8 }}>Key facts</div>
        {[
          ["Award value", "~$500 per thesis project"],
          ["Fall deadline", "September 1, 2026"],
          ["Format", "One PDF emailed to the Graduate College"],
          ["Eligibility", "Must have clarity in research goals + research compliance in progress"],
          ["Application template", "Word doc at graduate.missouristate.edu — search 'Thesis Research Funding'"],
          ["Required attachments", "Application form, budget, timeline, advisor letter, CITI certificates, IRB docs"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 12, borderBottom: `1px solid ${T.chalkFaint}` }}>
            <span style={{ color: T.chalk, fontWeight: 600, minWidth: 130, flexShrink: 0 }}>{k}</span>
            <span style={{ color: T.chalkDim }}>{v}</span>
          </div>
        ))}
      </Card>

      {/* Progress */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.chalk }}>Application progress</span>
          <span style={{ fontSize: 13, color: T.chalkDim }}>{doneCount}/{allTasks.length} tasks</span>
        </div>
        <ProgressBar value={(doneCount / allTasks.length) * 100} color="#b45309" height={6} />
      </Card>

      {FUNDING.map((step) => {
        const done  = step.tasks.filter((t) => fundingStatus[t.id]).length;
        const isOpen = expanded === step.id;
        const isUrgent = step.id === "fund-urgent";
        return (
          <div key={step.id} style={{ background: T.surface, borderRadius: 12, marginBottom: 8, border: isUrgent ? `1.5px solid ${T.coral}` : `1px solid ${T.chalkFaint}`, overflow: "hidden" }}>
            <button onClick={() => setExpanded(isOpen ? null : step.id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", textAlign: "left" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: isUrgent ? T.coral : "#b45309", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 4 }}>{step.phase}</div>
                <ProgressBar value={(done / step.tasks.length) * 100} color={isUrgent ? T.coral : "#b45309"} height={4} />
              </div>
              <span style={{ fontSize: 12, color: T.chalkDim }}>{done}/{step.tasks.length}</span>
              {isOpen ? <ChevronDown size={14} color={T.chalkDim} /> : <ChevronRight size={14} color={T.chalkDim} />}
            </button>
            {isOpen && (
              <div style={{ padding: "0 14px 10px", borderTop: `1px solid ${T.chalkFaint}` }}>
                {step.tasks.map((task) => {
                  const done = fundingStatus[task.id];
                  return (
                    <div key={task.id} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.chalkFaint}`, opacity: done ? 0.5 : 1 }}>
                      <button onClick={() => onToggle(task.id, !done)} style={{ background: "none", border: "none", cursor: "pointer", color: done ? "#b45309" : T.chalkDim, padding: 0, flexShrink: 0, marginTop: 2 }}>
                        {done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                      </button>
                      <div>
                        <div style={{ fontSize: 13, color: T.chalk, textDecoration: done ? "line-through" : "none", lineHeight: 1.45 }}>{task.label}</div>
                        {task.note && <div style={{ fontSize: 11, color: T.chalkDim, marginTop: 2 }}>{task.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


/* ─── SURVEY VIEW ────────────────────────────────────────────────────────
   Tabs: QR (live, points to app survey tab) | In-App Form | Data Table
   IRB IS APPROVED — survey is fully live.
──────────────────────────────────────────────────────────────────────── */
function SurveyView({ responses, onAddResponse, onDeleteResponse, appUrl, onSetAppUrl }) {
  const [tab, setTab]             = useState("qr");
  const [form, setForm]           = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors]       = useState({});
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [urlInput, setUrlInput]   = useState(appUrl || "");

  const sections    = [...new Set(SURVEY_FIELDS.map((f) => f.section))];
  const totalCount  = responses.length;
  const atRiskCount = responses.filter((r) => scorePHQ2(r) >= 3).length;
  const epvNum      = totalCount > 0 ? (totalCount * 0.75 * 0.30) / 13 : 0;
  const epv         = epvNum.toFixed(1);
  const epvColor    = epvNum >= 10 ? T.blue : epvNum >= 5 ? T.amber : T.coral;

  // QR points to the standalone /survey page — clean, no nav, just the survey
  const surveyDeepLink = appUrl ? appUrl.replace(/\/+$/, "") + "/survey.html" : "";

  const validate = (data) => {
    const errs = {};
    SURVEY_FIELDS.forEach((f) => { if (f.required && !data[f.id]) errs[f.id] = "Required"; });
    return errs;
  };

  const submitResponse = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); window.scrollTo({top:0,behavior:"smooth"}); return; }
    setSubmitting(true);
    await onAddResponse({ ...form, id: `resp-${Date.now()}`, timestamp: new Date().toISOString(), source: "in-app" });
    setForm({});
    setSubmitting(false);
    setSubmitted(true);
    window.scrollTo({top:0,behavior:"smooth"});
    setTimeout(() => setSubmitted(false), 5000);
  };

  const submitManual = async () => {
    await onAddResponse({ ...manualForm, id: `resp-manual-${Date.now()}`, timestamp: new Date().toISOString(), source: "manual" });
    setManualForm({});
    setManualOpen(false);
  };

  const exportCSV = () => {
    const headers = ["id","timestamp","source",...SURVEY_FIELDS.map((f) => f.id)].join(",");
    const rows = responses.map((r) =>
      ["id","timestamp","source",...SURVEY_FIELDS.map((f) => f.id)].map((k) => JSON.stringify(r[k] ?? "")).join(",")
    );
    const blob = new Blob([[headers,...rows].join("\n")], {type:"text/csv"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `thesis_responses_${TODAY()}.csv`; a.click();
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(surveyDeepLink || appUrl);
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.chalk, marginBottom: 2 }}>Survey</div>
      <div style={{ fontSize: 13, color: T.chalkDim, marginBottom: 14 }}>30 questions · 6–8 minutes · Anonymous · IRB approved ✓</div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:T.surface, borderRadius:99, padding:4, marginBottom:16, border:`1px solid ${T.chalkFaint}` }}>
        {[["qr","QR Code"],["form","Take Survey"],["data","Data Table"]].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:"7px 0", borderRadius:99, fontSize:12, fontWeight:tab===t?600:400, background:tab===t?T.amber:"none", color:tab===t?"var(--on-primary)":T.chalkDim, border:"none", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
        ))}
      </div>

      {/* ── QR TAB ─────────────────────────────────────────────────────── */}
      {tab === "qr" && (
        <div>
          {/* IRB approved banner */}
          <Card style={{ background:T.amberDim, border:`1px solid ${T.amber}55`, marginBottom:12 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <CheckCircle2 size={18} color={T.amber} style={{ flexShrink:0 }} />
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:T.chalk }}>IRB approved — survey is live</div>
                <div style={{ fontSize:12, color:T.chalkDim }}>You are cleared to collect data. Share the QR code below.</div>
              </div>
            </div>
          </Card>

          {/* QR display */}
          <Card style={{ textAlign:"center", padding:"28px 20px" }}>
            <div style={{ fontSize:16, fontWeight:700, color:T.chalk, marginBottom:6 }}>
              Scan to take the survey
            </div>
            <div style={{ fontSize:12, color:T.chalkDim, marginBottom:20 }}>
              International Student Wellbeing Study · Missouri State University
            </div>

            {surveyDeepLink ? (
              <>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=ffffff&color=1c2a22&data=${encodeURIComponent(surveyDeepLink)}`}
                  alt="Survey QR code"
                  style={{ width:240, height:240, borderRadius:12, marginBottom:16, border:`4px solid ${T.amber}` }}
                />
                <div style={{ fontSize:11, color:T.chalkDim, marginBottom:14, wordBreak:"break-all", maxWidth:280, margin:"0 auto 14px" }}>
                  {surveyDeepLink}
                </div>
                <button onClick={copyLink} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:8, background:copiedLink?T.blue:T.amber, color:"var(--on-primary)", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>
                  {copiedLink ? <><Check size={14}/> Link copied!</> : <><Copy size={14}/> Copy survey link</>}
                </button>
              </>
            ) : (
              <>
                <div style={{ width:240, height:240, borderRadius:12, background:T.bgDeep, border:`2px dashed ${T.chalkFaint}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:13, color:T.chalkDim, textAlign:"center", padding:20, lineHeight:1.6 }}>
                  Paste your deployed app URL below and the QR code will appear here instantly
                </div>
              </>
            )}
          </Card>

          {/* App URL input */}
          <Card>
            <div style={{ fontSize:12, fontWeight:600, color:T.chalk, marginBottom:6 }}>Your deployed app URL</div>
            <div style={{ fontSize:11, color:T.chalkDim, marginBottom:8 }}>
              Paste your Netlify URL (e.g. https://my-thesis.netlify.app). The QR code will point participants directly to the survey form.
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input
                type="url" value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://your-app.netlify.app"
                style={{ flex:1, padding:"7px 10px", borderRadius:8, border:`1px solid ${T.chalkFaint}`, background:T.bgDeep, color:T.chalk, fontSize:13, fontFamily:"inherit" }}
              />
              <button onClick={() => onSetAppUrl(urlInput)} style={{ padding:"7px 14px", borderRadius:8, background:T.amber, color:"var(--on-primary)", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>
                Save
              </button>
            </div>
          </Card>

          {/* Response count */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <StatCard label="Responses" value={totalCount} color={T.amber} sub="total collected" />
            <StatCard label="At risk" value={atRiskCount} color={T.coral} sub="PHQ-2 ≥ 3" />
            <StatCard label="EPV" value={epv} color={epvColor} sub="÷ 13 predictors" />
          </div>
        </div>
      )}

      {/* ── SURVEY FORM TAB ─────────────────────────────────────────────── */}
      {tab === "form" && (
        <div>
          {submitted && (
            <Card style={{ background:T.amberDim, border:`1px solid ${T.amber}44`, marginBottom:12 }}>
              <div style={{ fontSize:15, fontWeight:700, color:T.chalk, marginBottom:4 }}>✓ Response saved — thank you!</div>
              <div style={{ fontSize:12, color:T.chalkDim }}>Your response has been recorded anonymously. You can close this page.</div>
            </Card>
          )}

          {Object.keys(errors).length > 0 && (
            <Card style={{ background:T.coralDim, border:`1px solid ${T.coral}44`, marginBottom:12 }}>
              <div style={{ fontSize:13, color:T.chalk }}>Please answer all required questions before submitting.</div>
            </Card>
          )}

          {/* Consent */}
          <Card style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Informed Consent</div>
            <div style={{ fontSize:12, color:T.chalkDim, lineHeight:1.7 }}>
              This survey is part of an IRB-approved research study (Missouri State University, FWA 00004733) examining factors that affect the wellbeing of international students in the United States. Participation is completely <strong>voluntary and anonymous</strong>. No names, email addresses, or identifying information are collected. You may stop at any time without any consequence to your academic standing or immigration status.
              <br/><br/>
              PI: Amen Engworo Edoha · Faculty Supervisor: Dr. Songfeng Zheng · Missouri State University
            </div>
          </Card>

          {/* Questions by section */}
          {sections.map((section) => {
            const fields = SURVEY_FIELDS.filter((f) => f.section === section);
            const sectionScale = fields[0]?.scale || "";
            return (
              <div key={section} style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>{section}</div>
                {sectionScale && <div style={{ fontSize:11, color:T.chalkDim, marginBottom:10 }}>{sectionScale}</div>}
                {fields.map((field) => {
                  const opts = getOpts(field);
                  const hasErr = errors[field.id];
                  return (
                    <div key={field.id} style={{ marginBottom:14, padding:"12px 14px", borderRadius:10, background:hasErr?T.coralDim:T.bgDeep, border:`1px solid ${hasErr?T.coral:T.chalkFaint}` }}>
                      <div style={{ fontSize:13, color:T.chalk, lineHeight:1.5, marginBottom:8, fontWeight:500 }}>
                        {field.id.toUpperCase()}. {field.label}
                        {field.required && <span style={{ color:T.coral }}> *</span>}
                        {field.reverse && <span style={{ fontSize:10, color:T.chalkDim, marginLeft:4 }}>(reverse scored)</span>}
                      </div>
                      {field.type === "text" ? (
                        <input
                          type="text"
                          value={form[field.id] || ""}
                          onChange={(e) => { setForm((f) => ({...f,[field.id]:e.target.value})); setErrors((e) => ({...e,[field.id]:null})); }}
                          placeholder="Type your answer..."
                          style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:`1px solid ${T.chalkFaint}`, background:T.surface, color:T.chalk, fontSize:13, fontFamily:"inherit" }}
                        />
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {opts.map((opt) => (
                            <label key={opt} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"8px 12px", borderRadius:8, background:form[field.id]===opt?T.amber+"22":T.surface, border:`1px solid ${form[field.id]===opt?T.amber+"66":T.chalkFaint}`, fontSize:13, color:T.chalk, transition:"background 0.15s" }}>
                              <input
                                type="radio"
                                name={field.id}
                                value={opt}
                                checked={form[field.id] === opt}
                                onChange={() => { setForm((f) => ({...f,[field.id]:opt})); setErrors((e) => ({...e,[field.id]:null})); }}
                                style={{ accentColor:T.amber, flexShrink:0 }}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Live PHQ-2 distress check */}
          {scorePHQ2(form) >= 3 && (
            <Card style={{ background:T.coralDim, border:`1px solid ${T.coral}55`, marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.chalk, marginBottom:6 }}>Support is available</div>
              <div style={{ fontSize:13, color:T.chalk, lineHeight:1.65 }}>
                Your responses suggest you may be experiencing some emotional difficulties. Please consider reaching out:
                <br/>• MSU Counseling Services: <strong>(417) 836-5116</strong>
                <br/>• 988 Suicide & Crisis Lifeline: <strong>call or text 988</strong>
                <br/>• Crisis Text Line: <strong>text HOME to 741741</strong>
              </div>
            </Card>
          )}

          <button
            onClick={submitResponse}
            disabled={submitting}
            style={{ width:"100%", padding:"14px 0", borderRadius:12, background:submitting?T.chalkDim:T.amber, color:"var(--on-primary)", border:"none", cursor:submitting?"not-allowed":"pointer", fontSize:15, fontWeight:700, fontFamily:"inherit", marginBottom:24 }}
          >
            {submitting ? "Saving response…" : "Submit — anonymous and confidential"}
          </button>
        </div>
      )}

      {/* ── DATA TABLE TAB ──────────────────────────────────────────────── */}
      {tab === "data" && (
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            <StatCard label="Total responses" value={totalCount} color={T.amber} />
            <StatCard label="At risk (PHQ-2≥3)" value={atRiskCount} color={T.coral} sub={`${totalCount>0?Math.round(atRiskCount/totalCount*100):0}%`} />
            <StatCard label="EPV" value={epv} color={epvColor} sub="÷ 13 predictors" />
            <StatCard label="Need" value={Math.max(0,450-totalCount)} color={T.chalkDim} sub="to reach 450 target" />
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            <button onClick={() => setManualOpen((o) => !o)} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 12px", borderRadius:8, background:T.amber, color:"var(--on-primary)", border:"none", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
              <Plus size={13}/> Manual entry
            </button>
            <button onClick={exportCSV} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 12px", borderRadius:8, background:T.surface, border:`1px solid ${T.chalkFaint}`, color:T.chalk, cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
              <Download size={13}/> Export CSV
            </button>
          </div>

          {/* EPV bar */}
          <Card style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:T.chalk }}>Progress to 450 target</span>
              <span style={{ fontSize:12, color:T.chalkDim }}>{totalCount}/450</span>
            </div>
            <ProgressBar value={(totalCount/450)*100} color={epvColor} height={8} />
            <div style={{ fontSize:11, color:epvColor, marginTop:4 }}>
              EPV = {epv} {parseFloat(epv)>=10?" ✓ meets standard threshold":parseFloat(epv)>=5?" — borderline, use LASSO first":" — below threshold, need more responses"}
            </div>
          </Card>

          {/* Manual entry */}
          {manualOpen && (
            <Card style={{ marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.chalk, marginBottom:10 }}>Manual entry — paper survey responses</div>
              {SURVEY_FIELDS.map((field) => {
                const opts = getOpts(field);
                return (
                  <div key={field.id} style={{ marginBottom:8 }}>
                    <label style={{ fontSize:11, color:T.chalkDim, display:"block", marginBottom:3 }}>{field.id.toUpperCase()}. {field.label.slice(0,65)}{field.label.length>65?"…":""}</label>
                    {field.type==="text" ? (
                      <input type="text" value={manualForm[field.id]||""} onChange={(e) => setManualForm((f)=>({...f,[field.id]:e.target.value}))} style={{ width:"100%", padding:"6px 8px", borderRadius:6, border:`1px solid ${T.chalkFaint}`, background:T.bgDeep, color:T.chalk, fontSize:12, fontFamily:"inherit" }} />
                    ) : (
                      <select value={manualForm[field.id]||""} onChange={(e) => setManualForm((f)=>({...f,[field.id]:e.target.value}))} style={{ width:"100%", padding:"6px 8px", borderRadius:6, border:`1px solid ${T.chalkFaint}`, background:T.bgDeep, color:T.chalk, fontSize:12, fontFamily:"inherit" }}>
                        <option value="">— select —</option>
                        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                  </div>
                );
              })}
              <div style={{ display:"flex", gap:6, marginTop:10 }}>
                <button onClick={submitManual} style={{ padding:"7px 14px", borderRadius:8, background:T.amber, color:"var(--on-primary)", border:"none", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>Save entry</button>
                <button onClick={() => setManualOpen(false)} style={{ padding:"7px 12px", borderRadius:8, background:"none", border:`1px solid ${T.chalkFaint}`, color:T.chalkDim, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
              </div>
            </Card>
          )}

          {/* Response table */}
          {responses.length === 0 ? (
            <Card><div style={{ fontSize:13, color:T.chalkDim }}>No responses yet. Responses from the survey form and manual entries appear here.</div></Card>
          ) : (
            <div style={{ overflowX:"auto", borderRadius:10, border:`1px solid ${T.chalkFaint}` }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, color:T.chalk }}>
                <thead>
                  <tr style={{ background:T.surface2 }}>
                    {["#","Date","Country","Level","Time in US","PHQ-2","At risk","Source",""].map((h) => (
                      <th key={h} style={{ padding:"8px 10px", textAlign:"left", borderBottom:`1px solid ${T.chalkFaint}`, fontWeight:600, whiteSpace:"nowrap", color:T.chalk }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...responses].reverse().map((r, i) => {
                    const phq2 = scorePHQ2(r);
                    const atRisk = phq2 >= 3;
                    return (
                      <tr key={r.id} style={{ background: i%2===0?T.surface:T.bgDeep }}>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${T.chalkFaint}`, color:T.chalkDim }}>{responses.length-i}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${T.chalkFaint}`, whiteSpace:"nowrap" }}>{r.timestamp?.slice(0,10)||"—"}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${T.chalkFaint}` }}>{r.q1||"—"}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${T.chalkFaint}`, whiteSpace:"nowrap" }}>{r.q2?.split(" ")[0]||"—"}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${T.chalkFaint}`, whiteSpace:"nowrap" }}>{r.q3||"—"}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${T.chalkFaint}`, textAlign:"center", fontWeight:700, color:atRisk?T.coral:T.chalk }}>{phq2}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${T.chalkFaint}`, textAlign:"center" }}>
                          {atRisk?<span style={{ color:T.coral, fontWeight:700 }}>YES</span>:<span style={{ color:T.chalkDim }}>—</span>}
                        </td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${T.chalkFaint}`, color:T.chalkDim }}>{r.source||"form"}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${T.chalkFaint}` }}>
                          <button onClick={() => onDeleteResponse(r.id)} style={{ background:"none", border:"none", cursor:"pointer", color:T.coral, padding:0 }}><Trash2 size={13}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function MotivationView({ gloriaNote, onSetGloriaNote }) {
  const [editGloria, setEditGloria] = useState(false);
  const [gloriaInput, setGloriaInput] = useState(gloriaNote);
  const [showWhy, setShowWhy] = useState(false);
  const quoteIdx = Math.floor(new Date(TODAY()).getTime() / 86400000) % QUOTES.length;

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.chalk, marginBottom: 14 }}>Motivation</div>

      <Card style={{ background: T.amberDim, border: `1px solid ${T.amber}44` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          <Sparkles size={12} style={{ display: "inline", marginRight: 4 }} />Word for today
        </div>
        <div style={{ fontSize: 15, color: T.chalk, lineHeight: 1.65, fontStyle: "italic", marginBottom: 8 }}>"{QUOTES[quoteIdx].text}"</div>
        <div style={{ fontSize: 12, color: T.chalkDim }}>— {QUOTES[quoteIdx].ref}</div>
      </Card>

      <Card>
        <button onClick={() => setShowWhy((s) => !s)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0, fontFamily: "inherit", marginBottom: showWhy ? 10 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, display: "flex", alignItems: "center", gap: 6 }}>
            <Heart size={14} color={T.coral} /> Why I am doing this
          </div>
          {showWhy ? <ChevronDown size={14} color={T.chalkDim} /> : <ChevronRight size={14} color={T.chalkDim} />}
        </button>
        {showWhy && <div style={{ fontSize: 13, color: T.chalk, lineHeight: 1.7, whiteSpace: "pre-line" }}>{MY_WHY}</div>}
      </Card>

      <Card style={{ border: `1px solid ${T.coral}33` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Heart size={14} color={T.coral} /> From Gloria
        </div>
        {editGloria ? (
          <div>
            <textarea value={gloriaInput} onChange={(e) => setGloriaInput(e.target.value)} placeholder="Ask Gloria to write something here for you..." rows={4} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.chalkFaint}`, background: T.bgDeep, color: T.chalk, fontSize: 13, fontFamily: "inherit", resize: "vertical", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { onSetGloriaNote(gloriaInput); setEditGloria(false); }} style={{ padding: "7px 14px", borderRadius: 8, background: T.coral, color: "white", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Save</button>
              <button onClick={() => setEditGloria(false)} style={{ padding: "7px 12px", borderRadius: 8, background: "none", border: `1px solid ${T.chalkFaint}`, color: T.chalkDim, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            {gloriaNote ? <div style={{ fontSize: 13, color: T.chalk, lineHeight: 1.65, fontStyle: "italic", marginBottom: 8 }}>"{gloriaNote}"</div> : <div style={{ fontSize: 13, color: T.chalkDim, marginBottom: 8 }}>Ask Gloria to write something here for the hard days.</div>}
            <button onClick={() => setEditGloria(true)} style={{ fontSize: 11, color: T.chalkDim, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <Edit3 size={11} /> {gloriaNote ? "Edit" : "Add note"}
            </button>
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 10 }}>All quotes</div>
        {QUOTES.map((q, i) => (
          <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.chalkFaint}`, opacity: i === quoteIdx ? 1 : 0.55 }}>
            <div style={{ fontSize: 12, color: T.chalk, lineHeight: 1.55, fontStyle: "italic" }}>"{q.text}"</div>
            <div style={{ fontSize: 11, color: T.chalkDim, marginTop: 3 }}>— {q.ref} {i === quoteIdx ? "← today" : ""}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function SettingsView({ theme, onSetTheme, fontSize, onSetFontSize, onReset, onExport, onImport, notifEnabled, onEnableNotif, onDisableNotif }) {
  const fileRef = useRef(null);

  const copyHandoff = () => {
    const text = [
      "FIRST 90 THESIS — STATUS HANDOFF FOR CLAUDE",
      `Date: ${TODAY()} · Defense: ${DEFENSE_DATE} (${DAYS_UNTIL(DEFENSE_DATE)} days away)`,
      "",
      "THESIS: Predictors of Mental Health Vulnerability Among International Students",
      "Student: Amen Engworo Edoha (M03617692) · Advisor: Dr. Songfeng Zheng · MSU Mathematics",
      "",
      "FALL 2026 SCHEDULE:",
      "Tue 9am–1pm: Thesis deep work (4 hrs)",
      "Thu 10am–2pm: Thesis deep work (4 hrs)",
      "Sat 1pm–4pm: Thesis work (3 hrs)",
      "",
      "STATUS: [update before pasting]",
      "- Current chapter: ___",
      "- IRB status: ___",
      "- Survey responses: ___",
      "- AUC value: ___",
    ].join("\n");
    navigator.clipboard?.writeText(text);
    alert("Handoff text copied! Paste into new Claude conversation to catch me up.");
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.chalk, marginBottom: 14 }}>Settings</div>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 8 }}>Notifications</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: T.chalk }}>{notifEnabled ? "Daily reminders enabled" : "Reminders disabled"}</div>
            <div style={{ fontSize: 11, color: T.chalkDim }}>Notified at session start times: Tue 9am · Thu 10am · Sat 1pm</div>
          </div>
          <button onClick={notifEnabled ? onDisableNotif : onEnableNotif} style={{ padding: "7px 12px", borderRadius: 8, background: notifEnabled ? T.coralDim : T.amberDim, color: notifEnabled ? T.coral : T.amber, border: `1px solid ${notifEnabled ? T.coral : T.amber}44`, cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
            {notifEnabled ? <><BellOff size={13} /> Disable</> : <><Bell size={13} /> Enable</>}
          </button>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 8 }}>Theme</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["auto","Auto"],["light","Light"],["dark","Dark"]].map(([v, l]) => (
            <button key={v} onClick={() => onSetTheme(v)} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit", background: theme === v ? T.amber : T.bgDeep, color: theme === v ? "var(--on-primary)" : T.chalk, border: `1px solid ${theme === v ? T.amber : T.chalkFaint}` }}>{l}</button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 8 }}>Font size</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[[0,"S"],[1,"M"],[2,"L"],[3,"XL"]].map(([v, l]) => (
            <button key={v} onClick={() => onSetFontSize(v)} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit", background: fontSize === v ? T.amber : T.bgDeep, color: fontSize === v ? "var(--on-primary)" : T.chalk, border: `1px solid ${fontSize === v ? T.amber : T.chalkFaint}` }}>{l}</button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 6 }}>Quick info</div>
        {[
          ["Student","Amen Engworo Edoha (M03617692)"],
          ["Advisor","Dr. Songfeng Zheng · SongfengZheng@missouristate.edu"],
          ["Defense","November 15 2026"],
          ["IRB phone","417-836-3737"],
          ["IRB email","irb@missouristate.edu"],
          ["Cayuse","msu.app.cayuse.com · FWA 00004733"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 8, padding: "3px 0", fontSize: 12, color: T.chalkDim }}>
            <span style={{ color: T.chalk, minWidth: 80, flexShrink: 0 }}>{k}:</span>
            <span>{v}</span>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.chalk, marginBottom: 10 }}>Tools</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={copyHandoff} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, background: T.amberDim, border: `1px solid ${T.amber}44`, color: T.amber, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <Copy size={13} /> Copy Claude handoff
          </button>
          <button onClick={onExport} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, background: T.surface2, border: `1px solid ${T.chalkFaint}`, color: T.chalk, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <Download size={13} /> Export backup
          </button>
          <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, background: T.surface2, border: `1px solid ${T.chalkFaint}`, color: T.chalk, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <Download size={13} style={{ transform: "rotate(180deg)" }} /> Restore backup
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) onImport(e.target.files[0]); }} />
        </div>
      </Card>

      <button onClick={onReset} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 8, background: T.coralDim, border: `1px solid ${T.coral}44`, color: T.coral, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
        <RefreshCcw size={14} /> Reset all progress
      </button>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────────────── */
export default function ThesisApp() {
  const [view,          setView]         = useState("dashboard");
  const [tasks,         setTasks]        = useState([]);
  const [chStatus,      setChStatus]     = useState({});
  const [chNotes,       setChNotes]      = useState({});
  const [irbStatus,     setIrbStatus]    = useState({});
  const [sessions,      setSessions]     = useState([]);
  const [rStatus,       setRStatus]      = useState({});
  const [rNotes,        setRNotes]       = useState({});
  const [aucValue,      setAucValue]     = useState(null);
  const [defAnswers,    setDefAnswers]    = useState({});
  const [defDone,       setDefDone]      = useState({});
  const [practiceLog,   setPracticeLog]  = useState([]);
  const [gloriaNote,    setGloriaNote]   = useState("");
  const [responses,     setResponses]    = useState([]);
  const [googleFormLink,setGoogleFormLink]= useState("");
  const [surveyLink,    setSurveyLink2]   = useState("");
  const [fundingStatus, setFundingStatus]= useState({});
  const [theme,         setTheme]        = useState("auto");
  const [fontSize,      setFontSize]     = useState(2);
  const [loaded,        setLoaded]       = useState(false);
  const [dailyModal,    setDailyModal]   = useState(false);
  const [notifEnabled,  setNotifEnabled] = useState(false);

  const { el: Confetti, trigger: confettiTrigger } = useConfetti();

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [view]);

  // Load all state
  useEffect(() => {
    (async () => {
      const [
        savedTasks, savedChStatus, savedChNotes, savedIrb,
        savedSessions, savedRStatus, savedRNotes, savedAuc,
        savedDefAns, savedDefDone, savedPractice,
        savedGloria, savedTheme, savedFontSize,
        savedNotif, savedLastModal, savedFunding,
        savedResponses, savedGFormLink, savedSurveyLink2,
      ] = await Promise.all([
        sbLoad("tasks", null), sbLoad("ch-status", {}), sbLoad("ch-notes", {}),
        sbLoad("irb", {}), sbLoad("sessions", []),
        sbLoad("r-status", {}), sbLoad("r-notes", {}), sbLoad("auc", null),
        sbLoad("def-answers", {}), sbLoad("def-done", {}), sbLoad("practice", []),
        sbLoad("gloria", ""), sbLoad("theme", "auto"), sbLoad("font-size", 2),
        sbLoad("notif-enabled", false), sbLoad("last-modal", null),
        sbLoad("funding", {}),
        sbLoad("responses", []), sbLoad("google-form-link", ""), sbLoad("survey-link2", ""),
      ]);

      setTasks(savedTasks?.length ? savedTasks : buildTaskPlan());
      setChStatus(savedChStatus || {});
      setChNotes(savedChNotes || {});
      setIrbStatus(savedIrb || {});
      setSessions(savedSessions || []);
      setRStatus(savedRStatus || {});
      setRNotes(savedRNotes || {});
      setAucValue(savedAuc);
      setDefAnswers(savedDefAns || {});
      setDefDone(savedDefDone || {});
      setPracticeLog(savedPractice || []);
      setGloriaNote(savedGloria || "");
      setTheme(savedTheme || "auto");
      setFontSize(savedFontSize ?? 2);
      setNotifEnabled(savedNotif || false);
      setFundingStatus(savedFunding || {});
      setResponses(savedResponses || []);
      setGoogleFormLink(savedGFormLink || '');
      setSurveyLink2(savedSurveyLink2 || '');

      const today = TODAY();
      if (savedLastModal !== today) {
        setDailyModal(true);
        sbSave("last-modal", today);
      }

      // Schedule notifications if enabled
      if (savedNotif && "Notification" in window && Notification.permission === "granted") {
        const dow = new Date(today + "T12:00:00").getDay();
        const slot = SCHEDULE[dow];
        if (slot) {
          const firstTask = (savedTasks?.length ? savedTasks : buildTaskPlan()).find((t) => t.date === today);
          if (firstTask) scheduleLocalNotification(firstTask.task, slot.slot.split("–")[0].trim());
        }
      }

      setLoaded(true);
    })();
  }, []);

  // Handlers
  const toggleTask = (id, done) => {
    const next = tasks.map((t) => t.id === id ? { ...t, done } : t);
    setTasks(next); sbSave("tasks", next);
    if (done) confettiTrigger();
  };
  const overrideTask = (id, text) => {
    const next = tasks.map((t) => t.id === id ? { ...t, task: text } : t);
    setTasks(next); sbSave("tasks", next);
  };
  const updateChStatus = (id, status) => { const n = { ...chStatus, [id]: status }; setChStatus(n); sbSave("ch-status", n); };
  const updateChNote   = (id, note)   => { const n = { ...chNotes,  [id]: note };   setChNotes(n);  sbSave("ch-notes", n); };
  const toggleIrb      = (id, v)      => { const n = { ...irbStatus, [id]: v };     setIrbStatus(n); sbSave("irb", n); };
  const addSession     = (s)          => { const n = [...sessions, s];               setSessions(n);  sbSave("sessions", n); };
  const deleteSession  = (id)         => { const n = sessions.filter((s) => s.id !== id); setSessions(n); sbSave("sessions", n); };
  const toggleRStep    = (id, v)      => { const n = { ...rStatus, [id]: v };       setRStatus(n);   sbSave("r-status", n); };
  const updateRNote    = (id, note)   => { const n = { ...rNotes, [id]: note };     setRNotes(n);    sbSave("r-notes", n); };
  const saveAuc        = (v)          => { setAucValue(v); sbSave("auc", v); };
  const updateDefAns   = (id, ans)    => { const n = { ...defAnswers, [id]: ans };  setDefAnswers(n); sbSave("def-answers", n); };
  const toggleDefDone  = (id, v)      => { const n = { ...defDone, [id]: v };       setDefDone(n);   sbSave("def-done", n); };
  const addPractice    = (p)          => { const n = [...practiceLog, p];            setPracticeLog(n); sbSave("practice", n); };
  const saveGloria     = (note)       => { setGloriaNote(note); sbSave("gloria", note); };
  const toggleFunding  = (id, v)      => { const n = { ...fundingStatus, [id]: v }; setFundingStatus(n); sbSave("funding", n); };
  const addResponse    = async (r)    => { const n = [...responses, r]; setResponses(n); sbSave("responses", n); };
  const deleteResponse = (id)         => { const n = responses.filter((r) => r.id !== id); setResponses(n); sbSave("responses", n); };
  const setGFormLink   = (l)          => { setGoogleFormLink(l); sbSave("google-form-link", l); };
  const setThemeS      = (t)          => { setTheme(t);    sbSave("theme", t); };
  const setFontSizeS   = (s)          => { setFontSize(s); sbSave("font-size", s); };

  const enableNotif = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotifEnabled(true); sbSave("notif-enabled", true);
      // Schedule for today if applicable
      const today = TODAY();
      const dow = new Date(today + "T12:00:00").getDay();
      const slot = SCHEDULE[dow];
      if (slot) {
        const todayTask = tasks.find((t) => t.date === today);
        if (todayTask) scheduleLocalNotification(todayTask.task, slot.slot.split("–")[0].trim());
      }
      new Notification("📚 Thesis reminders enabled!", {
        body: "You'll be notified at Tue 9am, Thu 10am, and Sat 1pm on working days.",
        icon: "/icon-192.png",
      });
    } else {
      alert("Notification permission denied. Go to browser settings to allow notifications for this site.");
    }
  };

  const disableNotif = () => { setNotifEnabled(false); sbSave("notif-enabled", false); };

  const exportBackup = () => {
    const data = { tasks, chStatus, chNotes, irbStatus, sessions, rStatus, rNotes, aucValue, defAnswers, defDone, practiceLog, gloriaNote };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `thesis-backup-${TODAY()}.json`; a.click();
  };
  const importBackup = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (data.tasks) { setTasks(data.tasks); sbSave("tasks", data.tasks); }
      if (data.chStatus) { setChStatus(data.chStatus); sbSave("ch-status", data.chStatus); }
      alert("Backup restored.");
    } catch { alert("Invalid backup file."); }
  };
  const resetAll = async () => {
    if (!window.confirm("Reset all progress? Cannot be undone.")) return;
    const fresh = buildTaskPlan();
    setTasks(fresh); setChStatus({}); setIrbStatus({}); setSessions([]);
    setRStatus({}); setRNotes({}); setAucValue(null); setDefAnswers({}); setDefDone({});
    await Promise.all([sbSave("tasks", fresh), sbSave("ch-status", {}), sbSave("irb", {}), sbSave("sessions", [])]);
  };

  // Theme
  const hour = new Date().getHours();
  const isDark = theme === "dark" || (theme === "auto" && (hour < 7 || hour >= 19));
  const cssVars = isDark ? DARK : LIGHT;
  const fontSizeMap = { 0: 14, 1: 15, 2: 16, 3: 18 };

  // Nav
  const NAV = [
    { id: "dashboard", label: "Home",     icon: Home },
    { id: "today",     label: "Today",    icon: Zap },
    { id: "plan",      label: "Plan",     icon: Calendar },
    { id: "chapters",  label: "Chapters", icon: BookOpen },
    { id: "irb",       label: "IRB",      icon: Shield },
    { id: "funding",   label: "Funding",  icon: Star },
    { id: "survey",    label: "Survey",   icon: ClipboardList },
    { id: "analysis",  label: "R guide",  icon: BarChart2 },
    { id: "sessions",  label: "Sessions", icon: Clock },
    { id: "defense",   label: "Defense",  icon: GraduationCap },
    { id: "motivation",label: "Why",      icon: Heart },
    { id: "settings",  label: "Settings", icon: Settings },
  ];

  const pendingIrb     = IRB.flatMap((s) => s.tasks).filter((t) => !irbStatus[t.id]).length;
  const pendingFunding = FUNDING.flatMap((s) => s.tasks).filter((t) => !fundingStatus[t.id]).length;

  // Today's schedule info for modal
  const todayStr = TODAY();
  const todayDow = new Date(todayStr + "T12:00:00").getDay();
  const todaySlot = SCHEDULE[todayDow];
  const todayTask = tasks.find((t) => t.date === todayStr);

  if (!loaded) {
    return (
      <div style={{ ...cssVars, minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-dim)", fontSize: 14 }}>Loading thesis tracker...</div>
      </div>
    );
  }

  return (
    <div style={{ ...cssVars, minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Sora', -apple-system, sans-serif", fontSize: fontSizeMap[fontSize], transition: "background 0.25s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes popIn  { from { opacity:0; transform:scale(.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fall   { to { transform: translateY(110vh) rotate(360deg); opacity:0; } }
        * { box-sizing: border-box; }
        body { margin:0; }
        button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        input:focus, textarea:focus, select:focus { outline: 2px solid var(--primary); outline-offset: 1px; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius:99px; }
      `}</style>

      {Confetti}

      <DailyModal
        open={dailyModal}
        onClose={() => setDailyModal(false)}
        todayTask={todayTask}
        scheduleInfo={todaySlot}
      />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "16px 14px 100px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.amber, color: "var(--on-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <GraduationCap size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.chalk }}>First 90 — Thesis</div>
            <div style={{ fontSize: 11, color: T.chalkDim }}>Amen Engworo Edoha · {DAYS_UNTIL(DEFENSE_DATE)}d to defense</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {!notifEnabled && (
              <button onClick={enableNotif} style={{ background: "none", border: "none", cursor: "pointer", color: T.chalkDim, padding: 4 }} title="Enable notifications">
                <Bell size={16} />
              </button>
            )}
            {notifEnabled && <Bell size={14} color={T.amber} />}
          </div>
        </div>

        {/* Nav pills */}
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", background: T.surface, borderRadius: 99, padding: 4, marginBottom: 18, border: `1px solid ${T.chalkFaint}` }}>
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = view === n.id;
            const badge = (n.id === "irb" && pendingIrb > 4) || (n.id === "funding" && pendingFunding > 12);
            return (
              <button key={n.id} onClick={() => setView(n.id)} style={{ position: "relative", display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 99, fontSize: 11, fontWeight: active ? 600 : 400, background: active ? T.amber : "none", color: active ? "var(--on-primary)" : T.chalkDim, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "background .15s" }}>
                <Icon size={12} />
                <span>{n.label}</span>
                {badge && <span style={{ position: "absolute", top: -2, right: -2, width: 14, height: 14, borderRadius: 99, background: T.coral, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingIrb > 9 ? "9+" : pendingIrb}</span>}
              </button>
            );
          })}
        </div>

        {/* Views */}
        {view === "dashboard"  && <DashboardView tasks={tasks} chapterStatus={chStatus} sessions={sessions} irbStatus={irbStatus} fundingStatus={fundingStatus} navigate={setView} notifEnabled={notifEnabled} onEnableNotif={enableNotif} />}
        {view === "today"      && <TodayView tasks={tasks} onToggle={toggleTask} onOverride={overrideTask} />}
        {view === "plan"       && <PlanView tasks={tasks} onToggle={toggleTask} onOverride={overrideTask} />}
        {view === "chapters"   && <ChaptersView chapterStatus={chStatus} onUpdateStatus={updateChStatus} chapterNotes={chNotes} onUpdateNote={updateChNote} confettiTrigger={confettiTrigger} />}
        {view === "irb"        && <IrbView irbStatus={irbStatus} onToggle={toggleIrb} />}
        {view === "funding"    && <FundingView fundingStatus={fundingStatus} onToggle={toggleFunding} />}
        {view === "analysis"   && <AnalysisView rStatus={rStatus} onToggleStep={toggleRStep} rNotes={rNotes} onUpdateNote={updateRNote} aucValue={aucValue} onSetAuc={saveAuc} />}
        {view === "sessions"   && <SessionsView sessions={sessions} onAdd={addSession} onDelete={deleteSession} />}
        {view === "defense"    && <DefenseView defenseAnswers={defAnswers} onUpdateAnswer={updateDefAns} defenseDone={defDone} onToggleDefense={toggleDefDone} practiceLog={practiceLog} onAddPractice={addPractice} />}
        {view === "survey"     && <SurveyView responses={responses} onAddResponse={addResponse} onDeleteResponse={deleteResponse} appUrl={googleFormLink} onSetAppUrl={setGFormLink} />}
        {view === "motivation" && <MotivationView gloriaNote={gloriaNote} onSetGloriaNote={saveGloria} />}
        {view === "settings"   && <SettingsView theme={theme} onSetTheme={setThemeS} fontSize={fontSize} onSetFontSize={setFontSizeS} onReset={resetAll} onExport={exportBackup} onImport={importBackup} notifEnabled={notifEnabled} onEnableNotif={enableNotif} onDisableNotif={disableNotif} />}

      </div>
    </div>
  );
}
