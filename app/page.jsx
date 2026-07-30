import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import HeroShowcase from "@/components/HeroShowcase";

export const metadata = {
  title: "NaijaCGPA — Calculate your CGPA, plan your exams, hit your target",
  description:
    "NaijaCGPA turns your grades into a plan. Calculate your CGPA on your school's exact scale, see the marks you need in every exam, and track your climb to First Class. Free, for Nigerian students.",
};

const steps = [
  {
    n: "01",
    t: "Add your courses",
    p: "Enter your courses and units in seconds — by grade or by raw score. Carryovers and CA weighting handled.",
  },
  {
    n: "02",
    t: "Know your standing",
    p: "See your CGPA and class instantly, on your school's exact grading system — undergraduate or masters.",
  },
  {
    n: "03",
    t: "Chase your target",
    p: "Set a goal and get the precise scores you need in every remaining exam and course to reach it.",
  },
];

const features = [
  {
    t: "Your real class",
    p: "First Class, 2:1, 2:2 — on your school's 5-point or 4-point scale, rounded the way your transcript reads.",
  },
  {
    t: "Exam targets from your CA",
    p: "Enter your CA before exams and know the exact mark you need in each paper to reach the grade you want.",
  },
  {
    t: "A plan to your goal",
    p: "Try the scores you expect in each remaining course and watch your projected final CGPA move in real time.",
  },
  {
    t: "Save & share",
    p: "Keep results across devices when you sign in, and share a clean result card straight to WhatsApp.",
  },
];

const faqs = [
  {
    q: "Is NaijaCGPA free?",
    a: "Yes. Calculating your CGPA, seeing your class, and planning your exams are free. You only sign in if you want to save and sync your results.",
  },
  {
    q: "Does it work for my school?",
    a: "Yes. Pick your scale — 5-point or 4-point — and your level. It handles carryovers, CA weighting, and cumulative CGPA across semesters.",
  },
  {
    q: "Is my data private?",
    a: "Your results are yours. We never sell your data and we don't show ads. See our Privacy Policy for the details.",
  },
  {
    q: "Does it work offline?",
    a: "Yes. Your entries are saved on your device, so you can use the calculator with no connection and never lose your work.",
  },
];

export default function Landing() {
  return (
    <div className="lp">
      <style>{`
        html{scroll-behavior:smooth;}
        .lp{--ink:#0B1F18;--ink2:#08130E;--paper:#F4F6F3;--paper2:#EAF0EC;--card:#fff;--line:#E2E7E2;--mute:#5B6B62;--green:#0F8A5F;--green2:#12B76A;--gold:#E8B23A;--text:#132A22;
          font-family:Poppins, system-ui, sans-serif;color:var(--text);background:var(--paper);min-height:100vh;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
        .lp a{text-decoration:none;}

        .lp-hero{position:relative;max-width:1120px;margin:0 auto;padding:60px 20px 48px;display:grid;gap:40px;}
        .lp-hero-bg{position:absolute;inset:-10% -20% auto -20%;height:620px;z-index:0;pointer-events:none;
          background:radial-gradient(600px 320px at 25% 20%,rgba(18,183,106,0.16),transparent 60%),radial-gradient(520px 300px at 85% 10%,rgba(232,178,58,0.14),transparent 60%);
          animation:lpGlow 14s ease-in-out infinite alternate;}
        @keyframes lpGlow{from{transform:translateY(0) scale(1)}to{transform:translateY(24px) scale(1.06)}}
        .lp-hero-copy{position:relative;z-index:1;animation:lpUp .7s ease both;}
        .lp-hero-card{position:relative;z-index:1;animation:lpFade .9s .15s ease both;}
        @keyframes lpUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes lpFade{from{opacity:0}to{opacity:1}}
        .lp-eyebrow{display:inline-block;font-family:Poppins, system-ui, sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:var(--green);
          background:#E7F4EC;border:1px solid #cfe8db;border-radius:999px;padding:6px 12px;margin-bottom:20px;}
        .lp-h1{font-family:Poppins, system-ui, sans-serif;font-weight:800;font-size:46px;line-height:1.02;letter-spacing:-1.8px;color:var(--ink);margin:0 0 20px;}
        .lp-sub{font-size:17.5px;line-height:1.6;color:var(--mute);max-width:540px;margin:0 0 28px;}
        .lp-ctas{display:flex;flex-wrap:wrap;gap:12px;align-items:center;}
        .lp-cta{display:inline-flex;align-items:center;gap:8px;background:var(--green);color:#fff;font-weight:700;font-size:16px;
          padding:15px 26px;border-radius:14px;box-shadow:0 12px 26px rgba(15,138,95,0.30);transition:transform .16s ease,box-shadow .16s ease;}
        .lp-cta:hover{transform:translateY(-2px);box-shadow:0 18px 34px rgba(15,138,95,0.38);}
        .lp-cta2{display:inline-flex;align-items:center;gap:8px;color:var(--ink);font-weight:700;font-size:16px;padding:15px 18px;border-radius:14px;border:1px solid var(--line);background:#fff;transition:border-color .16s ease,transform .16s ease;}
        .lp-cta2:hover{border-color:var(--green);transform:translateY(-2px);}
        .lp-trust{margin-top:18px;font-size:13px;color:var(--mute);font-weight:500;}

        .lp-pills{max-width:1120px;margin:0 auto;padding:8px 20px 8px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;}
        .lp-pill{background:#fff;border:1px solid var(--line);border-radius:999px;padding:9px 15px;font-size:13.5px;font-weight:600;color:var(--text);transition:transform .16s ease,box-shadow .16s ease;}
        .lp-pill:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(11,31,24,0.06);}
        .lp-pill b{color:var(--green);}

        .lp-section{max-width:1120px;margin:0 auto;padding:56px 20px 8px;}
        .lp-kicker{font-family:Poppins, system-ui, sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:var(--green);text-align:center;margin-bottom:12px;}
        .lp-h2{font-family:Poppins, system-ui, sans-serif;font-weight:800;font-size:32px;letter-spacing:-1px;color:var(--ink);text-align:center;margin:0 0 40px;}

        .lp-steps{display:grid;gap:18px;}
        .lp-step{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:26px;}
        .lp-step-n{font-family:Poppins, system-ui, sans-serif;font-size:14px;font-weight:700;color:var(--gold);}
        .lp-step-t{font-family:Poppins, system-ui, sans-serif;font-weight:800;font-size:20px;color:var(--ink);margin:12px 0 8px;}
        .lp-step-p{font-size:15px;line-height:1.6;color:var(--mute);margin:0;}

        .lp-feats{display:grid;gap:16px;}
        .lp-feat{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;}
        .lp-feat:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(11,31,24,0.08);border-color:#cfe0d7;}
        .lp-feat-t{font-family:Poppins, system-ui, sans-serif;font-weight:800;font-size:18px;color:var(--ink);margin:0 0 8px;}
        .lp-feat-p{font-size:14.5px;line-height:1.55;color:var(--mute);margin:0;}

        .lp-show{display:grid;gap:28px;align-items:center;}
        .lp-show-copy .lp-kicker,.lp-show-copy .lp-h2{text-align:left;}
        .lp-show-copy .lp-h2{margin-bottom:16px;}
        .lp-show-p{font-size:16px;line-height:1.65;color:var(--mute);margin:0 0 20px;}
        .lp-mini{background:linear-gradient(150deg,var(--ink),var(--ink2));border-radius:20px;padding:24px;color:#fff;border:1px solid rgba(232,178,58,0.3);box-shadow:0 24px 60px rgba(11,31,24,0.22);}
        .lp-mini-lead{font-size:14px;color:rgba(255,255,255,0.75);margin:0 0 4px;}
        .lp-mini-need{font-family:Poppins, system-ui, sans-serif;font-weight:700;font-size:34px;letter-spacing:-1px;margin:0 0 16px;}
        .lp-mini-need b{color:var(--gold);}
        .lp-mini-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-top:1px solid rgba(255,255,255,0.09);}
        .lp-mini-c{font-size:14px;font-weight:600;}
        .lp-mini-c em{font-style:normal;color:rgba(255,255,255,0.5);margin-left:6px;font-size:12px;}
        .lp-mini-g{font-family:Poppins, system-ui, sans-serif;font-size:13px;font-weight:700;color:var(--gold);}

        .lp-faq{max-width:760px;margin:0 auto;}
        .lp-q{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:12px;}
        .lp-q-t{font-family:Poppins, system-ui, sans-serif;font-weight:700;font-size:16.5px;color:var(--ink);margin:0 0 6px;}
        .lp-q-a{font-size:14.5px;line-height:1.6;color:var(--mute);margin:0;}

        .lp-band{margin:64px 0 0;background:linear-gradient(135deg,var(--green),#0A6E45);color:#fff;text-align:center;padding:64px 20px;position:relative;overflow:hidden;}
        .lp-band:before{content:"";position:absolute;inset:0;background:radial-gradient(500px 240px at 50% 0%,rgba(232,178,58,0.22),transparent 60%);}
        .lp-band h2{position:relative;font-family:Poppins, system-ui, sans-serif;font-weight:800;font-size:34px;letter-spacing:-1px;margin:0 0 8px;}
        .lp-band p{position:relative;margin:0 0 26px;color:rgba(255,255,255,0.85);font-size:16px;}
        .lp-cta-light{position:relative;background:#fff;color:var(--ink);box-shadow:0 12px 26px rgba(0,0,0,0.18);}
        .lp-cta-light:hover{box-shadow:0 18px 34px rgba(0,0,0,0.26);}

        @media (min-width:820px){
          .lp-hero{grid-template-columns:1.05fr 0.95fr;align-items:center;padding:84px 24px 64px;}
          .lp-h1{font-size:62px;}
          .lp-steps{grid-template-columns:repeat(3,1fr);}
          .lp-feats{grid-template-columns:repeat(2,1fr);}
          .lp-show{grid-template-columns:1fr 1fr;gap:44px;}
        }
        @media (prefers-reduced-motion:reduce){
          .lp-hero-bg,.lp-hero-copy,.lp-hero-card{animation:none;}
        }
      `}</style>

      <SiteHeader />

      <header className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-hero-copy">
          <span className="lp-eyebrow">For Nigerian university students</span>
          <h1 className="lp-h1">Know your class.<br />Chase your goal.</h1>
          <p className="lp-sub">
            NaijaCGPA turns your grades into a plan. Calculate your CGPA on your school&rsquo;s exact
            scale, see the marks you need in every exam, and track your climb to First Class.
          </p>
          <div className="lp-ctas">
            <Link className="lp-cta" href="/calculator">Calculate my CGPA →</Link>
            <a className="lp-cta2" href="#how">See how it works</a>
          </div>
          <div className="lp-trust">Free · No sign-up to start · Works offline</div>
        </div>
        <div className="lp-hero-card">
          <HeroShowcase />
        </div>
      </header>

      <Reveal className="lp-pills">
        <div className="lp-pill"><b>5-point</b> &amp; <b>4-point</b> scales</div>
        <div className="lp-pill">Undergraduate &amp; Masters</div>
        <div className="lp-pill">Carryovers</div>
        <div className="lp-pill">CA &amp; exam planning</div>
        <div className="lp-pill">Cumulative CGPA</div>
      </Reveal>

      <section className="lp-section" id="how">
        <Reveal><div className="lp-kicker">How it works</div></Reveal>
        <Reveal delay={60}><h2 className="lp-h2">From grades to a game plan.</h2></Reveal>
        <div className="lp-steps">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="lp-step">
                <div className="lp-step-n">{s.n}</div>
                <div className="lp-step-t">{s.t}</div>
                <p className="lp-step-p">{s.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <Reveal><div className="lp-kicker">What you get</div></Reveal>
        <Reveal delay={60}><h2 className="lp-h2">Everything you need to move your number.</h2></Reveal>
        <div className="lp-feats">
          {features.map((f, i) => (
            <Reveal key={f.t} delay={i * 80}>
              <div className="lp-feat">
                <h3 className="lp-feat-t">{f.t}</h3>
                <p className="lp-feat-p">{f.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-show">
          <Reveal className="lp-show-copy">
            <div className="lp-kicker">The real question</div>
            <h2 className="lp-h2">&ldquo;Can I still make First Class?&rdquo;</h2>
            <p className="lp-show-p">
              Set your target and NaijaCGPA does the hard part — it tells you the exact average you
              need, then breaks it into the grade and score to aim for in every remaining course.
              No more guessing whether the goal is still on.
            </p>
            <Link className="lp-cta" href="/calculator">Try it now →</Link>
          </Reveal>
          <Reveal delay={120}>
            <div className="lp-mini">
              <p className="lp-mini-lead">To reach First Class you need to average</p>
              <div className="lp-mini-need"><b>4.79</b> / 5.00 across 24 units</div>
              <div className="lp-mini-row"><span className="lp-mini-c">CSC 401 <em>3u</em></span><span className="lp-mini-g">A · ≥ 70</span></div>
              <div className="lp-mini-row"><span className="lp-mini-c">MTH 303 <em>3u</em></span><span className="lp-mini-g">A · ≥ 70</span></div>
              <div className="lp-mini-row"><span className="lp-mini-c">GST 401 <em>2u</em></span><span className="lp-mini-g">B · ≥ 60</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-section">
        <Reveal><div className="lp-kicker">Questions</div></Reveal>
        <Reveal delay={60}><h2 className="lp-h2">Good to know.</h2></Reveal>
        <div className="lp-faq">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 70}>
              <div className="lp-q">
                <div className="lp-q-t">{f.q}</div>
                <p className="lp-q-a">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="lp-band">
        <h2>Your First Class starts with a number.</h2>
        <p>See where you stand in two minutes — free.</p>
        <Link className="lp-cta lp-cta-light" href="/calculator">Calculate my CGPA →</Link>
      </section>

      <SiteFooter />
    </div>
  );
}
