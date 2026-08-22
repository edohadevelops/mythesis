/**
 * SurveyPage.jsx — Standalone public survey
 * Deployed at /survey.html — participants see ONLY the survey.
 * QR code points here. On submit, saves to Supabase thesis_responses table.
 *
 * Supabase table:
 *   create table thesis_responses (
 *     id text primary key,
 *     timestamp timestamptz,
 *     source text,
 *     q1 text, q2 text, q3 text, q4 text, q5 text,
 *     q6 text, q7 text, q8 text, q9 text, q10 text, q11 text,
 *     q12 text, q13 text, q14 text, q15 text, q16 text, q17 text,
 *     q18 text, q19 text, q20 text,
 *     q21 text, q22 text, q23 text, q24 text, q25 text,
 *     q26 text, q27 text, q28 text, q29 text, q30 text
 *   );
 */

import React, { useState } from "react";

const SB_URL = "https://sonbphyeomzzcdyuiotl.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbmJwaHllb216emNkeXVpb3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzkxMjksImV4cCI6MjA4ODgxNTEyOX0.CtcZAFtqCQUOrzPBfhSfN5BZ1EQDJFVxa-FsjMX5IRg";

async function saveResponse(data) {
  const res = await fetch(`${SB_URL}/rest/v1/thesis_responses`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

const SCALE4       = ["0 — Not at all","1 — Several days","2 — More than half the days","3 — Nearly every day"];
const SCALE3       = ["1 — Hardly ever","2 — Sometimes","3 — Often"];
const SCALE5_STRESS= ["1 — Not at all stressful","2 — Slightly stressful","3 — Moderately stressful","4 — Very stressful","5 — Extremely stressful"];
const SCALE5_AGREE = ["1 — Strongly disagree","2 — Disagree","3 — Neutral","4 — Agree","5 — Strongly agree"];

const SECTIONS = [
  { id:"s1", title:"Section 1 — About you", note:null, fields:[
    { id:"q1",  label:"What country are you from?", type:"text" },
    { id:"q2",  label:"What is your current level of study?", type:"radio", opts:["Undergraduate","Graduate (Master's)","Graduate (PhD)","Other"] },
    { id:"q3",  label:"How long have you been in the United States?", type:"radio", opts:["Less than 6 months","6 to 12 months","1 to 2 years","More than 2 years"] },
    { id:"q4",  label:"What is your gender?", type:"radio", opts:["Man","Woman","Non-binary","Prefer not to say","Prefer to self-describe"] },
    { id:"q5",  label:"Do you have an active faith or religious community here in the US?", type:"radio", opts:["Yes","No","Still looking for one"] },
  ]},
  { id:"s2", title:"Section 2 — How you have been feeling", note:"Over the last 2 weeks, how often have you been bothered by the following?", fields:[
    { id:"q6",  label:"Little interest or pleasure in doing things", type:"radio", opts:SCALE4 },
    { id:"q7",  label:"Feeling down, depressed, or hopeless", type:"radio", opts:SCALE4 },
  ]},
  { id:"s3", title:"Section 3 — Anxiety", note:"Over the last 2 weeks, how often have you been bothered by the following?", fields:[
    { id:"q8",  label:"Feeling nervous, anxious, or on edge", type:"radio", opts:SCALE4 },
    { id:"q9",  label:"Not being able to stop or control worrying", type:"radio", opts:SCALE4 },
  ]},
  { id:"s4", title:"Section 4 — Social connection", note:"How often do you feel the following?", fields:[
    { id:"q10", label:"I feel that I lack companionship", type:"radio", opts:SCALE3 },
    { id:"q11", label:"I feel isolated from other people", type:"radio", opts:SCALE3 },
  ]},
  { id:"s5", title:"Section 5 — Adjusting to life in the US", note:"How stressful have you found the following?", fields:[
    { id:"q12", label:"I feel that people here do not understand my cultural values", type:"radio", opts:SCALE5_STRESS },
    { id:"q13", label:"I miss my family and friends back home", type:"radio", opts:SCALE5_STRESS },
    { id:"q14", label:"I feel that people here treat me differently because of where I am from", type:"radio", opts:SCALE5_STRESS },
    { id:"q15", label:"I am afraid I will not be able to complete my studies here", type:"radio", opts:SCALE5_STRESS },
    { id:"q16", label:"Adjusting to a new way of life here has been difficult for me", type:"radio", opts:SCALE5_STRESS },
    { id:"q17", label:"I feel guilty about leaving my family back home", type:"radio", opts:SCALE5_STRESS },
  ]},
  { id:"s6", title:"Section 6 — Financial situation", note:"How much do you agree with the following?", fields:[
    { id:"q18", label:"I feel stressed about my ability to cover my basic expenses here", type:"radio", opts:SCALE5_AGREE },
    { id:"q19", label:"My financial situation affects my ability to focus on my studies", type:"radio", opts:SCALE5_AGREE },
    { id:"q20", label:"I have had to go without something I needed because I could not afford it", type:"radio", opts:SCALE5_AGREE },
  ]},
  { id:"s7", title:"Section 7 — Your experience as an international student", note:"How much do you agree with the following?", fields:[
    { id:"q21", label:"Since arriving in the US, I have found it difficult to maintain my faith or spiritual practice", type:"radio", opts:SCALE5_AGREE },
    { id:"q22", label:"My faith community has been a source of strength during my time here", type:"radio", opts:SCALE5_AGREE },
    { id:"q23", label:"I frequently worry about changes to immigration policy affecting my student visa", type:"radio", opts:SCALE5_AGREE },
    { id:"q24", label:"Uncertainty about my visa status affects my ability to focus on my studies", type:"radio", opts:SCALE5_AGREE },
    { id:"q25", label:"I have had difficulty finding suitable housing since arriving in the US", type:"radio", opts:SCALE5_AGREE },
    { id:"q26", label:"I feel uncomfortable seeking help from a counselor or therapist", type:"radio", opts:SCALE5_AGREE },
    { id:"q27", label:"I do not know how to access mental health or medical services at my university", type:"radio", opts:SCALE5_AGREE },
    { id:"q28", label:"I find it difficult to access foods that are familiar to me from home", type:"radio", opts:SCALE5_AGREE },
    { id:"q29", label:"I feel nervous speaking up in class or participating in academic discussions", type:"radio", opts:SCALE5_AGREE },
    { id:"q30", label:"I sometimes avoid reaching out to professors or staff because I am unsure how to communicate with them", type:"radio", opts:SCALE5_AGREE },
  ]},
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

function phq2Score(form) {
  return (parseInt(form.q6?.[0]) || 0) + (parseInt(form.q7?.[0]) || 0);
}

const GREEN  = "#2f6b4f";
const GREEN2 = "rgba(47,107,79,0.12)";
const GREEN3 = "rgba(47,107,79,0.4)";
const RED    = "#b3503d";
const REDBG  = "#faecea";
const REDBR  = "rgba(179,80,61,0.4)";
const GRAY   = "#dde3da";
const TEXT   = "#1c2a22";
const DIM    = "#5a6f62";
const BG     = "#f7f5ef";

export default function SurveyPage() {
  const [form,        setForm]        = useState({});
  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const setField = (id, val) => {
    setForm((f) => ({ ...f, [id]: val }));
    setErrors((e) => ({ ...e, [id]: false }));
  };

  const validate = () => {
    const errs = {};
    ALL_FIELDS.forEach((f) => { if (!form[f.id] || !form[f.id].trim()) errs[f.id] = true; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      const first = ALL_FIELDS.find((f) => !form[f.id] || !form[f.id].trim());
      if (first) document.getElementById(`f-${first.id}`)?.scrollIntoView({ behavior:"smooth", block:"center" });
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const payload = {
      id:        `resp-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      timestamp: new Date().toISOString(),
      source:    "qr-survey",
      ...form,
    };
    try {
      await saveResponse(payload);
      setSubmitted(true);
      window.scrollTo({ top:0, behavior:"smooth" });
    } catch (err) {
      setSubmitError("Something went wrong saving your response. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const distress = phq2Score(form) >= 3;

  if (submitted) {
    return (
      <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Sora',-apple-system,sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
        <div style={{ background:"#fff", borderRadius:16, padding:"32px 24px", maxWidth:420, width:"100%", textAlign:"center", border:`1px solid ${GRAY}` }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:GREEN2, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:26 }}>✓</div>
          <div style={{ fontSize:20, fontWeight:700, color:TEXT, marginBottom:8 }}>Thank you!</div>
          <div style={{ fontSize:14, color:DIM, lineHeight:1.65 }}>
            Your response has been recorded anonymously. It contributes to research that may help future international students receive better support.
          </div>
          {distress && (
            <div style={{ background:REDBG, border:`1px solid ${REDBR}`, borderRadius:10, padding:"14px 16px", marginTop:20, textAlign:"left" }}>
              <div style={{ fontSize:13, fontWeight:700, color:RED, marginBottom:6 }}>Support is available</div>
              <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>
                If any questions brought up difficult feelings:<br/>
                • MSU Counseling Services: <strong>(417) 836-5116</strong><br/>
                • 988 Lifeline: <strong>call or text 988</strong><br/>
                • Crisis Text Line: <strong>text HOME to 741741</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{margin:0}`}</style>
      <div style={{ minHeight:"100vh", background:BG, fontFamily:"'Sora',-apple-system,sans-serif", paddingBottom:80 }}>

        {/* Header */}
        <div style={{ background:GREEN, color:"#f6fbf7", padding:"20px 20px 24px" }}>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>International Student Wellbeing Survey</div>
          <div style={{ fontSize:13, opacity:0.85, lineHeight:1.55 }}>Missouri State University · IRB approved (FWA 00004733) · Anonymous · 6–8 minutes</div>
        </div>

        <div style={{ maxWidth:640, margin:"0 auto", padding:"0 16px" }}>

          {/* Consent */}
          <div style={{ background:"#fff", border:`1px solid ${GRAY}`, borderRadius:10, padding:16, marginTop:20, fontSize:12, color:DIM, lineHeight:1.7 }}>
            <div style={{ fontSize:12, fontWeight:700, color:GREEN, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>Informed consent</div>
            This survey is part of an IRB-approved research study examining factors that affect the wellbeing of international students in the United States. Participation is completely <strong>voluntary and anonymous</strong>. No names, email addresses, or identifying information are collected. You may stop at any time without any consequence to your academic standing or immigration status.
            <br/><br/>
            PI: Amen Engworo Edoha · Supervisor: Dr. Songfeng Zheng · Missouri State University
          </div>

          {/* Sections */}
          {SECTIONS.map((section) => (
            <div key={section.id} style={{ marginTop:28 }}>
              <div style={{ fontSize:13, fontWeight:700, color:GREEN, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>{section.title}</div>
              {section.note && <div style={{ fontSize:12, color:DIM, marginBottom:14, lineHeight:1.6 }}>{section.note}</div>}

              {section.fields.map((field) => {
                const qNum  = ALL_FIELDS.indexOf(field) + 1;
                const hasErr = errors[field.id];
                return (
                  <div key={field.id} id={`f-${field.id}`} style={{ marginBottom:14, padding:"14px 16px", borderRadius:10, background: hasErr ? "#fdf4f3" : "#fff", border:`1px solid ${hasErr ? RED : GRAY}` }}>
                    <div style={{ fontSize:14, fontWeight:500, color:TEXT, lineHeight:1.5, marginBottom:10 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:GREEN, marginRight:6 }}>Q{qNum}</span>
                      {field.label}
                      <span style={{ color:RED }}> *</span>
                    </div>

                    {field.type === "text" ? (
                      <input
                        type="text"
                        value={form[field.id] || ""}
                        onChange={(e) => setField(field.id, e.target.value)}
                        placeholder="Type your answer..."
                        style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${GRAY}`, background:BG, color:TEXT, fontSize:14, fontFamily:"inherit" }}
                      />
                    ) : (
                      field.opts.map((opt) => {
                        const sel = form[field.id] === opt;
                        return (
                          <div
                            key={opt}
                            onClick={() => setField(field.id, opt)}
                            style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, background: sel ? GREEN2 : BG, border:`1px solid ${sel ? GREEN3 : GRAY}`, fontSize:13, color:TEXT, cursor:"pointer", marginBottom:6 }}
                          >
                            <input type="radio" name={field.id} value={opt} checked={sel} onChange={() => setField(field.id, opt)} style={{ accentColor:GREEN, flexShrink:0, width:17, height:17 }} />
                            {opt}
                          </div>
                        );
                      })
                    )}

                    {hasErr && <div style={{ fontSize:12, color:RED, marginTop:6 }}>Please answer this question</div>}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Distress warning */}
          {distress && (
            <div style={{ background:REDBG, border:`1px solid ${REDBR}`, borderRadius:10, padding:"14px 16px", marginTop:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:RED, marginBottom:6 }}>Support is available</div>
              <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>
                Your responses suggest you may be experiencing some emotional difficulties. Please consider reaching out:<br/>
                • MSU Counseling Services: <strong>(417) 836-5116</strong><br/>
                • 988 Lifeline: <strong>call or text 988</strong><br/>
                • Crisis Text Line: <strong>text HOME to 741741</strong>
              </div>
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div style={{ background:REDBG, border:`1px solid ${REDBR}`, borderRadius:10, padding:"12px 16px", marginTop:16, fontSize:13, color:RED }}>
              {submitError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width:"100%", padding:"15px 0", borderRadius:12, background: submitting ? "#9fb5a6" : GREEN, color:"#f6fbf7", border:"none", cursor: submitting ? "not-allowed" : "pointer", fontSize:16, fontWeight:700, fontFamily:"inherit", marginTop:24 }}
          >
            {submitting ? "Saving your response…" : "Submit — anonymous and confidential"}
          </button>

          <div style={{ fontSize:11, color:"#9fb5a6", textAlign:"center", marginTop:14, lineHeight:1.6 }}>
            Responses are stored securely and accessed only by the research team.<br/>
            Questions? irb@missouristate.edu
          </div>
        </div>
      </div>
    </>
  );
}
