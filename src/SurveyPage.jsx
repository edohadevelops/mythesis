import React, { useState, useRef } from "react";
import { BEAR_SRC } from "./bearLogo";

const SB_URL = "https://sonbphyeomzzcdyuiotl.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbmJwaHllb216emNkeXVpb3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzkxMjksImV4cCI6MjA4ODgxNTEyOX0.CtcZAFtqCQUOrzPBfhSfN5BZ1EQDJFVxa-FsjMX5IRg";

function saveLocalBackup(data) {
  try {
    const ex = JSON.parse(localStorage.getItem("thesis_responses_backup") || "[]");
    ex.push({ ...data, savedLocally: new Date().toISOString() });
    localStorage.setItem("thesis_responses_backup", JSON.stringify(ex));
  } catch (e) {}
}

async function saveResponse(data) {
  saveLocalBackup(data);
  try {
    const res = await fetch(SB_URL + "/rest/v1/thesis_responses", {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(data),
    });
    if (!res.ok) console.error("Supabase error:", await res.text());
  } catch (e) { console.error("Network error:", e); }
  return true;
}

const S4 = ["0  Not at all", "1  Several days", "2  Half the days", "3  Nearly every day"];
const S3 = ["1  Hardly ever", "2  Sometimes", "3  Often"];
const S5S = ["1  Not stressful", "2  Slightly", "3  Moderately", "4  Very", "5  Extremely"];
const S5A = ["1  Strongly disagree", "2  Disagree", "3  Neutral", "4  Agree", "5  Strongly agree"];

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Benin","Bolivia","Bosnia","Botswana","Brazil","Bulgaria","Burkina Faso","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Cuba","Czech Republic","Denmark","Dominican Republic","DR Congo","Ecuador","Egypt","El Salvador","Ethiopia","Finland","France","Georgia","Germany","Ghana","Greece","Guatemala","Guinea","Haiti","Honduras","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Laos","Lebanon","Liberia","Libya","Lithuania","Madagascar","Malawi","Malaysia","Mali","Mauritania","Mexico","Moldova","Mongolia","Morocco","Mozambique","Myanmar","Namibia","Nepal","Netherlands","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tunisia","Turkey","Turkmenistan","Uganda","Ukraine","United Arab Emirates","United Kingdom","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe","Other"];

const SCALE_IDS = new Set(["q6","q7","q8","q9","q10","q11","q12","q13","q14","q15","q16","q17","q18","q19","q20","q21","q22","q23","q24","q25","q26","q27","q28","q29","q30"]);

const PAGES = [
  { id:"welcome", type:"welcome", title:"International Student Wellbeing Survey", subtitle:"Missouri State University", body:"This short survey takes about 5 minutes and is completely anonymous. Your responses help us understand what international students experience and build better support systems.", fields:[] },
  { id:"s1", type:"questions", title:"About you", emoji:"Greetings", subtitle:"Just a few background questions.", fields:[
    { id:"q1", label:"What country are you from?", type:"select", opts:COUNTRIES },
    { id:"q2", label:"What is your current level of study?", type:"radio", opts:["Undergraduate","Graduate (Master's)","Graduate (PhD)","Other"] },
    { id:"q3", label:"How long have you been in the United States?", type:"radio", opts:["Less than 6 months","6 to 12 months","1 to 2 years","More than 2 years"] },
    { id:"q5", label:"Do you have an active faith or religious community here in the US?", type:"radio", opts:["Yes","No","Still looking for one"] },
  ]},
  { id:"s2", type:"questions", title:"How you have been feeling", emoji:"Thoughts", subtitle:"Over the last 2 weeks, how often have you been bothered by the following?", scaleNote:"0 = Not at all  to  3 = Nearly every day", fields:[
    { id:"q6", label:"Little interest or pleasure in doing things", type:"scale", opts:S4 },
    { id:"q7", label:"Feeling down, depressed, or hopeless", type:"scale", opts:S4 },
    { id:"q8", label:"Feeling nervous, anxious, or on edge", type:"scale", opts:S4 },
    { id:"q9", label:"Not being able to stop or control worrying", type:"scale", opts:S4 },
  ]},
  { id:"s3", type:"questions", title:"Social connection", emoji:"Handshake", subtitle:"How often do you feel the following?", scaleNote:"1 = Hardly ever  to  3 = Often", fields:[
    { id:"q10", label:"I feel that I lack companionship", type:"scale", opts:S3 },
    { id:"q11", label:"I feel isolated from other people", type:"scale", opts:S3 },
  ]},
  { id:"s4", type:"questions", title:"Adjusting to life in the US", emoji:"Plane", subtitle:"How stressful have you found the following?", scaleNote:"1 = Not at all stressful  to  5 = Extremely stressful", fields:[
    { id:"q12", label:"I feel that people here do not understand my cultural values", type:"scale", opts:S5S },
    { id:"q13", label:"I miss my family and friends back home", type:"scale", opts:S5S },
    { id:"q14", label:"I feel that people here treat me differently because of where I am from", type:"scale", opts:S5S },
    { id:"q15", label:"I am afraid I will not be able to complete my studies here", type:"scale", opts:S5S },
    { id:"q16", label:"Adjusting to a new way of life here has been difficult for me", type:"scale", opts:S5S },
    { id:"q17", label:"I feel guilty about leaving my family back home", type:"scale", opts:S5S },
  ]},
  { id:"s5", type:"questions", title:"Financial situation", emoji:"Card", subtitle:"How much do you agree with the following?", scaleNote:"1 = Strongly disagree  to  5 = Strongly agree", fields:[
    { id:"q18", label:"I feel stressed about my ability to cover my basic expenses here", type:"scale", opts:S5A },
    { id:"q19", label:"My financial situation affects my ability to focus on my studies", type:"scale", opts:S5A },
    { id:"q20", label:"I have had to go without something I needed because I could not afford it", type:"scale", opts:S5A },
  ]},
  { id:"s6", type:"questions", title:"Faith and spiritual life", emoji:"Pray", subtitle:"How much do you agree with the following?", scaleNote:"1 = Strongly disagree  to  5 = Strongly agree", fields:[
    { id:"q21", label:"Since arriving in the US, I have found it difficult to maintain my faith or spiritual practice", type:"scale", opts:S5A },
    { id:"q22", label:"My faith community has been a source of strength during my time here", type:"scale", opts:S5A },
  ]},
  { id:"s7", type:"questions", title:"Visa, housing and support", emoji:"Home", subtitle:"How much do you agree with the following?", scaleNote:"1 = Strongly disagree  to  5 = Strongly agree", fields:[
    { id:"q23", label:"I frequently worry about changes to immigration policy affecting my student visa", type:"scale", opts:S5A },
    { id:"q24", label:"Uncertainty about my visa status affects my ability to focus on my studies", type:"scale", opts:S5A },
    { id:"q25", label:"I have had difficulty finding suitable housing since arriving in the US", type:"scale", opts:S5A },
    { id:"q26", label:"I feel uncomfortable seeking help from a counselor or therapist", type:"scale", opts:S5A },
    { id:"q27", label:"I do not know how to access mental health or medical services at my university", type:"scale", opts:S5A },
  ]},
  { id:"s8", type:"questions", title:"Daily life", emoji:"Food", subtitle:"How much do you agree with the following?", scaleNote:"1 = Strongly disagree  to  5 = Strongly agree", fields:[
    { id:"q28", label:"I find it difficult to access foods that are familiar to me from home", type:"scale", opts:S5A },
    { id:"q29", label:"I feel nervous speaking up in class or participating in academic discussions", type:"scale", opts:S5A },
    { id:"q30", label:"I sometimes avoid reaching out to professors or staff because I am unsure how to communicate with them", type:"scale", opts:S5A },
  ]},
  { id:"review", type:"review", title:"Almost done!", emoji:"Party", fields:[] },
];

const EMOJI = { "Greetings":"👋","Thoughts":"💭","Handshake":"🤝","Plane":"✈️","Card":"💳","Pray":"🙏","Home":"🏠","Food":"🍲","Party":"🎉" };
const ALL_FIELDS = PAGES.flatMap((p) => p.fields);
const QPAGES = PAGES.filter((p) => p.type === "questions");

function phq2(form) {
  return (parseInt((form.q6 || "0")[0]) || 0) + (parseInt((form.q7 || "0")[0]) || 0);
}

const MAROON = "#6B2737";
const MAROON_DARK = "#4a1a25";
const MAROON_BG = "rgba(107,39,55,0.08)";
const MAROON_BR = "rgba(107,39,55,0.3)";
const GOLD = "#F5C518";
const RED = "#b3503d";
const RED_BG = "#faecea";
const RED_BR = "rgba(179,80,61,0.35)";
const BG = "#f5f7f5";
const WHITE = "#ffffff";
const TEXT = "#1a2e22";
const DIM = "#5a7060";
const BORDER = "#e0e8e0";

export default function SurveyPage() {
  const [pageIdx,    setPageIdx]    = useState(0);
  const [form,       setForm]       = useState({});
  const [errors,     setErrors]     = useState({});
  const [direction,  setDirection]  = useState("forward");
  const [visible,    setVisible]    = useState(true);
  const [animating,  setAnimating]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitErr,  setSubmitErr]  = useState(null);
  const topRef = useRef(null);

  const page    = PAGES[pageIdx];
  const isWelcome = page.type === "welcome";
  const isReview  = page.type === "review";
  const qDone   = PAGES.slice(0, pageIdx).filter((p) => p.type === "questions").length;
  const progress = isWelcome ? 0 : isReview ? 100 : Math.round((qDone / QPAGES.length) * 100);
  const distress = phq2(form) >= 3 && pageIdx > 2;
  const answered = page.fields.filter((f) => form[f.id]).length;

  const setField = (id, val) => {
    setForm((f) => ({ ...f, [id]: val }));
    setErrors((e) => ({ ...e, [id]: false }));
  };

  const validatePage = () => {
    if (!page.fields.length) return true;
    const errs = {};
    page.fields.forEach((f) => { if (!form[f.id] || !String(form[f.id]).trim()) errs[f.id] = true; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const navigate = (dir) => {
    if (animating) return;
    if (dir === "forward" && !validatePage()) {
      topRef.current && topRef.current.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setDirection(dir);
    setVisible(false);
    setAnimating(true);
    setTimeout(() => {
      setPageIdx((i) => dir === "forward" ? i + 1 : i - 1);
      setErrors({});
      setVisible(true);
      setAnimating(false);
      topRef.current && topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 260);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitErr(null);
    const payload = { id: "resp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), timestamp: new Date().toISOString(), source: "qr-survey", ...form };
    try {
      await saveResponse(payload);
      setSubmitted(true);
      topRef.current && topRef.current.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setSubmitErr("Something went wrong. Your response has been saved locally. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, " + MAROON + " 0%, " + MAROON_DARK + " 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"Plus Jakarta Sans,-apple-system,sans-serif" }}>
        <style>{CSS}</style>
        <div style={{ background:WHITE, borderRadius:24, padding:"36px 28px", maxWidth:400, width:"100%", textAlign:"center", animation:"popIn .5s cubic-bezier(.2,.9,.25,1.15)" }}>
          <div style={{ fontSize:56, marginBottom:12, animation:"bounce 1s ease infinite" }}>🎉</div>
          <div style={{ fontSize:22, fontWeight:700, color:TEXT, marginBottom:8 }}>Thank you so much!</div>
          <div style={{ fontSize:14, color:DIM, lineHeight:1.7, marginBottom:16 }}>Your response has been recorded anonymously. You are helping make the path easier for every international student who comes after you.</div>
          <div style={{ fontSize:12, color:MAROON, fontWeight:600 }}>Saved successfully</div>
          {distress && (
            <div style={{ background:RED_BG, border:"1px solid " + RED_BR, borderRadius:12, padding:"14px 16px", marginTop:20, textAlign:"left" }}>
              <div style={{ fontSize:13, fontWeight:700, color:RED, marginBottom:6 }}>Support is available</div>
              <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>MSU Counseling: <strong>(417) 836-5116</strong><br/>988 Lifeline: <strong>call or text 988</strong><br/>Crisis Text: <strong>text HOME to 741741</strong></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} style={{ minHeight:"100vh", background:BG, fontFamily:"Plus Jakarta Sans,-apple-system,sans-serif", color:TEXT }}>
      <style>{CSS}</style>

      <div style={{ background:MAROON, padding:"12px 20px", position:"sticky", top:0, zIndex:10, boxShadow:"0 2px 12px rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: isWelcome ? 0 : 8 }}>
            <img src={BEAR_SRC} alt="MSU" style={{ height:36, objectFit:"contain" }} />
            {!isWelcome && isReview && <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontWeight:500 }}>Almost done!</div>}
          </div>
          {!isWelcome && (
            <div style={{ height:4, background:"rgba(255,255,255,0.2)", borderRadius:99, overflow:"hidden", marginTop:8 }}>
              <div style={{ height:"100%", background:GOLD, borderRadius:99, width:progress + "%", transition:"width 0.5s cubic-bezier(.4,0,.2,1)", boxShadow:"0 0 8px rgba(245,197,24,0.6)" }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:600, margin:"0 auto", padding:"0 16px 40px" }}>
        <div style={{ opacity:visible ? 1 : 0, transform:visible ? "translateX(0)" : direction === "forward" ? "translateX(40px)" : "translateX(-40px)", transition:"opacity 0.26s ease, transform 0.26s ease" }}>

          {isWelcome && (
            <div style={{ paddingTop:40, textAlign:"center" }}>
              <div style={{ position:"relative", display:"inline-block", marginBottom:28 }}>
                <img src={BEAR_SRC} alt="Missouri State University" style={{ height:96, width:96, objectFit:"contain", display:"block", animation:"floatLogo 3s ease-in-out infinite" }} />
                <div style={{ width:70, height:10, borderRadius:"50%", background:"rgba(107,39,55,0.18)", margin:"6px auto 0", filter:"blur(4px)", animation:"shadowPulse 3s ease-in-out infinite" }} />
              </div>
              <div style={{ fontSize:22, fontWeight:700, color:TEXT, marginBottom:6, lineHeight:1.3 }}>{page.title}</div>
              <div style={{ fontSize:13, color:MAROON, fontWeight:600, marginBottom:24 }}>{page.subtitle}</div>
              <div style={{ fontSize:15, color:DIM, lineHeight:1.75, marginBottom:28, maxWidth:460, margin:"0 auto 28px" }}>{page.body}</div>
              <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:28, flexWrap:"wrap" }}>
                {[["5 minutes","timer"],["Anonymous","lock"]].map(([label, icon]) => (
                  <div key={label} style={{ background:WHITE, borderRadius:12, padding:"10px 16px", fontSize:13, color:TEXT, border:"1px solid " + BORDER, fontWeight:500 }}>{label}</div>
                ))}
              </div>
              <div style={{ background:WHITE, border:"1px solid " + BORDER, borderRadius:14, padding:"16px 18px", marginBottom:28, textAlign:"left", fontSize:12, color:DIM, lineHeight:1.75 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MAROON, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Informed consent</div>
                Participation is completely <strong>voluntary and anonymous</strong>. No names or identifying information are collected. You may stop at any time without consequence to your academic standing or immigration status.
                <br/><br/>
                PI: Amen Engworo Edoha  Missouri State University
              </div>
              <button onClick={() => navigate("forward")} style={BTN(false)}>
                Lets get started
              </button>
            </div>
          )}

          {page.type === "questions" && (
            <div style={{ paddingTop:28 }}>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ fontSize:40, marginBottom:8, animation:"float 3s ease-in-out infinite" }}>{EMOJI[page.emoji] || "📝"}</div>
                <div style={{ fontSize:20, fontWeight:700, color:TEXT, marginBottom:4 }}>{page.title}</div>
                <div style={{ fontSize:13, color:DIM, lineHeight:1.6 }}>{page.subtitle}</div>
                {page.scaleNote && (
                  <div style={{ display:"inline-block", marginTop:8, fontSize:11, fontWeight:600, color:MAROON, background:MAROON_BG, padding:"4px 12px", borderRadius:99, border:"1px solid " + MAROON_BR }}>
                    {page.scaleNote}
                  </div>
                )}
              </div>

              {Object.keys(errors).some((k) => errors[k]) && (
                <div style={{ background:RED_BG, border:"1px solid " + RED_BR, borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:RED, fontWeight:500 }}>
                  Please answer all questions before continuing.
                </div>
              )}

              {page.fields.map((field, fi) => {
                const hasErr = errors[field.id];
                const qNum  = ALL_FIELDS.indexOf(field) + 1;
                const isScale = field.type === "scale";
                const isSelect = field.type === "select";
                const answered = !!form[field.id];
                return (
                  <div key={field.id} style={{ marginBottom:14, animation:"slideUp 0.35s ease " + (fi * 0.07) + "s both" }}>
                    <div style={{ background:hasErr ? "#fdf4f3" : WHITE, borderRadius:14, border:"1.5px solid " + (hasErr ? RED : answered ? MAROON_BR : BORDER), padding:"14px 16px", transition:"border-color 0.2s, box-shadow 0.2s", boxShadow: answered ? "0 0 0 3px " + MAROON_BG : "none" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:MAROON, marginBottom:5, letterSpacing:"0.05em" }}>Q{qNum}</div>
                      <div style={{ fontSize:14, fontWeight:500, color:TEXT, lineHeight:1.55, marginBottom:10 }}>{field.label}</div>

                      {isSelect ? (
                        <select value={form[field.id] || ""} onChange={(e) => setField(field.id, e.target.value)} style={{ width:"100%", padding:"11px 12px", borderRadius:8, border:"1.5px solid " + (hasErr ? RED : BORDER), background:BG, color:form[field.id] ? TEXT : DIM, fontSize:14, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
                          <option value="" disabled>Select your country...</option>
                          {field.opts.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : isScale ? (
                        <div style={{ display:"flex", gap:6 }}>
                          {field.opts.map((opt) => {
                            const sel = form[field.id] === opt;
                            const num = opt.split("  ")[0];
                            const lbl = opt.split("  ")[1] || "";
                            return (
                              <button key={opt} onClick={() => setField(field.id, opt)} style={{ flex:"1 1 auto", padding:"10px 4px", borderRadius:10, border:"1.5px solid " + (sel ? MAROON : BORDER), background:sel ? MAROON : BG, color:sel ? WHITE : TEXT, cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:3, transition:"all 0.15s ease", transform:sel ? "scale(1.07)" : "scale(1)", boxShadow:sel ? "0 2px 8px " + MAROON_BG : "none" }}>
                                <span style={{ fontSize:17, fontWeight:700 }}>{num}</span>
                                <span style={{ fontSize:9, opacity:sel ? 0.9 : 0.55, textAlign:"center", lineHeight:1.2 }}>{lbl}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                          {field.opts.map((opt) => {
                            const sel = form[field.id] === opt;
                            return (
                              <div key={opt} onClick={() => setField(field.id, opt)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:10, background:sel ? MAROON_BG : BG, border:"1.5px solid " + (sel ? MAROON_BR : BORDER), cursor:"pointer", fontSize:13, color:TEXT, fontWeight:sel ? 600 : 400, transition:"all 0.15s ease" }}>
                                <div style={{ width:20, height:20, borderRadius:"50%", border:"2px solid " + (sel ? MAROON : BORDER), background:sel ? MAROON : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                                  {sel && <div style={{ width:8, height:8, borderRadius:"50%", background:WHITE }} />}
                                </div>
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {hasErr && <div style={{ fontSize:12, color:RED, marginTop:6 }}>Please answer this question</div>}
                    </div>
                  </div>
                );
              })}

              {distress && (
                <div style={{ background:RED_BG, border:"1px solid " + RED_BR, borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:RED, marginBottom:5 }}>Support is available</div>
                  <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>MSU Counseling: <strong>(417) 836-5116</strong><br/>988 Lifeline: <strong>call or text 988</strong></div>
                </div>
              )}

              <div style={{ fontSize:12, color:DIM, textAlign:"center", marginBottom:14 }}>{answered} of {page.fields.length} answered</div>

              <div style={{ display:"flex", gap:10 }}>
                {pageIdx > 0 && (
                  <button onClick={() => navigate("back")} style={{ flex:"0 0 auto", padding:"14px 20px", borderRadius:12, background:WHITE, border:"1.5px solid " + BORDER, color:DIM, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Back</button>
                )}
                <button onClick={() => navigate("forward")} style={{ ...BTN(false), flex:1 }}>
                  {pageIdx === PAGES.length - 2 ? "Review answers" : "Continue"}
                </button>
              </div>
            </div>
          )}

          {isReview && (
            <div style={{ paddingTop:28 }}>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ fontSize:48, marginBottom:8, animation:"bounce 1s ease infinite" }}>🎉</div>
                <div style={{ fontSize:22, fontWeight:700, color:TEXT, marginBottom:6 }}>{page.title}</div>
                <div style={{ fontSize:14, color:DIM, lineHeight:1.65 }}>You have answered all {ALL_FIELDS.length} questions. Review below or go back to change anything.</div>
              </div>
              <div style={{ background:MAROON_BG, border:"1px solid " + MAROON_BR, borderRadius:12, padding:"12px 16px", marginBottom:20, textAlign:"center" }}>
                <div style={{ fontSize:24, fontWeight:700, color:MAROON }}>{Object.keys(form).length} / {ALL_FIELDS.length}</div>
                <div style={{ fontSize:12, color:DIM }}>questions answered</div>
              </div>
              {QPAGES.map((qp) => {
                const ans = qp.fields.filter((f) => form[f.id]).length;
                const done = ans === qp.fields.length;
                return (
                  <div key={qp.id} style={{ background:WHITE, borderRadius:12, border:"1.5px solid " + (done ? MAROON_BR : BORDER), padding:"12px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ fontSize:24 }}>{EMOJI[qp.emoji] || "📝"}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{qp.title}</div>
                      <div style={{ fontSize:12, color:done ? MAROON : RED }}>{ans}/{qp.fields.length} answered</div>
                    </div>
                    <div style={{ fontSize:18 }}>{done ? "✅" : "⚠️"}</div>
                  </div>
                );
              })}
              {distress && (
                <div style={{ background:RED_BG, border:"1px solid " + RED_BR, borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:RED, marginBottom:5 }}>Support is available</div>
                  <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>MSU Counseling: <strong>(417) 836-5116</strong>  988 Lifeline: <strong>call or text 988</strong></div>
                </div>
              )}
              {submitErr && <div style={{ background:RED_BG, border:"1px solid " + RED_BR, borderRadius:10, padding:"12px 14px", marginBottom:14, fontSize:13, color:RED }}>{submitErr}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => navigate("back")} style={{ flex:"0 0 auto", padding:"14px 20px", borderRadius:12, background:WHITE, border:"1.5px solid " + BORDER, color:DIM, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Back</button>
                <button onClick={handleSubmit} disabled={submitting} style={{ ...BTN(submitting), flex:1 }}>
                  {submitting ? "Submitting..." : "Submit — anonymous"}
                </button>
              </div>
              <div style={{ fontSize:11, color:DIM, textAlign:"center", marginTop:14, lineHeight:1.6 }}>Responses stored securely. Questions? irb@missouristate.edu</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function BTN(disabled) {
  return { width:"100%", padding:"15px 0", borderRadius:12, background:disabled ? "#c0a0a7" : "#6B2737", color:WHITE, border:"none", cursor:disabled ? "not-allowed" : "pointer", fontSize:15, fontWeight:700, fontFamily:"inherit", boxShadow:disabled ? "none" : "0 4px 14px rgba(107,39,55,0.35)", transition:"transform 0.15s, box-shadow 0.15s" };
}

const CSS = [
  "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');",
  "* { box-sizing: border-box; margin: 0; padding: 0; }",
  "body { margin: 0; -webkit-tap-highlight-color: transparent; }",
  "@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }",
  "@keyframes floatLogo { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }",
  "@keyframes shadowPulse { 0%, 100% { transform: scaleX(1); opacity: 0.7; filter: blur(4px); } 50% { transform: scaleX(0.45); opacity: 0.25; filter: blur(2px); } }",
  "@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }",
  "@keyframes slideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }",
  "@keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }",
  "button:active { transform: scale(0.97) !important; }",
  "select { appearance: auto; }",
].join(" ");
