import React, { useState, useRef } from "react";

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
  { id:"s4", type:"questions", title:"Adjusting to life in the US", emoji:"Plane", subtitle:"How stressful have you found the following?", scaleNote:"1 = Not stressful  to  5 = Extremely stressful", fields:[
    { id:"q12", label:"People here do not understand my cultural values", type:"scale", opts:S5S },
    { id:"q13", label:"I miss my family and friends back home", type:"scale", opts:S5S },
    { id:"q14", label:"People here treat me differently because of where I am from", type:"scale", opts:S5S },
    { id:"q15", label:"I am afraid I will not be able to complete my studies here", type:"scale", opts:S5S },
    { id:"q16", label:"Adjusting to a new way of life here has been difficult", type:"scale", opts:S5S },
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

const BEAR_SRC = "data:image/png;base64,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";

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