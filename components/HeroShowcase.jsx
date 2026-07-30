"use client";

import { useEffect, useState } from "react";

// The signature moment: the result card counts its CGPA up on load, then the
// gold class seal reveals. Gentle float afterwards. Reduced-motion → static.
export default function HeroShowcase() {
  const target = 4.62;
  const [val, setVal] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(target);
      setRevealed(true);
      return;
    }
    const dur = 1300;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setRevealed(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hs-wrap">
      <style>{`
        .hs-wrap{display:flex;justify-content:center;perspective:1200px;}
        .hs-card{width:300px;background:linear-gradient(150deg,#0B1F18,#08130E);border-radius:24px;
          padding:30px 26px;color:#fff;border:1px solid rgba(232,178,58,0.35);
          box-shadow:0 30px 70px rgba(11,31,24,0.32);position:relative;
          animation:hsFloat 6s ease-in-out infinite;transform:rotate(2deg);}
        .hs-card:before{content:"";position:absolute;inset:11px;border:1px solid rgba(232,178,58,0.18);border-radius:15px;pointer-events:none;}
        .hs-cap{display:flex;justify-content:center;margin-bottom:6px;}
        .hs-eye{font-family:Poppins, system-ui, sans-serif;font-size:11px;letter-spacing:0.24em;color:#E8B23A;text-align:center;}
        .hs-cgpa{font-family:Poppins, system-ui, sans-serif;font-weight:700;font-size:76px;text-align:center;line-height:1;margin:10px 0 2px;letter-spacing:-2px;}
        .hs-scale{text-align:center;font-size:12px;color:rgba(255,255,255,0.5);}
        .hs-seal{text-align:center;font-family:Poppins, system-ui, sans-serif;font-weight:800;font-size:24px;color:#12B76A;margin-top:14px;
          transition:opacity .5s ease,transform .5s cubic-bezier(.2,.7,.2,1);}
        .hs-goal{text-align:center;font-size:13px;color:#E8B23A;margin-top:8px;
          transition:opacity .5s ease .12s;}
        @keyframes hsFloat{0%,100%{transform:rotate(2deg) translateY(0)}50%{transform:rotate(2deg) translateY(-10px)}}
        @media (prefers-reduced-motion:reduce){ .hs-card{animation:none;} }
      `}</style>
      <div className="hs-card">
        <div className="hs-cap">
          <svg width="48" height="36" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 8 L74 26 L40 44 L6 26 Z" fill="#E8B23A" />
            <circle cx="40" cy="26" r="6" fill="#0B1F18" />
            <path d="M74 26 L74 41" stroke="#E8B23A" strokeWidth="3" strokeLinecap="round" />
            <circle cx="74" cy="44" r="4" fill="#E8B23A" />
          </svg>
        </div>
        <div className="hs-eye">RESULT CARD</div>
        <div className="hs-cgpa">{val.toFixed(2)}</div>
        <div className="hs-scale">on 5.00 scale</div>
        <div className="hs-seal" style={{ opacity: revealed ? 1 : 0, transform: revealed ? "none" : "scale(0.9)" }}>
          First Class
        </div>
        <div className="hs-goal" style={{ opacity: revealed ? 1 : 0 }}>
          Goal reached 🎯
        </div>
      </div>
    </div>
  );
}
