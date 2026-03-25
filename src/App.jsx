import { useState } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
// In production this points to your Render backend URL.
// Set VITE_API_URL in Netlify environment variables.
// During local dev, Vite proxies /api → localhost:3001 automatically.
const API_BASE = import.meta.env.VITE_API_URL;
console.log(import.meta.env.VITE_API_URL);

// ─── DATA ──────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "ASL",    full: "American Sign Language",  flag: "🇺🇸", pct: 65 },
  { code: "BSL",    full: "British Sign Language",   flag: "🇬🇧", pct: 20 },
  { code: "ISL",    full: "Indian Sign Language",    flag: "🇮🇳", pct: 5  },
  { code: "Auslan", full: "Australian Sign Language",flag: "🇦🇺", pct: 0  },
  { code: "JSL",    full: "Japanese Sign Language",  flag: "🇯🇵", pct: 0  },
  { code: "LSF",    full: "French Sign Language",    flag: "🇫🇷", pct: 0  },
];

const LESSONS = [
  { icon: "🔤", title: "Alphabet",  desc: "26 handshapes",         badge: "done"   },
  { icon: "👋", title: "Greetings", desc: "Hello, goodbye & more", badge: "active" },
  { icon: "🔢", title: "Numbers",   desc: "Count & quantities",    badge: "new"    },
  { icon: "🎨", title: "Colors",    desc: "Red, blue, green…",     badge: "locked" },
  { icon: "😊", title: "Emotions",  desc: "Express how you feel",  badge: "locked" },
  { icon: "👨‍👩‍👧", title: "Family",   desc: "Mom, dad, siblings",    badge: "locked" },
];

const TOPIC_ICONS = ["🔤","👋","🔢","😊","🍕","✈️"];
const TOPICS      = ["Alphabet","Greetings","Numbers","Emotions","Food","Travel"];

const BADGE_STYLE = {
  done:   { background:"rgba(122,240,200,0.15)", color:"#7af0c8" },
  active: { background:"rgba(200,245,98,0.15)",  color:"#c8f562" },
  new:    { background:"rgba(245,167,66,0.15)",  color:"#f5a742" },
  locked: { background:"rgba(255,255,255,0.06)", color:"#8a8884" },
};

// ─── API HELPER ────────────────────────────────────────────────────────────
async function callAI(prompt, systemPrompt) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, systemPrompt }),
  });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data.text;
}

function parseSigns(text) {
  const match = text.match(/<signs>([\s\S]*?)<\/signs>/);
  if (!match) return { text, signs: [] };
  try {
    return { text: text.replace(/<signs>[\s\S]*?<\/signs>/, "").trim(), signs: JSON.parse(match[1]) };
  } catch { return { text, signs: [] }; }
}

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────
function SignsGrid({ items }) {
  if (!items.length) return null;
  return (
    <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", margin:"16px 0" }}>
      {items.map((sg, i) => (
        <div key={i} style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"10px", padding:"12px 16px", textAlign:"center", minWidth:"76px" }}>
          <div style={{ fontSize:"30px", marginBottom:"6px" }}>{sg.emoji}</div>
          <div style={{ fontSize:"13px", fontWeight:500 }}>{sg.word}</div>
          <div style={{ fontSize:"11px", color:"var(--muted)", marginTop:"3px", lineHeight:1.4 }}>{sg.desc}</div>
        </div>
      ))}
    </div>
  );
}

function AiBox({ label, text, signs, loading, children }) {
  return (
    <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"22px", marginBottom:"18px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"14px" }}>
        <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"var(--accent)", animation: loading ? "pulse 1s infinite" : "none" }} />
        <span style={{ fontSize:"11px", color:"var(--accent)", fontWeight:500, letterSpacing:"0.5px" }}>{label}</span>
      </div>
      <div style={{ fontSize:"14px", lineHeight:"1.85", color: loading ? "var(--muted)" : "var(--text)", minHeight:"56px" }}>
        {loading ? "Thinking…" : text}
      </div>
      <SignsGrid items={signs} />
      {children}
    </div>
  );
}

function BtnRow({ children }) {
  return <div style={{ display:"flex", gap:"8px", marginTop:"14px", flexWrap:"wrap" }}>{children}</div>;
}

function Btn({ accent, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding:"9px 20px", borderRadius:"9px", border: accent ? "none" : "1px solid var(--border2)",
        background: accent ? "var(--accent)" : "transparent",
        color: accent ? "#0e0f11" : "var(--text)",
        fontSize:"13px", cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: accent ? 500 : 400, opacity: disabled ? 0.6 : 1,
        transition:"opacity .2s",
      }}
    >{children}</button>
  );
}

function AskRow({ value, onChange, onEnter, onSubmit, placeholder, disabled }) {
  return (
    <div style={{ display:"flex", gap:"8px", marginTop:"14px" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        placeholder={placeholder}
        style={{ flex:1, padding:"9px 13px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"9px", color:"var(--text)", fontSize:"14px", outline:"none" }}
      />
      <Btn accent onClick={onSubmit} disabled={disabled}>Search</Btn>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [lang,          setLang]          = useState(LANGUAGES[0]);
  const [view,          setView]          = useState("learn");
  const [xp,            setXp]            = useState(420);
  const [loading,       setLoading]       = useState(false);

  // Learn
  const [learnText,     setLearnText]     = useState("Pick a lesson from the grid or a topic from the sidebar to get started.");
  const [learnSigns,    setLearnSigns]    = useState([]);
  const [showNextBtn,   setShowNextBtn]   = useState(false);
  const [userQ,         setUserQ]         = useState("");

  // Practice
  const [practiceText,  setPracticeText]  = useState("Choose a practice mode below.");
  const [practiceSigns, setPracticeSigns] = useState([]);

  // Quiz
  const [quiz,          setQuiz]          = useState(null);
  const [quizIdx,       setQuizIdx]       = useState(0);
  const [answered,      setAnswered]      = useState(false);
  const [chosen,        setChosen]        = useState(null);
  const [quizLoading,   setQuizLoading]   = useState(false);

  // Dictionary
  const [dictText,      setDictText]      = useState("Type any word to look up how to sign it.");
  const [dictSigns,     setDictSigns]     = useState([]);
  const [dictQ,         setDictQ]         = useState("");

  const addXP = (n) => setXp((x) => Math.min(x + n, 1000));

  const systemBase = `You are an expert sign language tutor for ${lang.full} (${lang.code}) and other world sign languages.
Describe signs precisely: handshape, body location, movement, and facial expression.
When listing multiple signs, append a JSON block at the very end of your response:
<signs>
[{"emoji":"👋","word":"Hello","desc":"Short description"}]
</signs>
Keep all responses under 180 words. Be warm, clear, and encouraging. Do NOT mention any AI company or model name.`;

  async function runAI(prompt, setText, setSigns) {
    setLoading(true);
    setText("Thinking…");
    setSigns([]);
    try {
      const raw = await callAI(prompt, systemBase);
      const { text, signs } = parseSigns(raw);
      setText(text);
      setSigns(signs);
      addXP(15);
    } catch {
      setText("Connection error — please try again.");
    }
    setLoading(false);
  }

  function startLesson(topic) {
    setView("learn");
    setShowNextBtn(true);
    runAI(
      `Teach me the signs for "${topic}" in ${lang.full} (${lang.code}). Give 4–6 key signs with clear descriptions. Include the <signs> JSON block.`,
      setLearnText, setLearnSigns
    );
  }

  function askTutor() {
    if (!userQ.trim() || loading) return;
    runAI(`In ${lang.code} (${lang.full}): ${userQ}`, setLearnText, setLearnSigns);
    setUserQ("");
    setShowNextBtn(false);
  }

  function runPractice(mode) {
    const map = {
      flashcard: `Give me a ${lang.code} flashcard session: 5 essential signs. For each: the word, how to sign it, and a memory tip. Include <signs> JSON.`,
      sentence:  `Help me sign this sentence in ${lang.code}: "Nice to meet you." Break it into individual signs with descriptions. Include <signs> JSON.`,
      story:     `Create a short story practice in ${lang.code}: a 3-sentence everyday scenario. Describe the key signs needed. Include <signs> JSON.`,
    };
    runAI(map[mode], setPracticeText, setPracticeSigns);
  }

  async function loadQuiz() {
    setQuizLoading(true);
    setQuiz(null);
    try {
      const raw = await callAI(
        `Create a 4-question multiple choice quiz about ${lang.code} signs. Mix handshapes, vocabulary, and grammar. Return ONLY valid JSON with no markdown or extra text:
{"questions":[{"q":"Question text","options":["A","B","C","D"],"answer":0,"explanation":"Why this is correct"}]}`,
        "You generate sign language quizzes. Return only valid JSON, no markdown, no backticks, no preamble, no AI references."
      );
      const clean = raw.replace(/```json|```/g, "").trim();
      setQuiz(JSON.parse(clean));
      setQuizIdx(0);
      setAnswered(false);
      setChosen(null);
      addXP(10);
    } catch {
      setQuiz({ error: true });
    }
    setQuizLoading(false);
  }

  function answerQuiz(i) {
    if (answered) return;
    setChosen(i);
    setAnswered(true);
    if (i === quiz.questions[quizIdx].answer) addXP(25);
  }

  function nextQ() {
    setQuizIdx((q) => q + 1);
    setAnswered(false);
    setChosen(null);
  }

  function lookupSign() {
    if (!dictQ.trim() || loading) return;
    runAI(
      `How do you sign "${dictQ}" in ${lang.code}? Describe handshape, body location, and movement. Include <signs> JSON.`,
      setDictText, setDictSigns
    );
  }

  const currentQ = quiz?.questions?.[quizIdx];
  const VIEWS = ["learn","practice","quiz","dictionary"];

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh" }}>

      {/* HEADER */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 28px", borderBottom:"1px solid var(--border)", flexWrap:"wrap", gap:"10px", background:"var(--bg)" }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:"21px", color:"var(--accent)", fontStyle:"italic", letterSpacing:"-0.3px" }}>
          Sign<span style={{ color:"var(--text)", fontStyle:"normal" }}>World</span>
        </div>

        <div style={{ display:"flex", gap:"3px", background:"var(--bg3)", borderRadius:"10px", padding:"3px" }}>
          {VIEWS.map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:"6px 15px", borderRadius:"7px", border: view===v ? "1px solid var(--border2)" : "1px solid transparent",
              background: view===v ? "var(--bg2)" : "transparent",
              color: view===v ? "var(--text)" : "var(--muted)",
              fontSize:"13px", cursor:"pointer",
            }}>
              {v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ fontSize:"13px", color:"var(--accent3)" }}>🔥 3-day streak</div>
      </header>

      <div style={{ display:"flex", flex:1 }}>

        {/* SIDEBAR */}
        <aside style={{ width:"230px", borderRight:"1px solid var(--border)", padding:"18px 10px", display:"flex", flexDirection:"column", gap:"5px", flexShrink:0, overflowY:"auto" }}>

          <div style={{ fontSize:"10px", textTransform:"uppercase", letterSpacing:"1.5px", color:"var(--muted)", padding:"6px 10px 4px" }}>Languages</div>
          {LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => { setLang(l); setLearnText(`Switched to ${l.full}. Pick a lesson or ask anything!`); setLearnSigns([]); setShowNextBtn(false); }}
              style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px", borderRadius:"9px",
                border: lang.code===l.code ? "1px solid var(--border2)" : "1px solid transparent",
                background: lang.code===l.code ? "var(--bg3)" : "transparent",
                color: lang.code===l.code ? "var(--text)" : "var(--muted)", cursor:"pointer", width:"100%", textAlign:"left" }}>
              <span style={{ fontSize:"18px" }}>{l.flag}</span>
              <span>
                <div style={{ fontSize:"13px", fontWeight:500, color: lang.code===l.code ? "var(--text)" : "var(--muted)" }}>{l.code}</div>
                <div style={{ fontSize:"11px", color:"var(--muted)" }}>{l.full.split(" ")[0]}</div>
              </span>
            </button>
          ))}

          <div style={{ fontSize:"10px", textTransform:"uppercase", letterSpacing:"1.5px", color:"var(--muted)", padding:"14px 10px 4px" }}>Topics</div>
          {TOPICS.map((t, i) => (
            <button key={t} onClick={() => startLesson(t)}
              style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px", borderRadius:"9px", border:"1px solid transparent",
                background:"transparent", color:"var(--muted)", cursor:"pointer", width:"100%", textAlign:"left",
                transition:"background .15s" }}
              onMouseEnter={(e)=>e.currentTarget.style.background="var(--bg3)"}
              onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:"16px" }}>{TOPIC_ICONS[i]}</span>
              <span style={{ fontSize:"13px" }}>{t}</span>
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex:1, padding:"28px", overflowY:"auto", maxHeight:"calc(100vh - 57px)" }}>

          {/* XP Bar */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 14px", background:"var(--bg3)", borderRadius:"10px", marginBottom:"24px" }}>
            <span style={{ fontSize:"12px", color:"var(--muted)", whiteSpace:"nowrap" }}>Your XP</span>
            <div style={{ flex:1, height:"5px", background:"var(--bg)", borderRadius:"3px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${xp/10}%`, background:"linear-gradient(90deg,var(--accent),var(--accent2))", borderRadius:"3px", transition:"width .8s" }} />
            </div>
            <span style={{ fontSize:"12px", color:"var(--accent)", whiteSpace:"nowrap", fontWeight:500 }}>{xp} / 1000 XP</span>
          </div>

          {/* ── LEARN ── */}
          {view === "learn" && (
            <>
              <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"30px", fontWeight:300, marginBottom:"4px" }}>
                Learn <em style={{ color:"var(--accent)" }}>{lang.code}</em>
              </h1>
              <p style={{ color:"var(--muted)", fontSize:"13px", marginBottom:"22px" }}>{lang.full} · {lang.pct}% complete</p>

              {/* Lesson cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))", gap:"10px", marginBottom:"24px" }}>
                {LESSONS.map((l) => (
                  <div key={l.title} onClick={() => l.badge !== "locked" && startLesson(l.title)}
                    style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"18px",
                      cursor: l.badge==="locked" ? "not-allowed" : "pointer", opacity: l.badge==="locked" ? 0.5 : 1,
                      position:"relative", transition:"border-color .2s, transform .2s" }}
                    onMouseEnter={(e)=>{ if(l.badge!=="locked"){e.currentTarget.style.borderColor="var(--border2)"; e.currentTarget.style.transform="translateY(-2px)";} }}
                    onMouseLeave={(e)=>{ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="translateY(0)"; }}>
                    <div style={{ fontSize:"24px", marginBottom:"10px" }}>{l.icon}</div>
                    <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"3px" }}>{l.title}</div>
                    <div style={{ fontSize:"11px", color:"var(--muted)" }}>{l.desc}</div>
                    <span style={{ ...BADGE_STYLE[l.badge], position:"absolute", top:"10px", right:"10px", fontSize:"10px", padding:"2px 7px", borderRadius:"20px" }}>
                      {l.badge==="done"?"✓":l.badge==="active"?"Active":l.badge==="new"?"New":"🔒"}
                    </span>
                  </div>
                ))}
              </div>

              <AiBox label="TUTOR" text={learnText} signs={learnSigns} loading={loading}>
                {showNextBtn && (
                  <BtnRow>
                    <Btn accent onClick={() => { const ts=["Animals","Sports","Medical","Travel","Weather","Daily Routine"]; startLesson(ts[Math.floor(Math.random()*ts.length)]); }}>
                      Next Lesson →
                    </Btn>
                    <Btn onClick={() => { setView("quiz"); setTimeout(loadQuiz, 100); }}>Quick Quiz</Btn>
                  </BtnRow>
                )}
                <AskRow
                  value={userQ}
                  onChange={setUserQ}
                  onEnter={askTutor}
                  onSubmit={askTutor}
                  placeholder={`Ask anything about ${lang.code}…`}
                  disabled={loading}
                />
              </AiBox>
            </>
          )}

          {/* ── PRACTICE ── */}
          {view === "practice" && (
            <>
              <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"30px", fontWeight:300, marginBottom:"4px" }}>
                Practice <em style={{ color:"var(--accent)" }}>Mode</em>
              </h1>
              <p style={{ color:"var(--muted)", fontSize:"13px", marginBottom:"22px" }}>Reinforce your {lang.code} skills</p>
              <AiBox label="PRACTICE SESSION" text={practiceText} signs={practiceSigns} loading={loading}>
                <BtnRow>
                  <Btn accent onClick={() => runPractice("flashcard")} disabled={loading}>Flashcards</Btn>
                  <Btn onClick={() => runPractice("sentence")} disabled={loading}>Sentence Builder</Btn>
                  <Btn onClick={() => runPractice("story")} disabled={loading}>Story Mode</Btn>
                </BtnRow>
              </AiBox>
            </>
          )}

          {/* ── QUIZ ── */}
          {view === "quiz" && (
            <>
              <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"30px", fontWeight:300, marginBottom:"4px" }}>
                Test Your <em style={{ color:"var(--accent)" }}>Knowledge</em>
              </h1>
              <p style={{ color:"var(--muted)", fontSize:"13px", marginBottom:"22px" }}>AI-generated quizzes tailored for {lang.code}</p>

              <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"24px" }}>
                {quizLoading && <p style={{ color:"var(--muted)", fontSize:"14px" }}>Generating your quiz…</p>}

                {!quizLoading && !quiz && (
                  <>
                    <p style={{ fontSize:"14px", marginBottom:"16px" }}>Ready? Click Start to generate a fresh {lang.code} quiz.</p>
                    <Btn accent onClick={loadQuiz}>Start Quiz</Btn>
                  </>
                )}

                {quiz?.error && (
                  <>
                    <p style={{ color:"var(--danger)", fontSize:"14px", marginBottom:"16px" }}>Failed to load quiz. Please retry.</p>
                    <Btn accent onClick={loadQuiz}>Retry</Btn>
                  </>
                )}

                {quiz && !quiz.error && currentQ && (
                  <>
                    <div style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"10px" }}>
                      Question {quizIdx+1} of {quiz.questions.length}
                    </div>
                    <div style={{ fontSize:"16px", fontWeight:500, marginBottom:"18px" }}>{currentQ.q}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                      {currentQ.options.map((o, i) => {
                        const st = !answered ? "n" : i===currentQ.answer ? "c" : i===chosen ? "w" : "n";
                        return (
                          <button key={i} onClick={() => answerQuiz(i)} style={{
                            padding:"11px 14px", borderRadius:"9px",
                            background: st==="c" ? "rgba(122,240,200,0.08)" : st==="w" ? "rgba(245,98,98,0.08)" : "var(--bg3)",
                            border: `1px solid ${st==="c" ? "var(--accent2)" : st==="w" ? "var(--danger)" : "var(--border)"}`,
                            color: st==="c" ? "var(--accent2)" : st==="w" ? "var(--danger)" : "var(--text)",
                            fontSize:"14px", cursor:"pointer", textAlign:"left",
                          }}>
                            {o}
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <>
                        <p style={{ marginTop:"16px", fontSize:"14px", color: chosen===currentQ.answer ? "var(--accent2)" : "var(--danger)" }}>
                          {chosen===currentQ.answer ? "✓ Correct! " : "✗ Not quite. "}{currentQ.explanation}
                        </p>
                        <BtnRow>
                          {quizIdx < quiz.questions.length-1
                            ? <Btn accent onClick={nextQ}>Next Question →</Btn>
                            : <Btn accent onClick={loadQuiz}>New Quiz</Btn>}
                        </BtnRow>
                      </>
                    )}
                  </>
                )}

                {quiz && !quiz.error && !currentQ && (
                  <>
                    <p style={{ fontSize:"16px", color:"var(--accent2)", marginBottom:"16px" }}>Quiz complete — great work! 🎉</p>
                    <Btn accent onClick={loadQuiz}>Try Another Quiz</Btn>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── DICTIONARY ── */}
          {view === "dictionary" && (
            <>
              <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"30px", fontWeight:300, marginBottom:"4px" }}>
                Sign <em style={{ color:"var(--accent)" }}>Dictionary</em>
              </h1>
              <p style={{ color:"var(--muted)", fontSize:"13px", marginBottom:"22px" }}>Look up any word in {lang.full}</p>
              <AiBox label="DICTIONARY" text={dictText} signs={dictSigns} loading={loading}>
                <AskRow
                  value={dictQ}
                  onChange={setDictQ}
                  onEnter={lookupSign}
                  onSubmit={lookupSign}
                  placeholder={`e.g. "thank you", "water", "help"…`}
                  disabled={loading}
                />
              </AiBox>
            </>
          )}

          {/* Footer */}
          <footer style={{ marginTop:"40px", paddingTop:"20px", borderTop:"1px solid var(--border)", fontSize:"12px", color:"var(--muted)", textAlign:"center" }}>
            SignWorld — Learn sign language from anywhere in the world 🤟
          </footer>

        </main>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>
    </div>
  );
}
