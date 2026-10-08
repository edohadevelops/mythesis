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
import { Download, RefreshCcw, Trash2, X, FileText } from "lucide-react";

const TABLE = "thesis_responses";
const PDF_GREEN = "#2f6b4f";

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
export function useAllResponses({ sbUrl, sbKey, localResponses = [], onDeleteLocal }) {
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
      setError(`Couldn't load survey-page responses (${e.message}). In-app and manual entries are still shown. Check that reads are allowed on ${TABLE}.`);
    }
    setLoading(false);
  }, [sbUrl, headers]);

  useEffect(() => { reload(); }, [reload]);

  const rows = useMemo(() => {
    const byId = new Map();
    tableRows.forEach((r) => byId.set(r.id, { ...r, _origin: "table" }));
    (localResponses || []).forEach((r) => { if (!byId.has(r.id)) byId.set(r.id, { ...r, _origin: "app" }); });
    const merged = [...byId.values()].sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
    return enrich(merged);
  }, [tableRows, localResponses]);

  const removeRow = useCallback(async (row) => {
    if (row._origin === "app") { onDeleteLocal?.(row.id); return; }
    const res = await fetch(`${sbUrl}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(row.id)}`, { method: "DELETE", headers });
    if (!res.ok) { alert(`Delete failed: ${res.status}. The table may not allow deletes for this key — delete it in Supabase instead.`); return; }
    setTableRows((rs) => rs.filter((r) => r.id !== row.id));
  }, [sbUrl, headers, onDeleteLocal]);

  return { rows, loading, error, reload, lastLoaded, removeRow };
}

/* ─── Exports ────────────────────────────────────────────────────────── */
function exportRawCSV(rows) {
  const out = rows.map((r) => ({ ...r, origin: r._origin }));
  downloadBlob(toCSV(out, ["id", "timestamp", "source", "origin", ...ALL_KEYS]), `thesis_responses_raw_${today()}.csv`, "text/csv");
}

function exportAnalysisCSV(rows) {
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
  downloadBlob(toCSV(out, cols), `thesis_analysis_${today()}.csv`, "text/csv");
}

function exportRScript() {
  const d = today();
  const r = `# ============================================================
# Predictors of Mental Health Vulnerability Among International
# Students — analysis script (generated ${d})
#
# 1. Save this in the same folder as thesis_analysis_${d}.csv
# 2. Run top to bottom
# ============================================================

pkgs <- c("tidyverse", "psych", "glmnet", "pROC", "car", "ResourceSelection")
new <- pkgs[!pkgs %in% installed.packages()[, "Package"]]
if (length(new)) install.packages(new)
invisible(lapply(pkgs, library, character.only = TRUE))
set.seed(42)

# ---- 1. Load and clean ----------------------------------------
dat <- read_csv("thesis_analysis_${d}.csv", show_col_types = FALSE)

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

saveRDS(list(clean = clean, full = full, cv_fit = cv_fit, roc = roc_obj), "thesis_results.rds")
`;
  downloadBlob(r, "thesis_analysis.R", "text/plain");
}

function pdfHeader(doc, title, subtitle) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(PDF_GREEN); doc.rect(0, 0, w, 62, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(title, 40, 31);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(subtitle, 40, 48);
  doc.setTextColor("#222222");
}

function pdfFooter(doc) {
  const n = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor("#888888");
    doc.text("Confidential research data, IRB-FY2027-49. Anonymous responses.", 40, h - 20);
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

function exportSummaryPDF(rows) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  pdfHeader(doc, "Survey summary report", `First 90 thesis survey   |   Generated ${fmtDate(new Date())}`);
  const n = rows.length;
  const pct = (x) => (n ? `${((100 * x) / n).toFixed(1)}%` : "—");
  const atRisk = rows.filter((r) => r._atRisk).length;
  const flagged = rows.filter((r) => r._flags.length).length;

  tbl(doc, 84, ["Overview", "Value"], [
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
  pdfHeader(doc, "Item descriptives", "Means and standard deviations, all responses");
  tbl(doc, 84, ["Item", "Question", "n", "Mean", "SD"], items, {
    styles: { fontSize: 8.5, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 36 }, 2: { cellWidth: 30 }, 3: { cellWidth: 40 }, 4: { cellWidth: 40 } },
  });

  const fl = rows.filter((r) => r._flags.length);
  if (fl.length) {
    tbl(doc, doc.lastAutoTable.finalY + 16, ["Response ID", "Submitted", "Flags"],
      fl.map((r) => [String(r.id).slice(0, 14), fmtDate(r.timestamp), r._flags.join(", ")]));
  }
  pdfFooter(doc);
  doc.save(`thesis_summary_report_${today()}.pdf`);
}

function exportResponsePDF(r) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  pdfHeader(doc, "Survey response", `ID ${String(r.id).slice(0, 20)}   |   Submitted ${fmtDate(r.timestamp)}`);
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
  pdfFooter(doc);
  doc.save(`response_${String(r.id).slice(0, 12)}.pdf`);
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

function DetailPanel({ row, onClose, onDelete }) {
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
              {row._origin === "table" ? "Survey page" : row.source === "manual" ? "Manual entry" : "In-app form"} · {row.id}
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
          <button onClick={() => exportResponsePDF(row)} style={btn(true)}><FileText size={13} /> Download PDF</button>
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

export default function ResponsesTab({ rows, loading, error, reload, lastLoaded, removeRow }) {
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
    ["Summary report (PDF)", () => exportSummaryPDF(rows)],
    ["Analysis-ready data (CSV)", () => exportAnalysisCSV(rows)],
    ["R analysis script (.R)", exportRScript],
    ["Raw responses (CSV)", () => exportRawCSV(rows)],
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>All responses</div>
          <div style={{ fontSize: 11, color: C.dim }}>
            {loading ? "Loading…" : `${flagged} need a look · ${rows.length - flagged} clean${lastLoaded ? ` · updated ${fmtDate(lastLoaded)}` : ""}`}
          </div>
        </div>
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

      {selected && <DetailPanel row={selected} onClose={() => setSelected(null)} onDelete={removeRow} />}
    </div>
  );
}
