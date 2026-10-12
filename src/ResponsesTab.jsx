/**
 * ResponsesTab.jsx — Review, export, and report on survey responses
 * ------------------------------------------------------------------
 * Pulls responses from BOTH places they are stored:
 *   1. Supabase table `thesis_responses`  (public survey page / QR code)
 *   2. thesis_state key "responses"        (in-app form + manual paper entries)
 *
 * Exports
 *   useAllResponses(...)  — hook that loads + merges both sources
 *   default ResponsesTab  — list, search, filters, detail view, downloads
 *
 * Install once:  npm install jspdf jspdf-autotable
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, RefreshCcw, Trash2, X, FileText, Upload, CheckCircle2, AlertTriangle } from "lucide-react";

export const TABLES = { real: "thesis_responses", pseudo: "thesis_responses_pseudo" };
const DS_LABEL = { real: "Real data", pseudo: "Pseudo data" };
const PDF_GREEN = "#2f6b4f";
const MAROON = "#6B2737";

/* ─── Survey definition (matches the IRB instrument) ─────────────────── */
const SECTIONS = [
  { title: "Demographics", items: [
    ["q1", "Country of origin"],
    ["q2", "Current level of study"],
    ["q3", "Time in the United States"],
    ["q5", "Active faith or religious community in the US"],
  ]},
  { title: "PHQ-2 + GAD-2 (0–3)", items: [
    ["q6", "Little interest or pleasure in doing things"],
    ["q7", "Feeling down, depressed, or hopeless"],
    ["q8", "Feeling nervous, anxious, or on edge"],
    ["q9", "Not being able to stop or control worrying"],
  ]},
  { title: "UCLA Loneliness (1–3)", items: [
    ["q10", "I feel that I lack companionship"],
    ["q11", "I feel isolated from other people"],
  ]},
  { title: "Acculturative stress (1–5)", items: [
    ["q12", "People here do not understand my cultural values"],
    ["q13", "I miss my family and friends back home"],
    ["q14", "People treat me differently because of where I am from"],
    ["q15", "Afraid I will not be able to complete my studies here"],
    ["q16", "Adjusting to a new way of life has been difficult"],
    ["q17", "I feel guilty about leaving my family back home"],
  ]},
  { title: "Financial stress (1–5)", items: [
    ["q18", "Stressed about covering basic expenses"],
    ["q19", "Finances affect my ability to focus on studies"],
    ["q20", "Gone without something I needed due to cost"],
  ]},
  { title: "Faith and spiritual life (1–5)", items: [
    ["q21", "Difficult to maintain my faith or spiritual practice"],
    ["q22", "My faith community has been a source of strength (reverse-scored)"],
  ]},
  { title: "Visa, housing, help-seeking (1–5)", items: [
    ["q23", "Worry about immigration policy affecting my visa"],
    ["q24", "Visa uncertainty affects my focus on studies"],
    ["q25", "Difficulty finding suitable housing"],
    ["q26", "Uncomfortable seeking help from a counselor"],
    ["q27", "Do not know how to access mental health services"],
  ]},
  { title: "Daily life (1–5)", items: [
    ["q28", "Difficult to access familiar foods"],
    ["q29", "Nervous speaking up in class"],
    ["q30", "Avoid reaching out to professors or staff"],
  ]},
];

const SCALE_KEYS = Array.from({ length: 25 }, (_, i) => `q${i + 6}`); // q6–q30
const CORE_KEYS = ["q1", "q2", "q3", "q5", ...SCALE_KEYS];               // 29 IRB items
const ALL_KEYS = ["q1", "q2", "q3", "q5", ...SCALE_KEYS];

/* ─── Helpers ────────────────────────────────────────────────────────── */
// Handles "3", 3, and "3 — Nearly every day"
const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v).trim());
  return Number.isFinite(n) ? n : null;
};
// Strip "3 — Nearly every day" down to its label for display/CSV of text fields
const text = (v) => (v === null || v === undefined ? "" : String(v));

const sum = (a, b) => (a === null || b === null ? null : a + b);

function variance(values) {
  const v = values.filter((x) => x !== null);
  if (v.length < 2) return null;
  const m = v.reduce((s, x) => s + x, 0) / v.length;
  return v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1);
}

function enrich(rows) {
  const stamps = {};
  rows.forEach((r) => { if (r.timestamp) stamps[r.timestamp] = (stamps[r.timestamp] || 0) + 1; });
  return rows.map((r) => {
    const phq2 = sum(num(r.q6), num(r.q7));
    const gad2 = sum(num(r.q8), num(r.q9));
    const answered = CORE_KEYS.filter((k) => r[k] !== null && r[k] !== undefined && r[k] !== "").length;
    const v = variance(SCALE_KEYS.map((k) => num(r[k])));
    const flags = [];
    if (v !== null && v < 0.1) flags.push("Straight-lined");
    if (r.timestamp && stamps[r.timestamp] > 1) flags.push("Duplicate time");
    if (answered < CORE_KEYS.length * 0.8) flags.push("Incomplete");
    return { ...r, _phq2: phq2, _gad2: gad2, _atRisk: phq2 !== null && phq2 >= 3, _answered: answered, _flags: flags };
  });
}

const fmtDate = (ts) =>
  ts ? new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
const today = () => new Date().toISOString().slice(0, 10);

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCSV(rows, cols) {
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

/* ─── Data hook: loads + merges both storage locations ───────────────── */
export function useAllResponses({ sbUrl, sbKey, localResponses = [], onDeleteLocal, dataset = "real" }) {
  const TABLE = TABLES[dataset] || TABLES.real;
  // In-app and manual entries are real data, so they only join the real view
  const local = dataset === "real" ? localResponses : [];
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastLoaded, setLastLoaded] = useState(null);

  const headers = useMemo(
    () => ({ apikey: sbKey, Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" }),
    [sbKey]
  );

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const all = [];
      const page = 1000;
      for (let offset = 0; ; offset += page) {
        const res = await fetch(
          `${sbUrl}/rest/v1/${TABLE}?select=*&order=timestamp.desc&limit=${page}&offset=${offset}`,
          { headers }
        );
        if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
        const data = await res.json();
        all.push(...data);
        if (data.length < page) break;
      }
      setTableRows(all);
      setLastLoaded(new Date());
    } catch (e) {
      setTableRows([]);
      setError(dataset === "pseudo"
        ? `Couldn't load pseudo data (${e.message}). Check that the ${TABLE} table exists and allows reads.`
        : `Couldn't load survey-page responses (${e.message}). In-app and manual entries are still shown. Check that reads are allowed on ${TABLE}.`);
    }
    setLoading(false);
  }, [sbUrl, headers, TABLE, dataset]);

  useEffect(() => { reload(); }, [reload]);

  const rows = useMemo(() => {
    const byId = new Map();
    tableRows.forEach((r) => byId.set(r.id, { ...r, _origin: "table" }));
    (local || []).forEach((r) => { if (!byId.has(r.id)) byId.set(r.id, { ...r, _origin: "app" }); });
    const merged = [...byId.values()].sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
    return enrich(merged);
  }, [tableRows, local]);

  const removeRow = useCallback(async (row) => {
    if (row._origin === "app") { onDeleteLocal?.(row.id); return; }
    const res = await fetch(`${sbUrl}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(row.id)}`, { method: "DELETE", headers });
    if (!res.ok) { alert(`Delete failed: ${res.status}. The table may not allow deletes for this key — delete it in Supabase instead.`); return; }
    setTableRows((rs) => rs.filter((r) => r.id !== row.id));
  }, [sbUrl, headers, onDeleteLocal, TABLE]);

  // Bulk insert. Returns { inserted, failed }.
  const insertRows = useCallback(async (newRows) => {
    let inserted = 0, failed = 0;
    const post = (body) => fetch(`${sbUrl}/rest/v1/${TABLE}`, {
      method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(body),
    });
    for (let i = 0; i < newRows.length; i += 200) {
      const chunk = newRows.slice(i, i + 200);
      let ok = false;
      try { ok = (await post(chunk)).ok; } catch { ok = false; }
      if (ok) { inserted += chunk.length; continue; }
      // Chunk failed: retry one by one so a single bad row doesn't sink the rest
      for (const row of chunk) {
        try { (await post([row])).ok ? inserted++ : failed++; } catch { failed++; }
      }
    }
    await reload();
    return { inserted, failed };
  }, [sbUrl, headers, TABLE, reload]);

  return { rows, tableRows, loading, error, reload, lastLoaded, removeRow, insertRows, dataset, table: TABLE };
}

/* ─── Exports ────────────────────────────────────────────────────────── */
const fileTag = (ds) => (ds === "pseudo" ? "_pseudo" : "");

function exportRawCSV(rows, ds) {
  const out = rows.map((r) => ({ ...r, origin: r._origin }));
  downloadBlob(toCSV(out, ["id", "timestamp", "source", "origin", ...ALL_KEYS]), `thesis_responses${fileTag(ds)}_raw_${today()}.csv`, "text/csv");
}

function exportAnalysisCSV(rows, ds) {
  const out = rows.map((r) => {
    const o = {
      id: r.id, timestamp: r.timestamp, source: r.source || r._origin,
      country: text(r.q1), level: text(r.q2), time_in_us: text(r.q3),
      faith_community: text(r.q5),
    };
    SCALE_KEYS.forEach((k) => (o[k] = num(r[k])));
    const q22 = num(r.q22);
    o.q22_r = q22 === null ? null : 6 - q22;
    o.phq2 = r._phq2;
    o.gad2 = r._gad2;
    o.depressed = r._phq2 === null ? null : r._atRisk ? 1 : 0;
    o.flag_straightline = r._flags.includes("Straight-lined") ? 1 : 0;
    o.flag_duplicate = r._flags.includes("Duplicate time") ? 1 : 0;
    o.flag_incomplete = r._flags.includes("Incomplete") ? 1 : 0;
    return o;
  });
  const cols = ["id", "timestamp", "source", "country", "level", "time_in_us", "faith_community",
    ...SCALE_KEYS, "q22_r", "phq2", "gad2", "depressed", "flag_straightline", "flag_duplicate", "flag_incomplete"];
  downloadBlob(toCSV(out, cols), `thesis_analysis${fileTag(ds)}_${today()}.csv`, "text/csv");
}

function exportRScript(ds) {
  const d = today();
  const csv = `thesis_analysis${fileTag(ds)}_${d}.csv`;
  const r = `# ============================================================
# Predictors of Mental Health Vulnerability Among International
# Students — analysis script (generated ${d})
# Dataset: ${ds === "pseudo" ? "PSEUDO DATA — for analysis development only. Not thesis results." : "Real survey data"}
#
# 1. Save this in the same folder as ${csv}
# 2. Run top to bottom
# ============================================================

pkgs <- c("tidyverse", "psych", "glmnet", "pROC", "car", "ResourceSelection")
new <- pkgs[!pkgs %in% installed.packages()[, "Package"]]
if (length(new)) install.packages(new)
invisible(lapply(pkgs, library, character.only = TRUE))
set.seed(42)

# ---- 1. Load and clean ----------------------------------------
dat <- read_csv("${csv}", show_col_types = FALSE)

cat("Rows loaded:", nrow(dat), "\\n")
cat("Straight-liners:", sum(dat$flag_straightline), "\\n")
cat("Duplicates:", sum(dat$flag_duplicate), "\\n")
cat("Incomplete:", sum(dat$flag_incomplete), "\\n")

clean <- dat %>%
  filter(flag_straightline == 0, flag_duplicate == 0, flag_incomplete == 0) %>%
  filter(!is.na(depressed)) %>%
  mutate(
    level           = factor(level),
    time_in_us      = factor(time_in_us),
    faith_community = factor(faith_community)
  )
cat("Analytic sample:", nrow(clean), "\\n")

# ---- 2. Score scales ------------------------------------------
clean <- clean %>% mutate(
  ucla  = q10 + q11,
  assis = q12 + q13 + q14 + q15 + q16 + q17,
  fin   = q18 + q19 + q20,
  faith = q21 + q22_r,
  visa  = q23 + q24,
  house = q25,
  help  = q26 + q27,
  food  = q28,
  comm  = q29 + q30
)

# ---- 3. Descriptives + reliability ----------------------------
describe(select(clean, phq2, gad2, ucla, assis, fin, faith, visa, house, help, food, comm))
prop.table(table(clean$depressed))

alpha(select(clean, q10, q11))$total
alpha(select(clean, q12:q17))$total
alpha(select(clean, q18:q20))$total
alpha(select(clean, q21, q22_r))$total
alpha(select(clean, q23, q24))$total
alpha(select(clean, q26, q27))$total
alpha(select(clean, q29, q30))$total

# ---- 4. Logistic regression -----------------------------------
# q6/q7 define the outcome, so they are never predictors.
form <- depressed ~ gad2 + ucla + assis + fin + faith + visa + house + help + food + comm +
                    time_in_us + level + faith_community
model_dat <- clean %>% select(all_of(all.vars(form))) %>% drop_na()

full <- glm(form, data = model_dat, family = binomial)
summary(full)
exp(cbind(OR = coef(full), confint.default(full)))
vif(full)
hoslem.test(model_dat$depressed, fitted(full), g = 10)

# ---- 5. LASSO (10-fold CV) on a 70/30 split -------------------
idx   <- sample(seq_len(nrow(model_dat)), floor(0.7 * nrow(model_dat)))
train <- model_dat[idx, ]
test  <- model_dat[-idx, ]

X_tr <- model.matrix(form, data = train)[, -1]
X_te <- model.matrix(form, data = test)[, -1]

cv_fit <- cv.glmnet(X_tr, train$depressed, family = "binomial", alpha = 1, nfolds = 10)
plot(cv_fit)
coef(cv_fit, s = "lambda.min")

# ---- 6. Composite risk index + ROC (H4: AUC >= 0.75) ----------
risk <- as.numeric(predict(cv_fit, newx = X_te, s = "lambda.min", type = "response"))
roc_obj <- roc(test$depressed, risk)
auc(roc_obj); ci.auc(roc_obj)
plot(roc_obj, print.auc = TRUE)
coords(roc_obj, "best", best.method = "youden", ret = c("threshold", "sensitivity", "specificity"))

saveRDS(list(clean = clean, full = full, cv_fit = cv_fit, roc = roc_obj), "thesis_results${fileTag(ds)}.rds")
`;
  downloadBlob(r, `thesis_analysis${fileTag(ds)}.R`, "text/plain");
}

const PSEUDO_RED = "#8a1c2b";
function pdfHeader(doc, title, subtitle, ds) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(ds === "pseudo" ? PSEUDO_RED : PDF_GREEN); doc.rect(0, 0, w, 62, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(title, 40, 31);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(subtitle, 40, 48);
  if (ds === "pseudo") {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("PSEUDO DATA - for analysis development only", w - 40, 31, { align: "right" });
    doc.setFont("helvetica", "normal");
  }
  doc.setTextColor("#222222");
}

function pdfFooter(doc, ds) {
  const n = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor("#888888");
    doc.text(ds === "pseudo"
      ? "PSEUDO DATA - simulated responses for analysis development only. Not thesis results."
      : "Confidential research data, IRB-FY2027-49. Anonymous responses.", 40, h - 20);
    doc.text(`Page ${i} of ${n}`, w - 40, h - 20, { align: "right" });
  }
}

const tbl = (doc, startY, head, body, extra = {}) =>
  autoTable(doc, {
    startY, head: [head], body,
    headStyles: { fillColor: PDF_GREEN }, styles: { fontSize: 9 },
    margin: { left: 40, right: 40 }, ...extra,
  });

function countBy(rows, key) {
  const m = {};
  rows.forEach((r) => {
    const v = r[key] && String(r[key]).trim() ? String(r[key]).trim() : "No answer";
    m[v] = (m[v] || 0) + 1;
  });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

function exportSummaryPDF(rows, ds) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  pdfHeader(doc, ds === "pseudo" ? "Survey summary report (pseudo data)" : "Survey summary report", `First 90 thesis survey   |   Generated ${fmtDate(new Date())}`, ds);
  const n = rows.length;
  const pct = (x) => (n ? `${((100 * x) / n).toFixed(1)}%` : "—");
  const atRisk = rows.filter((r) => r._atRisk).length;
  const flagged = rows.filter((r) => r._flags.length).length;

  tbl(doc, 84, ["Overview", "Value"], [
    ["Dataset", DS_LABEL[ds] || DS_LABEL.real],
    ["Total responses", String(n)],
    ["Survey page / in-app or manual", `${rows.filter((r) => r._origin === "table").length} / ${rows.filter((r) => r._origin === "app").length}`],
    ["PHQ-2 >= 3 (outcome = 1)", `${atRisk} (${pct(atRisk)})`],
    ["Responses with a quality flag", `${flagged} (${pct(flagged)})`],
    ["Clean responses", String(n - flagged)],
    ["First response", fmtDate(rows[n - 1]?.timestamp)],
    ["Latest response", fmtDate(rows[0]?.timestamp)],
  ], { styles: { fontSize: 10 } });

  [["q2", "Level of study"], ["q3", "Time in the US"], ["q5", "Faith community"], ["q1", "Country of origin"]]
    .forEach(([k, label]) => {
      tbl(doc, doc.lastAutoTable.finalY + 16, [label, "n", "%"], countBy(rows, k).map(([v, c]) => [v, String(c), pct(c)]));
    });

  const items = [];
  SECTIONS.slice(1).forEach((s) => s.items.forEach(([k, label]) => {
    const vals = rows.map((r) => num(r[k])).filter((x) => x !== null);
    const m = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    const sd = vals.length > 1 ? Math.sqrt(variance(vals)) : null;
    items.push([k.toUpperCase(), label, String(vals.length), m === null ? "—" : m.toFixed(2), sd === null ? "—" : sd.toFixed(2)]);
  }));

  doc.addPage();
  pdfHeader(doc, "Item descriptives", "Means and standard deviations, all responses", ds);
  tbl(doc, 84, ["Item", "Question", "n", "Mean", "SD"], items, {
    styles: { fontSize: 8.5, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 36 }, 2: { cellWidth: 30 }, 3: { cellWidth: 40 }, 4: { cellWidth: 40 } },
  });

  const fl = rows.filter((r) => r._flags.length);
  if (fl.length) {
    tbl(doc, doc.lastAutoTable.finalY + 16, ["Response ID", "Submitted", "Flags"],
      fl.map((r) => [String(r.id).slice(0, 14), fmtDate(r.timestamp), r._flags.join(", ")]));
  }
  pdfFooter(doc, ds);
  doc.save(`thesis_summary_report${fileTag(ds)}_${today()}.pdf`);
}

function exportResponsePDF(r, ds) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  pdfHeader(doc, ds === "pseudo" ? "Survey response (pseudo data)" : "Survey response", `ID ${String(r.id).slice(0, 20)}   |   Submitted ${fmtDate(r.timestamp)}`, ds);
  tbl(doc, 84, ["Scores", ""], [
    ["PHQ-2", r._phq2 === null ? "—" : `${r._phq2}${r._atRisk ? "  (at or above cut-off of 3)" : ""}`],
    ["GAD-2", r._gad2 === null ? "—" : String(r._gad2)],
    ["Items answered", `${r._answered} of ${CORE_KEYS.length}`],
    ["Quality flags", r._flags.length ? r._flags.join(", ") : "None"],
    ["Source", r.source || (r._origin === "table" ? "survey page" : "in-app")],
  ], { styles: { fontSize: 10 } });
  SECTIONS.forEach((s) => {
    const items = s.items;
    tbl(doc, doc.lastAutoTable.finalY + 12, [s.title, "Answer"],
      items.map(([k, label]) => [`${k.toUpperCase()}. ${label}`, text(r[k]) || "—"]),
      { columnStyles: { 1: { cellWidth: 150 } } });
  });
  pdfFooter(doc, ds);
  doc.save(`response${fileTag(ds)}_${String(r.id).slice(0, 12)}.pdf`);
}

/* ─── Bulk import: validation + normalization ──────────────────────────
   Import format = the survey page format, e.g. "q6": "1  Several days".
   - Any "id" in the JSON is ignored; a new id is generated in the same
     format as live survey responses: resp-<ms>-<5 random chars>.
   - A bare number ("3") or a number with any label ("3 - Moderately") is
     converted to the exact survey-page label so all data stays consistent.
   - Duplicates = same timestamp + same 29 answers as a row already in the
     table (or earlier in the same paste). They are skipped.
──────────────────────────────────────────────────────────────────────── */
const OPT = {
  s4:  ["0  Not at all", "1  Several days", "2  Half the days", "3  Nearly every day"],
  s3:  ["1  Hardly ever", "2  Sometimes", "3  Often"],
  s5s: ["1  Not stressful", "2  Slightly", "3  Moderately", "4  Very", "5  Extremely"],
  s5a: ["1  Strongly disagree", "2  Disagree", "3  Neutral", "4  Agree", "5  Strongly agree"],
  q2:  ["Undergraduate", "Graduate (Master's)", "Graduate (PhD)", "Other"],
  q3:  ["Less than 6 months", "6 to 12 months", "1 to 2 years", "More than 2 years"],
  q5:  ["Yes", "No", "Still looking for one"],
};
const FIELD_OPTS = {
  q2: OPT.q2, q3: OPT.q3, q5: OPT.q5,
  q6: OPT.s4, q7: OPT.s4, q8: OPT.s4, q9: OPT.s4,
  q10: OPT.s3, q11: OPT.s3,
  q12: OPT.s5s, q13: OPT.s5s, q14: OPT.s5s, q15: OPT.s5s, q16: OPT.s5s, q17: OPT.s5s,
};
for (let i = 18; i <= 30; i++) FIELD_OPTS[`q${i}`] = OPT.s5a;
const META_KEYS = new Set(["id", "timestamp", "source"]);

const squash = (v) => String(v).toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();

function normalizeValue(key, raw) {
  if (raw === null || raw === undefined || String(raw).trim() === "") return { error: "missing" };
  const v = String(raw).trim();
  if (key === "q1") return { value: v };
  const opts = FIELD_OPTS[key];
  if (SCALE_KEYS.includes(key)) {
    const m = v.match(/^(\d)/);
    if (!m) return { error: `"${v}" is not a scale answer` };
    const hit = opts.find((o) => o[0] === m[1]);
    return hit ? { value: hit } : { error: `"${v}" is out of range (${opts[0][0]}–${opts[opts.length - 1][0]})` };
  }
  const want = squash(v).replace(/^6 ?- ?12 months$/, "6 to 12 months").replace(/^1 ?- ?2 years$/, "1 to 2 years");
  const hit = opts.find((o) => squash(o) === want);
  return hit ? { value: hit } : { error: `"${v}" is not one of: ${opts.join(" / ")}` };
}

const fingerprint = (r) => {
  const t = r.timestamp ? new Date(r.timestamp) : null;
  const ts = t && !isNaN(t) ? t.toISOString() : "";
  return ts + "|" + CORE_KEYS.map((k) => (r[k] === null || r[k] === undefined ? "" : String(r[k]).trim())).join("|");
};

function makeId(used) {
  let id;
  do { id = `resp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; } while (used.has(id));
  used.add(id);
  return id;
}

function validateImport(text, dataset, existingRows) {
  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { return { fatal: `This isn't valid JSON: ${e.message}` }; }
  if (!Array.isArray(parsed)) {
    if (parsed && typeof parsed === "object") parsed = [parsed];
    else return { fatal: "The JSON must be an array of response objects: [ { ... }, { ... } ]" };
  }
  if (!parsed.length) return { fatal: "The array is empty." };

  const seen = new Set((existingRows || []).map(fingerprint));
  const usedIds = new Set((existingRows || []).map((r) => r.id));
  const ready = [], invalid = [], dupes = [], unknownKeys = new Set();
  let pseudoInReal = 0;
  const defaultSource = dataset === "pseudo" ? "pseudo-data" : "paper-form";

  parsed.forEach((obj, i) => {
    const rowNo = i + 1;
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) { invalid.push({ rowNo, issues: ["not an object"] }); return; }
    Object.keys(obj).forEach((k) => { if (!META_KEYS.has(k) && !CORE_KEYS.includes(k)) unknownKeys.add(k); });

    const issues = [];
    const t = obj.timestamp ? new Date(obj.timestamp) : null;
    if (!t || isNaN(t)) issues.push(obj.timestamp ? `timestamp "${obj.timestamp}" is not a valid date` : "timestamp is missing");

    const out = {};
    CORE_KEYS.forEach((k) => {
      const r = normalizeValue(k, obj[k]);
      if (r.error) issues.push(`${k.toUpperCase()}: ${r.error}`); else out[k] = r.value;
    });
    if (issues.length) { invalid.push({ rowNo, issues }); return; }

    const source = obj.source && String(obj.source).trim() ? String(obj.source).trim() : defaultSource;
    if (dataset === "real" && /pseudo/i.test(source)) pseudoInReal++;
    const row = { timestamp: t.toISOString(), source, ...out };
    const fp = fingerprint(row);
    if (seen.has(fp)) { dupes.push(rowNo); return; }
    seen.add(fp);
    ready.push({ id: makeId(usedIds), ...row });
  });

  return { total: parsed.length, ready, invalid, dupes, unknownKeys: [...unknownKeys], pseudoInReal, sample: parsed[0] };
}

function BulkImportModal({ dataset, table, existingRows, insertRows, onClose }) {
  const [text, setText]       = useState("");
  const [check, setCheck]     = useState(null);
  const [busy, setBusy]       = useState(false);
  const [summary, setSummary] = useState(null);
  const isPseudo = dataset === "pseudo";

  useEffect(() => {
    const k = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [busy, onClose]);

  const runValidate = () => { setSummary(null); setCheck(validateImport(text, dataset, existingRows)); };
  const blocked = check && !check.fatal && check.pseudoInReal > 0;
  const canImport = check && !check.fatal && !blocked && check.ready.length > 0 && !busy;

  const runImport = async () => {
    setBusy(true);
    const { inserted, failed } = await insertRows(check.ready);
    setSummary({ inserted, failed: failed + check.invalid.length, dupes: check.dupes.length });
    setCheck(null);
    setText("");
    setBusy(false);
  };

  const box = { border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, lineHeight: 1.55, marginBottom: 10 };

  return (
    <div role="dialog" aria-modal="true" aria-label="Bulk import JSON"
      style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={() => !busy && onClose()} style={{ position: "absolute", inset: 0, background: "rgba(8,20,15,0.55)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", background: "var(--bg)",
        border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Bulk Import JSON</div>
            <div style={{ fontSize: 12, color: C.dim }}>
              Importing into <strong style={{ color: isPseudo ? MAROON : C.text }}>{isPseudo ? "Pseudo Data" : "Real Data"}</strong> ({table})
            </div>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Close" style={{ ...btn(false), padding: 8 }}><X size={15} /></button>
        </div>

        {summary && (
          <div style={{ ...box, background: C.primaryDim, borderColor: "transparent", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <CheckCircle2 size={16} style={{ color: C.primary, flexShrink: 0, marginTop: 1 }} />
            <div style={{ color: C.text }}>
              <strong>{summary.inserted} inserted, {summary.failed} failed, {summary.dupes} duplicates skipped.</strong>
              {summary.failed > 0 && <div style={{ color: C.dim }}>Failed rows were not imported. Fix them and paste just those rows again.</div>}
            </div>
          </div>
        )}

        <label htmlFor="bulk-json" style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>
          Paste a JSON array of responses
        </label>
        <textarea id="bulk-json" value={text} onChange={(e) => { setText(e.target.value); setCheck(null); }}
          placeholder={'[\n  { "timestamp": "2026-10-01T10:00:00.000Z", "source": "' + (isPseudo ? "pseudo-data" : "paper-form") + '", "q1": "Nigeria", "q2": "Graduate (Master\'s)", ... },\n  { ... }\n]'}
          spellCheck={false}
          style={{ width: "100%", minHeight: 220, padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.deep,
            color: C.text, fontSize: 12, fontFamily: "ui-monospace, Menlo, Consolas, monospace", resize: "vertical", marginBottom: 10 }} />
        <div style={{ fontSize: 11, color: C.dim, marginBottom: 12, lineHeight: 1.5 }}>
          Any <code>id</code> in the JSON is ignored, and each row gets a new ID in the same format as live survey responses.
          Rows need a <code>timestamp</code> and answers to all 29 questions. If <code>source</code> is left out it is set to "{isPseudo ? "pseudo-data" : "paper-form"}".
        </div>

        {check?.fatal && (
          <div role="alert" style={{ ...box, background: C.dangerDim, borderColor: "transparent", color: C.text }}>{check.fatal}</div>
        )}

        {check && !check.fatal && (
          <div>
            {blocked && (
              <div role="alert" style={{ ...box, background: C.dangerDim, borderColor: "transparent", color: C.text, display: "flex", gap: 8 }}>
                <AlertTriangle size={16} style={{ color: C.danger, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>Import stopped.</strong> {check.pseudoInReal} row{check.pseudoInReal === 1 ? " is" : "s are"} marked as pseudo data, but you are viewing Real Data.
                  Switch to Pseudo Data at the top of the Survey tab, then import again. Pseudo rows would be impossible to tell apart from real ones once they are in the real table.
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {[["Rows found", check.total, C.text], ["Ready to import", check.ready.length, C.primary],
                ["Duplicates", check.dupes.length, C.dim], ["Invalid", check.invalid.length, check.invalid.length ? C.danger : C.dim]].map(([l, v, col]) => (
                <div key={l} style={{ flex: 1, minWidth: 110, background: C.surface2, borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 11, color: C.dim }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: col }}>{v}</div>
                </div>
              ))}
            </div>

            {check.invalid.length > 0 && (
              <div style={{ ...box, borderColor: C.danger }}>
                <div style={{ fontWeight: 700, color: C.danger, marginBottom: 4 }}>
                  {check.invalid.length} row{check.invalid.length === 1 ? "" : "s"} won't be imported:
                </div>
                {check.invalid.slice(0, 6).map((r) => (
                  <div key={r.rowNo} style={{ color: C.text }}>Row {r.rowNo}: {r.issues.slice(0, 3).join("; ")}{r.issues.length > 3 ? ` (+${r.issues.length - 3} more)` : ""}</div>
                ))}
                {check.invalid.length > 6 && <div style={{ color: C.dim }}>…and {check.invalid.length - 6} more.</div>}
              </div>
            )}

            {check.unknownKeys.length > 0 && (
              <div style={{ ...box, color: C.dim }}>
                Ignored fields not in the survey: {check.unknownKeys.join(", ")}
              </div>
            )}

            {check.sample && typeof check.sample === "object" && (
              <details style={{ ...box }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, color: C.text }}>First row preview</summary>
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px" }}>
                  {["timestamp", "source", ...CORE_KEYS].map((k) => (
                    <React.Fragment key={k}>
                      <span style={{ color: C.dim }}>{k}</span>
                      <span style={{ color: C.text, wordBreak: "break-word" }}>{check.sample[k] === undefined ? "—" : String(check.sample[k])}</span>
                    </React.Fragment>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button onClick={runValidate} disabled={!text.trim() || busy} style={{ ...btn(false), opacity: text.trim() && !busy ? 1 : 0.5 }}>
            Validate
          </button>
          <button onClick={runImport} disabled={!canImport} style={{ ...btn(true), opacity: canImport ? 1 : 0.5 }}>
            <Upload size={13} /> {busy ? "Importing…" : `Import ${check && !check.fatal ? check.ready.length : ""} responses`.replace("  ", " ")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── UI ─────────────────────────────────────────────────────────────── */
const C = {
  primary: "var(--primary)", primaryDim: "var(--primary-dim)", text: "var(--text)",
  dim: "var(--text-dim)", border: "var(--border)", surface: "var(--surface)",
  surface2: "var(--surface2)", deep: "var(--bg-deep)", danger: "var(--danger)",
  dangerDim: "var(--danger-dim)", onPrimary: "var(--on-primary)",
};

const btn = (filled) => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8,
  fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
  background: filled ? C.primary : C.surface, color: filled ? C.onPrimary : C.text,
  border: filled ? "none" : `1px solid ${C.border}`,
});

function Chip({ children, risk }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
      marginRight: 4, marginBottom: 2, whiteSpace: "nowrap",
      background: risk ? C.dangerDim : C.surface2, color: risk ? C.danger : C.dim,
    }}>{children}</span>
  );
}

function DetailPanel({ row, onClose, onDelete, ds }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Response details"
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(8,20,15,0.55)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 520, height: "100%", overflowY: "auto",
        background: "var(--bg)", borderLeft: `1px solid ${C.border}`, animation: "fadeIn .2s ease" }}>
        <div style={{ position: "sticky", top: 0, background: "var(--bg)", padding: "16px 18px",
          borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Response details</div>
            <div style={{ fontSize: 12, color: C.dim }}>{fmtDate(row.timestamp)}</div>
            <div style={{ fontSize: 10, color: C.dim, wordBreak: "break-all" }}>
              {ds === "pseudo" ? `Pseudo data${row.source ? ` (${row.source})` : ""}` : row.source === "paper-form" ? "Paper form" : row._origin === "table" ? "Survey page" : row.source === "manual" ? "Manual entry" : "In-app form"} · {row.id}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ ...btn(false), padding: 8 }}><X size={15} /></button>
        </div>

        <div style={{ padding: "14px 18px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["PHQ-2", row._phq2, row._atRisk ? "At or above cut-off" : "Below cut-off"],
            ["GAD-2", row._gad2, ""],
            ["Answered", `${row._answered}/${CORE_KEYS.length}`, ""]].map(([l, v, s]) => (
            <div key={l} style={{ flex: 1, minWidth: 90, background: C.surface2, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: C.dim }}>{l}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: l === "PHQ-2" && row._atRisk ? C.danger : C.text }}>{v ?? "—"}</div>
              {s && <div style={{ fontSize: 10, color: C.dim }}>{s}</div>}
            </div>
          ))}
        </div>

        {row._flags.length > 0 && (
          <div style={{ padding: "0 18px 8px" }}>{row._flags.map((f) => <Chip key={f}>{f}</Chip>)}</div>
        )}

        <div style={{ padding: "0 18px 12px", display: "flex", gap: 8 }}>
          <button onClick={() => exportResponsePDF(row, ds)} style={btn(true)}><FileText size={13} /> Download PDF</button>
          <button
            onClick={() => { if (window.confirm("Delete this response permanently? This cannot be undone.")) { onDelete(row); onClose(); } }}
            style={{ ...btn(false), color: C.danger }}
          ><Trash2 size={13} /> Delete</button>
        </div>

        <div style={{ padding: "4px 18px 40px" }}>
          {SECTIONS.map((s) => {
            const items = s.items;
            return (
              <div key={s.title} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 6 }}>{s.title}</div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", background: C.surface }}>
                  {items.map(([k, label], i) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 12px",
                      fontSize: 12, borderTop: i ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ color: C.text }}><span style={{ color: C.dim, marginRight: 6 }}>{k.toUpperCase()}</span>{label}</span>
                      <span style={{ fontWeight: 700, color: C.text, textAlign: "right", flexShrink: 0, maxWidth: "45%" }}>{text(row[k]) || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ResponsesTab({ rows, tableRows = [], loading, error, reload, lastLoaded, removeRow, insertRows, dataset = "real", table }) {
  const ds = dataset;
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "risk" && !r._atRisk) return false;
      if (filter === "flagged" && !r._flags.length) return false;
      if (filter === "clean" && r._flags.length) return false;
      if (!q) return true;
      return [r.q1, r.q2, r.q3, r.q5, r.source, r.id].some((v) => v && String(v).toLowerCase().includes(q));
    });
  }, [rows, query, filter]);

  const flagged = rows.filter((r) => r._flags.length).length;
  const downloads = [
    ["Summary report (PDF)", () => exportSummaryPDF(rows, ds)],
    ["Analysis-ready data (CSV)", () => exportAnalysisCSV(rows, ds)],
    ["R analysis script (.R)", () => exportRScript(ds)],
    ["Raw responses (CSV)", () => exportRawCSV(rows, ds)],
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ds === "pseudo" ? "Pseudo responses" : "All responses"}</div>
          <div style={{ fontSize: 11, color: C.dim }}>
            {loading ? "Loading…" : `${flagged} need a look · ${rows.length - flagged} clean${lastLoaded ? ` · updated ${fmtDate(lastLoaded)}` : ""}`}
          </div>
        </div>
        <button onClick={() => setImportOpen(true)} style={btn(false)}>
          <Upload size={13} /> Bulk Import JSON
        </button>
        <button onClick={reload} disabled={loading} style={{ ...btn(false), opacity: loading ? 0.5 : 1 }}>
          <RefreshCcw size={13} /> Refresh
        </button>
        <div style={{ position: "relative" }}>
          <button onClick={() => setMenu((m) => !m)} disabled={!rows.length} aria-expanded={menu}
            style={{ ...btn(true), opacity: rows.length ? 1 : 0.5 }}>
            <Download size={13} /> Download
          </button>
          {menu && (
            <div style={{ position: "absolute", right: 0, top: 40, zIndex: 40, width: 230, background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
              {downloads.map(([label, run]) => (
                <button key={label} onClick={() => { run(); setMenu(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 6,
                    background: "none", border: "none", color: C.text, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: C.text, background: C.dangerDim, border: `1px solid ${C.danger}`,
          borderRadius: 10, padding: "10px 12px", marginBottom: 10, lineHeight: 1.5 }}>{error}</div>
      )}

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search country, level, source"
          aria-label="Search responses"
          style={{ flex: 1, minWidth: 160, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.deep, color: C.text, fontSize: 13, fontFamily: "inherit" }} />
        <div role="group" aria-label="Filter" style={{ display: "flex", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 99, padding: 3 }}>
          {[["all", "All"], ["risk", "PHQ-2 ≥ 3"], ["flagged", "Flagged"], ["clean", "Clean"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k}
              style={{ padding: "5px 10px", borderRadius: 99, border: "none", fontSize: 11, fontFamily: "inherit", cursor: "pointer",
                fontWeight: filter === k ? 600 : 400, background: filter === k ? C.primary : "none",
                color: filter === k ? C.onPrimary : C.dim }}>{l}</button>
          ))}
        </div>
      </div>

      {!loading && rows.length === 0 && (
        <div style={{ fontSize: 13, color: C.dim, padding: 16, border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface }}>
          No responses yet. Share the QR code or survey link, then select Refresh.
        </div>
      )}
      {rows.length > 0 && visible.length === 0 && (
        <div style={{ fontSize: 13, color: C.dim, padding: 16, border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface }}>
          No responses match this search or filter.
        </div>
      )}

      {visible.length > 0 && (
        <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.border}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: C.text }}>
            <thead>
              <tr style={{ background: C.surface2 }}>
                {["Submitted", "Country", "Level", "Time in US", "PHQ-2", "GAD-2", "Flags"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: h.startsWith("PHQ") || h.startsWith("GAD") ? "center" : "left",
                    fontWeight: 600, whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={r.id} tabIndex={0} onClick={() => setSelected(r)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(r)}
                  style={{ cursor: "pointer", background: i % 2 ? C.deep : C.surface }}>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }}>{fmtDate(r.timestamp)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>{text(r.q1) || "—"}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }}>{text(r.q2).split(" (")[0] || "—"}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }}>{text(r.q3) || "—"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: r._atRisk ? C.danger : C.text, borderBottom: `1px solid ${C.border}` }}>{r._phq2 ?? "—"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{r._gad2 ?? "—"}</td>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                    {r._atRisk && <Chip risk>PHQ-2 ≥ 3</Chip>}
                    {r._flags.map((f) => <Chip key={f}>{f}</Chip>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visible.length > 0 && (
        <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>
          Showing {visible.length} of {rows.length}. Tap a row to see the full response.
        </div>
      )}

      {selected && <DetailPanel row={selected} onClose={() => setSelected(null)} onDelete={removeRow} ds={ds} />}
      {importOpen && (
        <BulkImportModal
          dataset={ds}
          table={table}
          existingRows={tableRows}
          insertRows={insertRows}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
