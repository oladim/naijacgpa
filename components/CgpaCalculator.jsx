"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * NaijaCGPA — school-specific CGPA calculator + shareable WhatsApp result card.
 *
 * v1 notes for you (the dev):
 * - Supports the two dominant Nigerian systems: 5-point (NUC standard) and 4-point.
 * - Grade boundaries differ slightly between schools (esp. 2:2 lower bound and D range).
 *   The mappings below are the most common. When you go per-school, key LEVELS (or each
 *   scale) by schoolId and let the school pick its own scale + class boundaries.
 * - No backend here. Drop into a Next.js app, add Supabase for accounts/persistence,
 *   and swap the DOMAIN constant below for your real domain in the share text.
 */

const DOMAIN = "naijacgpa.app"; // <-- change to your real domain

const LEVELS = {
  undergrad: {
    label: "Undergraduate",
    scales: {
      "5": {
        label: "5-point (standard)",
        grades: [
          { g: "A", p: 5, min: 70, range: "70–100" },
          { g: "B", p: 4, min: 60, range: "60–69" },
          { g: "C", p: 3, min: 50, range: "50–59" },
          { g: "D", p: 2, min: 45, range: "45–49" },
          { g: "E", p: 1, min: 40, range: "40–44" },
          { g: "F", p: 0, min: 0, range: "0–39" },
        ],
        max: 5,
        classes: [
          { name: "First Class", short: "First Class", min: 4.5 },
          { name: "Second Class Upper", short: "2:1", min: 3.5 },
          { name: "Second Class Lower", short: "2:2", min: 2.4 },
          { name: "Third Class", short: "Third Class", min: 1.5 },
          { name: "Pass", short: "Pass", min: 1.0 },
          { name: "Fail", short: "Fail", min: 0 },
        ],
      },
      "4": {
        label: "4-point",
        grades: [
          { g: "A", p: 4, min: 70, range: "70–100" },
          { g: "B", p: 3, min: 60, range: "60–69" },
          { g: "C", p: 2, min: 50, range: "50–59" },
          { g: "D", p: 1, min: 45, range: "45–49" },
          { g: "F", p: 0, min: 0, range: "0–44" },
        ],
        max: 4,
        classes: [
          { name: "First Class", short: "First Class", min: 3.5 },
          { name: "Second Class Upper", short: "2:1", min: 3.0 },
          { name: "Second Class Lower", short: "2:2", min: 2.0 },
          { name: "Third Class", short: "Third Class", min: 1.0 },
          { name: "Fail", short: "Fail", min: 0 },
        ],
      },
    },
  },
  masters: {
    label: "Masters",
    scales: {
      "5": {
        label: "5-point",
        grades: [
          { g: "A", p: 5, min: 70, range: "70–100" },
          { g: "B", p: 4, min: 60, range: "60–69" },
          { g: "C", p: 3, min: 50, range: "50–59" },
          { g: "F", p: 0, min: 0, range: "0–49" },
        ],
        max: 5,
        classes: [
          { name: "Distinction", short: "Distinction", min: 4.5 },
          { name: "Pass", short: "Pass", min: 3.0 },
          { name: "Fail", short: "Fail", min: 0 },
        ],
      },
      "4": {
        label: "4-point",
        grades: [
          { g: "A", p: 4, min: 70, range: "70–100" },
          { g: "B", p: 3, min: 60, range: "60–69" },
          { g: "C", p: 2, min: 50, range: "50–59" },
          { g: "F", p: 0, min: 0, range: "0–49" },
        ],
        max: 4,
        classes: [
          { name: "Distinction", short: "Distinction", min: 3.5 },
          { name: "Pass", short: "Pass", min: 2.5 },
          { name: "Fail", short: "Fail", min: 0 },
        ],
      },
    },
  },
};

const uid = () => Math.random().toString(36).slice(2, 9);

// Round to 2 decimals — the precision students actually see. Classifying and
// measuring gaps against this exact value keeps the number, the class, and the
// gap from ever contradicting each other (e.g. "4.50" shown but classed 2:1).
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

// Map a typed exam score (0–100) to a letter grade in the given system.
function gradeFromScore(score, sys) {
  const n = Number(score);
  if (score === "" || isNaN(n)) return null;
  const clamped = Math.max(0, Math.min(100, n));
  const hit = sys.grades.find((g) => clamped >= g.min);
  return (hit || sys.grades[sys.grades.length - 1]).g;
}

function classify(cgpa, sys) {
  if (!isFinite(cgpa)) return sys.classes[sys.classes.length - 1];
  return sys.classes.find((c) => cgpa >= c.min) || sys.classes[sys.classes.length - 1];
}

export default function CgpaCalculator({ onSave, saving = false, storage } = {}) {
  const [level, setLevel] = useState("undergrad");
  const [scale, setScale] = useState("5");
  const [inputMode, setInputMode] = useState("grade"); // "grade" | "score"
  const sys = LEVELS[level].scales[scale];

  const [name, setName] = useState("");
  const [courses, setCourses] = useState([]);

  // CA (continuous assessment) is this % of a course; exam is the rest.
  const [caWeight, setCaWeight] = useState(30);
  // Target GPA for THIS semester (drives the exam plan).
  const [semTargetGpa, setSemTargetGpa] = useState("");

  // How the school treats a failed carryover once it's on record:
  // false = grade retention (the F keeps counting) — common at federal unis
  // true  = grade replacement (a failed carryover is expunged from CGPA)
  const [expungeFailedCarryovers, setExpungeFailedCarryovers] = useState(false);

  const [priorSemesters, setPriorSemesters] = useState([]);

  const [targetShort, setTargetShort] = useState(sys.classes[0].short);
  const [unitsRemaining, setUnitsRemaining] = useState("");
  // Optional: the specific courses making up the remaining units, so we can
  // turn the required average into a per-course grade/score plan.
  const [remainingCourses, setRemainingCourses] = useState([]);

  const canvasRef = useRef(null);

  // Re-validate every course whenever the grading system changes (level/scale).
  // If a course was entered by score, re-derive its grade; otherwise clamp any
  // grade that no longer exists in the new system (e.g. D/E when moving to masters).
  const applySystem = (nextLevel, nextScale) => {
    const nextSys = LEVELS[nextLevel].scales[nextScale];
    const validGrades = nextSys.grades.map((x) => x.g);
    setCourses((cs) =>
      cs.map((c) => {
        if (c.score !== "" && c.score != null) {
          return { ...c, grade: gradeFromScore(c.score, nextSys) || validGrades[0] };
        }
        return { ...c, grade: validGrades.includes(c.grade) ? c.grade : validGrades[0] };
      })
    );
    setTargetShort(nextSys.classes[0].short);
  };

  const onLevelChange = (l) => {
    setLevel(l);
    applySystem(l, scale);
  };
  const onScaleChange = (s) => {
    setScale(s);
    applySystem(level, s);
  };

  const pointFor = (g) => sys.grades.find((x) => x.g === g)?.p ?? 0;

  const examWeight = 100 - caWeight;
  // Smallest grade whose points meet or exceed a required average point.
  const gradeAtLeastPoint = (pt) =>
    [...sys.grades].sort((a, b) => a.p - b.p).find((g) => g.p >= pt) || sys.grades[0];
  // What the student needs in the exam (out of examWeight) to reach a grade,
  // given a CA already earned (out of caWeight). Returns a verdict + mark.
  const examNeed = (caScore, gradeObj) => {
    const need = gradeObj.min - (Number(caScore) || 0);
    if (need <= 0) return { verdict: "secured", mark: 0 };
    if (need > examWeight) return { verdict: "impossible", mark: need };
    return { verdict: "possible", mark: need };
  };

  const sem = useMemo(() => {
    let qp = 0;
    let units = 0;
    let pendingUnits = 0;
    for (const c of courses) {
      const u = Number(c.units) || 0;
      // Not taken yet: no grade, so it can't count toward GPA.
      if (c.status === "pending") {
        pendingUnits += u;
        continue;
      }
      // Exam pending (only CA in): no final grade yet, so excluded from the
      // real GPA. Handled separately by the exam plan below.
      if (c.status === "exam_pending") {
        continue;
      }
      // Failed carryover under a grade-replacement policy: excluded from CGPA
      // because the F will be replaced by the retake grade.
      if (c.status === "carryover" && c.grade === "F" && expungeFailedCarryovers) {
        continue;
      }
      units += u;
      qp += u * pointFor(c.grade);
    }
    const gpa = units > 0 ? qp / units : NaN;
    return { qp, units, gpa, pendingUnits };
  }, [courses, scale, expungeFailedCarryovers]);

  const cumulative = useMemo(() => {
    let priorQp = 0;
    let priorUnits = 0;
    for (const s of priorSemesters) {
      const u = Number(s.units) || 0;
      priorUnits += u;
      priorQp += u * (Number(s.gpa) || 0);
    }
    const totalUnits = priorUnits + sem.units;
    const totalQp = priorQp + sem.qp;
    const cgpa = totalUnits > 0 ? totalQp / totalUnits : NaN;
    return { cgpa, totalUnits, priorUnits };
  }, [priorSemesters, sem]);

  const hasPrior = cumulative.priorUnits > 0;
  const shownCgpa = hasPrior ? cumulative.cgpa : sem.gpa;
  const shownUnits = hasPrior ? cumulative.totalUnits : sem.units;
  const cls = classify(round2(shownCgpa), sys);

  const predictor = useMemo(() => {
    const target = sys.classes.find((c) => c.short === targetShort);
    const remUnits = remainingCourses.reduce((s, c) => s + (Number(c.units) || 0), 0);
    // Anchor to the total the student committed to (typed or pending). Only fall
    // back to the itemized sum when neither is given — otherwise adding a course
    // one at a time would shrink R and wrongly flip the verdict to impossible.
    const R = Number(unitsRemaining) || sem.pendingUnits || remUnits || 0;
    const U = shownUnits;
    if (!target || R <= 0 || !isFinite(shownCgpa)) return null;
    const requiredTotal = target.min * (U + R);
    const have = shownCgpa * U;
    const requiredGpa = (requiredTotal - have) / R;
    let verdict;
    if (requiredGpa <= 0) verdict = "secured";
    else if (requiredGpa > sys.max) verdict = "impossible";
    else verdict = "possible";
    return { requiredGpa, verdict, target, usedUnits: R };
  }, [targetShort, unitsRemaining, remainingCourses, shownCgpa, shownUnits, sys, sem.pendingUnits]);

  // Student enters the score they expect in each remaining course; we derive the
  // grade, project the final CGPA those scores would produce, and check the target.
  const projection = useMemo(() => {
    const list = remainingCourses.filter((c) => Number(c.units) > 0);
    if (!list.length || !isFinite(shownCgpa)) return null;
    const target = sys.classes.find((c) => c.short === targetShort);

    let remUnits = 0;
    let remQp = 0;
    let allScored = true;
    const rows = list.map((c) => {
      const u = Number(c.units) || 0;
      remUnits += u;
      const has = c.score !== "" && c.score != null;
      if (!has) allScored = false;
      const grade = has ? gradeFromScore(c.score, sys) : null;
      const points = grade ? pointFor(grade) : 0;
      remQp += u * points; // blank counts as 0 until filled
      return { ...c, grade, points, has };
    });

    const haveQp = shownCgpa * shownUnits;
    const totalUnits = shownUnits + remUnits;
    const projCgpa = round2(totalUnits > 0 ? (haveQp + remQp) / totalUnits : NaN);
    const projClass = classify(projCgpa, sys);
    const meets = target ? projCgpa >= target.min : false;
    const gap = target ? Math.max(0, round2(target.min - projCgpa)) : 0;
    return { rows, remUnits, projCgpa, projClass, meets, gap, allScored, target };
  }, [remainingCourses, shownCgpa, shownUnits, targetShort, sys]);

  const examPending = useMemo(
    () => courses.filter((c) => c.status === "exam_pending"),
    [courses]
  );

  // Feature 2: given CA already in and a semester GPA target, what average is
  // still needed across the exam-pending courses, and is it reachable?
  const semPlan = useMemo(() => {
    const epUnits = examPending.reduce((s, c) => s + (Number(c.units) || 0), 0);
    const T = Number(semTargetGpa);
    if (!epUnits || !T) return null;
    const reqTotal = T * (sem.units + epUnits) - sem.qp;
    const reqAvg = reqTotal / epUnits;
    let verdict = "possible";
    if (reqAvg <= 0) verdict = "secured";
    else if (reqAvg > sys.max) verdict = "impossible";
    const suggest = verdict === "possible" ? gradeAtLeastPoint(reqAvg) : null;
    return { epUnits, reqAvg, verdict, suggest };
  }, [examPending, semTargetGpa, sem.units, sem.qp, sys]);

  // Feature 3 (in-app): pick one motivational nudge from the current state.
  const nudge = useMemo(() => {
    const active = courses.filter((c) => c.code || c.status !== "graded");
    if (courses.length === 0)
      return { tone: "start", text: "New semester? Add your courses to start tracking your CGPA." };
    if (examPending.length === 0 && !courses.some((c) => c.status === "graded" && c.code))
      return { tone: "start", text: "Add each course, then pop in your CA scores as they come — I'll tell you what you need in the exams." };
    if (semPlan?.verdict === "impossible")
      return { tone: "warn", text: `Your semester target needs more than your courses can give from here. Try a slightly lower target — progress beats a number.` };
    if (semPlan?.verdict === "possible")
      return { tone: "push", text: `You're in range. Aim for about ${semPlan.suggest.g} in each exam-pending course and you hit your semester target. Lock in now.` };
    if (semPlan?.verdict === "secured")
      return { tone: "win", text: `Your CA already sets you up — don't ease off, finish strong and bank the grade.` };
    if (examPending.length > 0)
      return { tone: "push", text: `Set a semester target below and I'll tell you exactly what each exam needs. You've got this.` };
    return { tone: "win", text: `Looking good. Keep your grades updated and share your card to stay accountable.` };
  }, [courses, examPending, semPlan]);

  // Offline drafts. `storage` is injected by the host app (localStorage-backed);
  // when absent (e.g. preview), the calculator simply doesn't persist.
  const hydrated = useRef(false);
  const [ready, setReady] = useState(false);

  const buildDraft = () => ({
    level, scale, inputMode, name, courses, priorSemesters,
    expungeFailedCarryovers, caWeight, semTargetGpa, targetShort, unitsRemaining, remainingCourses,
  });
  const applyDraft = (d) => {
    if (d.level) setLevel(d.level);
    if (d.scale) setScale(d.scale);
    if (d.inputMode) setInputMode(d.inputMode);
    if (typeof d.name === "string") setName(d.name);
    if (Array.isArray(d.courses) && d.courses.length) setCourses(d.courses);
    if (Array.isArray(d.priorSemesters)) setPriorSemesters(d.priorSemesters);
    if (typeof d.expungeFailedCarryovers === "boolean") setExpungeFailedCarryovers(d.expungeFailedCarryovers);
    if (d.caWeight) setCaWeight(Number(d.caWeight));
    if (typeof d.semTargetGpa === "string") setSemTargetGpa(d.semTargetGpa);
    if (d.targetShort) setTargetShort(d.targetShort);
    if (typeof d.unitsRemaining === "string") setUnitsRemaining(d.unitsRemaining);
    if (Array.isArray(d.remainingCourses)) setRemainingCourses(d.remainingCourses);
  };

  useEffect(() => {
    if (hydrated.current || !storage) return;
    hydrated.current = true;
    try {
      const saved = storage.load?.();
      if (saved) applyDraft(saved);
    } catch {}
    setReady(true);
  }, [storage]);

  useEffect(() => {
    if (!ready || !storage?.save) return;
    const t = setTimeout(() => {
      try {
        storage.save(buildDraft());
      } catch {}
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, level, scale, inputMode, name, courses, priorSemesters, expungeFailedCarryovers, caWeight, semTargetGpa, targetShort, unitsRemaining, remainingCourses]);

  const addCourse = () =>
    setCourses((cs) => [
      ...cs,
      { id: uid(), code: "", units: 3, grade: sys.grades[0].g, score: "", ca: "", examTarget: sys.grades[0].g, status: "graded" },
    ]);
  const removeCourse = (id) => setCourses((cs) => cs.filter((c) => c.id !== id));
  const updateCourse = (id, patch) =>
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const setCourseScore = (id, value) =>
    setCourses((cs) =>
      cs.map((c) =>
        c.id === id
          ? { ...c, score: value, grade: gradeFromScore(value, sys) || c.grade }
          : c
      )
    );

  const addPriorSemester = () =>
    setPriorSemesters((ps) => [
      ...ps,
      { id: uid(), label: `Semester ${ps.length + 1}`, gpa: "", units: "" },
    ]);
  const removePriorSemester = (id) =>
    setPriorSemesters((ps) => ps.filter((s) => s.id !== id));
  const updatePriorSemester = (id, patch) =>
    setPriorSemesters((ps) => ps.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addRemaining = () =>
    setRemainingCourses((rc) => [...rc, { id: uid(), code: "", units: 3, score: "" }]);
  const removeRemaining = (id) =>
    setRemainingCourses((rc) => rc.filter((c) => c.id !== id));
  const updateRemaining = (id, patch) =>
    setRemainingCourses((rc) => rc.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const cgpaText = isFinite(shownCgpa) ? round2(shownCgpa).toFixed(2) : "—";
  const hasResult = isFinite(shownCgpa);

  const shareText = () => {
    const who = name ? `${name} — ` : "";
    const goal =
      predictor && predictor.verdict !== "impossible"
        ? ` Chasing ${predictor.target.short} 🎯`
        : "";
    return `${who}CGPA ${cgpaText} • ${cls.short}${goal}\nCalculate yours 👉 https://${DOMAIN}`;
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText())}`;
    window.open(url, "_blank");
  };

  // ---- Canvas card (the WhatsApp-status flex asset) ----
  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0B1F18");
    bg.addColorStop(1, "#08130E");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // subtle emerald glow
    const glow = ctx.createRadialGradient(W / 2, 470, 60, W / 2, 470, 620);
    glow.addColorStop(0, "rgba(18,183,106,0.18)");
    glow.addColorStop(1, "rgba(18,183,106,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // gold frame
    ctx.strokeStyle = "#E8B23A";
    ctx.lineWidth = 3;
    ctx.strokeRect(56, 56, W - 112, H - 112);
    ctx.strokeStyle = "rgba(232,178,58,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(70, 70, W - 140, H - 140);

    ctx.textAlign = "center";

    // eyebrow
    ctx.fillStyle = "#E8B23A";
    ctx.font = "600 30px 'JetBrains Mono', monospace";
    ctx.fillText("R E S U L T   C A R D", W / 2, 200);

    // name / label
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "500 40px Inter, sans-serif";
    ctx.fillText(name ? name.toUpperCase() : "MY CGPA", W / 2, 300);

    // big CGPA
    ctx.fillStyle = "#F7F5EF";
    ctx.font = "700 380px 'JetBrains Mono', monospace";
    ctx.fillText(cgpaText, W / 2, 700);

    // scale label
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "500 34px Inter, sans-serif";
    ctx.fillText(`on ${sys.max}.00 scale`, W / 2, 770);

    // class seal
    ctx.fillStyle = "#12B76A";
    ctx.font = "700 78px 'Bricolage Grotesque', Inter, sans-serif";
    ctx.fillText((hasResult ? cls.short : "Nothing yet").toUpperCase(), W / 2, 900);

    // units line
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 34px Inter, sans-serif";
    ctx.fillText(`${shownUnits} credit units counted`, W / 2, 970);

    // goal
    if (predictor && predictor.verdict !== "impossible") {
      ctx.fillStyle = "#E8B23A";
      ctx.font = "600 44px Inter, sans-serif";
      ctx.fillText(`Chasing ${predictor.target.short}`, W / 2, 1120);
    }

    // footer
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "600 34px 'JetBrains Mono', monospace";
    ctx.fillText(DOMAIN, W / 2, 1240);

    return canvas;
  };

  const saveImage = () => {
    const canvas = drawCard();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `cgpa-${cgpaText}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="ncg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');
        .ncg-root{
          --ink:#0B1F18; --ink2:#08130E; --paper:#F4F6F3; --card:#FFFFFF;
          --line:#E2E7E2; --muted:#5B6B62; --green:#0F8A5F; --green2:#12B76A;
          --gold:#E8B23A; --red:#E5484D; --text:#132A22;
          font-family:Inter,system-ui,sans-serif; color:var(--text);
          background:var(--paper); min-height:100vh; padding:8px 16px 48px;
          -webkit-font-smoothing:antialiased;
        }
        .ncg-wrap{max-width:520px;margin:0 auto;}
        .ncg-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;
          gap:10px;padding:10px 4px;margin-bottom:4px;background:var(--paper);}
        .ncg-logo{font-family:'Bricolage Grotesque',Inter,sans-serif;font-weight:800;
          font-size:24px;letter-spacing:-0.5px;color:var(--ink);}
        .ncg-logo span{color:var(--green);}
        .ncg-topstat{display:flex;align-items:baseline;gap:8px;}
        .ncg-topcgpa{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:22px;
          letter-spacing:-0.5px;color:var(--ink);}
        .ncg-topclass{font-family:'Bricolage Grotesque',Inter,sans-serif;font-weight:800;
          font-size:13px;color:var(--green);}
        .ncg-scale{display:inline-flex;background:#E7ECE8;border-radius:999px;padding:3px;margin:16px 0 8px;}
        .ncg-scale button{border:0;background:transparent;font:inherit;font-size:13px;font-weight:600;
          color:var(--muted);padding:7px 14px;border-radius:999px;cursor:pointer;}
        .ncg-scale button[data-on="true"]{background:var(--ink);color:#fff;}
        .ncg-selectors{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;}
        .ncg-selectors .ncg-scale{margin:0;}
        .ncg-course-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;}
        .ncg-mode{display:inline-flex;background:#E7ECE8;border-radius:999px;padding:3px;}
        .ncg-mode button{border:0;background:transparent;font:inherit;font-size:12.5px;font-weight:700;
          color:var(--muted);padding:6px 13px;border-radius:999px;cursor:pointer;}
        .ncg-mode button[data-on="true"]{background:var(--green);color:#fff;}
        .ncg-scoremode{display:flex;align-items:center;gap:8px;}
        .ncg-score{width:78px;border:1px solid var(--line);border-radius:9px;padding:9px 10px;
          font:inherit;font-size:15px;text-align:center;background:#fff;box-sizing:border-box;}
        .ncg-score:focus{outline:2px solid var(--green2);border-color:transparent;}
        .ncg-derived{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;
          color:var(--green);background:#E9F5EE;border-radius:8px;padding:6px 10px;min-width:52px;text-align:center;}
        .ncg-panel{background:var(--card);border:1px solid var(--line);border-radius:16px;
          padding:16px;margin-top:14px;}
        .ncg-label{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
          color:var(--muted);margin-bottom:10px;}
        .ncg-course{border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:8px;background:#fff;}
        .ncg-course[data-status="pending"]{background:#F7F9F7;border-style:dashed;}
        .ncg-course[data-status="carryover"]{border-color:#F0D9A3;background:#FFFDF6;}
        .ncg-course-top{display:grid;grid-template-columns:1fr 64px 32px;gap:8px;align-items:center;}
        .ncg-course-bot{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap;}
        .ncg-course input{width:100%;border:1px solid var(--line);border-radius:10px;padding:11px 12px;
          font:inherit;font-size:15px;color:var(--text);background:#fff;box-sizing:border-box;}
        .ncg-course input:focus{outline:2px solid var(--green2);border-color:transparent;}
        .ncg-units{text-align:center;}
        .ncg-status{border:1px solid var(--line);border-radius:9px;padding:8px 8px;font:inherit;font-size:13px;
          font-weight:600;color:var(--text);background:#fff;cursor:pointer;flex:0 0 auto;}
        .ncg-await{font-size:13px;color:var(--muted);font-style:italic;}
        .ncg-course[data-status="exam_pending"]{border-color:#BFE3D0;background:#F3FBF6;}
        .ncg-nudge{margin:14px 0 0;padding:12px 14px;border-radius:12px;font-size:13.5px;line-height:1.5;font-weight:500;}
        .ncg-nudge[data-tone="start"]{background:#EAF4FF;color:#134E82;}
        .ncg-nudge[data-tone="push"]{background:#FBF1D8;color:#7A5A12;}
        .ncg-nudge[data-tone="win"]{background:#E3F6EC;color:#0A6B45;}
        .ncg-nudge[data-tone="warn"]{background:#FDECEC;color:#8A2A2E;}
        .ncg-acc{padding:0;overflow:hidden;}
        .ncg-acc > summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;padding:16px;
          font-family:'Bricolage Grotesque',Inter,sans-serif;font-weight:800;font-size:15px;color:var(--ink);}
        .ncg-acc > summary::-webkit-details-marker{display:none;}
        .ncg-acc > summary > span{flex:1;}
        .ncg-acc > summary small{font-family:Inter,sans-serif;font-weight:600;font-size:12px;color:var(--muted);}
        .ncg-acc > summary::after{content:"⌄";color:var(--muted);font-size:18px;line-height:1;
          transform:translateY(-3px);transition:transform .2s;}
        .ncg-acc[open] > summary::after{transform:rotate(180deg);}
        .ncg-acc[open] > summary{border-bottom:1px solid var(--line);}
        .ncg-acc > *:not(summary){margin-left:16px;margin-right:16px;}
        .ncg-acc > *:not(summary):last-child{margin-bottom:16px;}
        .ncg-acc[open] > .ncg-field:first-of-type,.ncg-acc[open] > *:nth-child(2){margin-top:14px;}
        .ncg-caweight{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:14px;
          font-size:13px;color:var(--muted);font-weight:500;}
        .ncg-caweight select{border:1px solid var(--line);border-radius:8px;padding:5px 6px;font:inherit;
          font-size:13px;font-weight:700;color:var(--text);background:#fff;}
        .ncg-quickchips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
        .ncg-quickchips button{border:1px solid var(--line);background:#fff;border-radius:999px;
          padding:6px 11px;font:inherit;font-size:12px;font-weight:600;color:var(--green);cursor:pointer;}
        .ncg-ca{display:flex;flex-direction:column;gap:6px;flex:1;}
        .ncg-ca-row{display:flex;gap:8px;align-items:flex-end;}
        .ncg-ca-label{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:700;
          text-transform:uppercase;letter-spacing:0.04em;color:var(--muted);}
        .ncg-ca-input{width:66px;border:1px solid var(--line);border-radius:9px;padding:8px 10px;
          font:inherit;font-size:15px;text-align:center;background:#fff;box-sizing:border-box;}
        .ncg-ca-input:focus,.ncg-ca-target:focus{outline:2px solid var(--green2);border-color:transparent;}
        .ncg-ca-target{border:1px solid var(--line);border-radius:9px;padding:8px 8px;font:inherit;
          font-size:15px;font-weight:700;background:#fff;color:var(--text);}
        .ncg-ca-out{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;}
        .ncg-ca-need{color:var(--text);} .ncg-ca-need b{font-family:'JetBrains Mono',monospace;color:var(--green);}
        .ncg-ca-ok{color:#0A6B45;font-weight:600;}
        .ncg-ca-no{color:#A21D22;font-weight:600;}
        .ncg-ca-floor{font-size:11px;font-weight:700;color:var(--muted);background:#EEF2EE;
          border-radius:999px;padding:2px 8px;}
        .ncg-breakdown{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);}
        .ncg-bd-head{display:flex;align-items:center;justify-content:space-between;gap:10px;
          font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);}
        .ncg-bd-add,.ncg-add{cursor:pointer;}
        .ncg-bd-add{border:1px solid var(--line);background:#fff;border-radius:9px;padding:6px 10px;
          font:inherit;font-size:12px;font-weight:700;color:var(--green);}
        .ncg-plan{margin-top:12px;background:linear-gradient(135deg,var(--ink),var(--ink2));
          border-radius:14px;padding:16px;color:#fff;border:1px solid rgba(232,178,58,0.3);text-align:center;}
        .ncg-plan-note{font-size:12px;color:rgba(255,255,255,0.6);text-transform:uppercase;
          letter-spacing:0.08em;font-weight:700;}
        .ncg-proj-cgpa{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:56px;
          line-height:1.1;letter-spacing:-1px;}
        .ncg-proj-class{font-family:'Bricolage Grotesque',Inter,sans-serif;font-weight:800;
          font-size:20px;color:var(--green2);margin-bottom:10px;}
        .ncg-proj-verdict .ncg-pill{font-size:13px;}
        .ncg-proj-hint{font-size:12px;color:rgba(255,255,255,0.6);margin:12px 0 0;line-height:1.5;}
        .ncg-rc{border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:8px;background:#fff;}
        .ncg-rc-top{display:grid;grid-template-columns:1fr 60px 32px;gap:8px;align-items:center;}
        .ncg-rc-bot{display:flex;gap:8px;align-items:center;margin-top:8px;}
        .ncg-rc input{border:1px solid var(--line);border-radius:10px;padding:11px 12px;font:inherit;
          font-size:15px;color:var(--text);background:#fff;box-sizing:border-box;width:100%;}
        .ncg-rc input:focus{outline:2px solid var(--green2);border-color:transparent;}
        .ncg-grades{display:flex;gap:3px;flex-wrap:wrap;}
        .ncg-grades button{width:30px;height:38px;border:1px solid var(--line);background:#fff;border-radius:8px;
          font:inherit;font-weight:700;font-size:13px;color:var(--muted);cursor:pointer;padding:0;}
        .ncg-grades button[data-on="true"]{background:var(--green);border-color:var(--green);color:#fff;}
        .ncg-del{border:0;background:transparent;color:#B9C2BC;font-size:20px;cursor:pointer;line-height:1;}
        .ncg-del:hover{color:var(--red);}
        .ncg-add{width:100%;border:1px dashed #C4CEC7;background:#fff;border-radius:10px;padding:11px;
          font:inherit;font-weight:600;font-size:14px;color:var(--green);cursor:pointer;margin-top:4px;}
        .ncg-policy{align-items:flex-start;margin-top:14px;font-weight:500;}
        .ncg-policy input{margin-top:2px;flex:0 0 auto;}
        .ncg-policy em{display:block;font-style:normal;font-size:12px;color:var(--muted);margin-top:3px;}
        .ncg-prow{display:grid;grid-template-columns:1fr 72px 72px 32px;gap:8px;align-items:center;margin-bottom:8px;}
        .ncg-prow input{width:100%;border:1px solid var(--line);border-radius:10px;padding:11px 12px;
          font:inherit;font-size:15px;color:var(--text);background:#fff;box-sizing:border-box;}
        .ncg-prow input:focus{outline:2px solid var(--green2);border-color:transparent;}
        .ncg-hint{font-size:13px;color:var(--muted);line-height:1.5;margin:0 0 12px;}
        .ncg-toggle{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;cursor:pointer;color:var(--text);}
        .ncg-toggle input{width:18px;height:18px;accent-color:var(--green);}
        .ncg-two{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;}
        .ncg-field label{display:block;font-size:12px;color:var(--muted);margin-bottom:5px;font-weight:600;}
        .ncg-field input,.ncg-field select{width:100%;border:1px solid var(--line);border-radius:10px;
          padding:11px 12px;font:inherit;font-size:15px;background:#fff;box-sizing:border-box;}
        .ncg-result{background:linear-gradient(135deg,var(--ink),var(--ink2));border-radius:20px;
          padding:26px 22px;margin-top:18px;color:#fff;position:relative;overflow:hidden;
          border:1px solid rgba(232,178,58,0.35);}
        .ncg-result:before{content:"";position:absolute;inset:10px;border:1px solid rgba(232,178,58,0.18);
          border-radius:14px;pointer-events:none;}
        .ncg-eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.22em;
          color:var(--gold);text-align:center;}
        .ncg-name{text-align:center;font-size:14px;color:rgba(255,255,255,0.7);margin-top:12px;font-weight:500;
          min-height:18px;}
        .ncg-big{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:96px;line-height:1;
          text-align:center;margin:6px 0 2px;letter-spacing:-2px;}
        .ncg-scale-note{text-align:center;font-size:13px;color:rgba(255,255,255,0.5);}
        .ncg-class{text-align:center;font-family:'Bricolage Grotesque',Inter,sans-serif;font-weight:800;
          font-size:26px;color:var(--green2);margin-top:14px;}
        .ncg-units-note{text-align:center;font-size:13px;color:rgba(255,255,255,0.55);margin-top:4px;}
        .ncg-goal{text-align:center;font-size:14px;color:var(--gold);font-weight:600;margin-top:10px;}
        .ncg-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;}
        .ncg-btn{border:0;border-radius:12px;padding:14px;font:inherit;font-weight:700;font-size:15px;
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;}
        .ncg-btn-wa{background:#25D366;color:#04331b;}
        .ncg-btn-img{background:#fff;color:var(--ink);border:1px solid rgba(255,255,255,0.25);}
        .ncg-btn-save{width:100%;margin-top:10px;background:var(--gold);color:#3d2c05;}
        .ncg-btn-save:disabled{opacity:0.6;cursor:default;}
        .ncg-name-input{width:100%;border:1px solid var(--line);border-radius:10px;padding:11px 12px;
          font:inherit;font-size:15px;background:#fff;box-sizing:border-box;margin-top:6px;}
        .ncg-pred{margin-top:8px;font-size:14px;line-height:1.5;}
        .ncg-pred b{font-family:'JetBrains Mono',monospace;}
        .ncg-pill{display:inline-block;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;}
        .ncg-pill.ok{background:#E3F6EC;color:#0A6B45;}
        .ncg-pill.no{background:#FCE8E8;color:#A21D22;}
        .ncg-pill.sec{background:#FBF1D8;color:#8A6516;}
        .ncg-foot{text-align:center;font-size:12px;color:var(--muted);margin-top:22px;line-height:1.6;}
        @media (max-width:380px){ .ncg-big{font-size:80px;} }
      `}</style>

      <div className="ncg-wrap">
        <div className="ncg-topbar">
          <div className="ncg-logo">Naija<span>CGPA</span></div>
          <div className="ncg-topstat">
            <span className="ncg-topcgpa">{cgpaText}</span>
            <span className="ncg-topclass">{hasResult ? cls.short : "Nothing yet"}</span>
          </div>
        </div>

        <div className="ncg-selectors">
          <div className="ncg-scale" role="tablist" aria-label="Programme level">
            {Object.entries(LEVELS).map(([k, v]) => (
              <button key={k} data-on={level === k} onClick={() => onLevelChange(k)}>
                {v.label}
              </button>
            ))}
          </div>
          <div className="ncg-scale" role="tablist" aria-label="Grading scale">
            {Object.entries(LEVELS[level].scales).map(([k, v]) => (
              <button key={k} data-on={scale === k} onClick={() => onScaleChange(k)}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {nudge && (
          <div className="ncg-nudge" data-tone={nudge.tone}>
            {nudge.text}
          </div>
        )}

        {/* Courses */}
        <div className="ncg-panel">
          <div className="ncg-course-head">
            <div className="ncg-label" style={{ margin: 0 }}>This semester&rsquo;s courses</div>
            {courses.length > 0 && (
              <div className="ncg-mode" role="tablist" aria-label="Enter results by">
                <button data-on={inputMode === "grade"} onClick={() => setInputMode("grade")}>
                  Grade
                </button>
                <button data-on={inputMode === "score"} onClick={() => setInputMode("score")}>
                  Score
                </button>
              </div>
            )}
          </div>
          {courses.length === 0 && (
            <p className="ncg-hint" style={{ margin: "0 0 12px" }}>
              Tap <b>Add course</b> to start entering this semester&rsquo;s courses.
            </p>
          )}
          {courses.map((c) => (
            <div className="ncg-course" key={c.id} data-status={c.status}>
              <div className="ncg-course-top">
                <input
                  placeholder="Course (e.g. GST 101)"
                  value={c.code}
                  onChange={(e) => updateCourse(c.id, { code: e.target.value })}
                />
                <input
                  className="ncg-units"
                  type="number"
                  min="0"
                  max="12"
                  value={c.units}
                  onChange={(e) => updateCourse(c.id, { units: e.target.value })}
                  aria-label="Credit units"
                />
                <button
                  className="ncg-del"
                  onClick={() => removeCourse(c.id)}
                  aria-label="Remove course"
                >
                  &times;
                </button>
              </div>
              <div className="ncg-course-bot">
                <select
                  className="ncg-status"
                  value={c.status}
                  onChange={(e) => updateCourse(c.id, { status: e.target.value })}
                  aria-label="Course status"
                >
                  <option value="graded">Graded</option>
                  <option value="exam_pending">Exam pending (CA in)</option>
                  <option value="carryover">Carryover</option>
                  <option value="pending">Not taken yet</option>
                </select>
                {c.status === "pending" ? (
                  <span className="ncg-await">No result yet — not counted</span>
                ) : c.status === "exam_pending" ? (
                  <CaPlan
                    c={c}
                    sys={sys}
                    caWeight={caWeight}
                    examWeight={examWeight}
                    gradeFromScore={gradeFromScore}
                    examNeed={examNeed}
                    onCa={(v) => updateCourse(c.id, { ca: v })}
                    onTarget={(g) => updateCourse(c.id, { examTarget: g })}
                  />
                ) : inputMode === "score" ? (
                  <div className="ncg-scoremode">
                    <input
                      className="ncg-score"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Score"
                      value={c.score}
                      onChange={(e) => setCourseScore(c.id, e.target.value)}
                      aria-label="Exam score out of 100"
                    />
                    <span className="ncg-derived" title="Grade from your score">
                      {c.score === "" ? "—" : `${c.grade} · ${sys.grades.find((g) => g.g === c.grade)?.p ?? 0}pt`}
                    </span>
                  </div>
                ) : (
                  <div className="ncg-grades">
                    {sys.grades.map((gr) => (
                      <button
                        key={gr.g}
                        data-on={c.grade === gr.g}
                        onClick={() => updateCourse(c.id, { grade: gr.g, score: "" })}
                        title={`${gr.g} (${gr.range}) = ${gr.p}`}
                      >
                        {gr.g}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button className="ncg-add" onClick={addCourse}>+ Add course</button>

          {courses.some((c) => c.status === "carryover") && (
            <label className="ncg-toggle ncg-policy">
              <input
                type="checkbox"
                checked={expungeFailedCarryovers}
                onChange={(e) => setExpungeFailedCarryovers(e.target.checked)}
              />
              <span>
                My school replaces failed grades on retake (grade replacement)
                <em>
                  {expungeFailedCarryovers
                    ? "Failed carryovers are left out of your CGPA."
                    : "Failed carryovers still count as 0 in your CGPA."}
                </em>
              </span>
            </label>
          )}

          {examPending.length > 0 && (
            <div className="ncg-caweight">
              <span>CA is</span>
              <select
                value={caWeight}
                onChange={(e) => setCaWeight(Number(e.target.value))}
                aria-label="CA weighting"
              >
                <option value={30}>30%</option>
                <option value={40}>40%</option>
                <option value={20}>20%</option>
                <option value={50}>50%</option>
              </select>
              <span>of each course · exam is {examWeight}%</span>
            </div>
          )}
        </div>

        {/* Semester exam plan */}
        {examPending.length > 0 && (
          <details className="ncg-panel ncg-acc" open>
            <summary className="ncg-acc-sum">
              <span>This semester&rsquo;s exam plan</span>
              <small>{semTargetGpa ? `target ${Number(semTargetGpa).toFixed(2)}` : "set a target"}</small>
            </summary>
            <div className="ncg-field">
              <label>Target GPA for this semester</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={sys.max}
                placeholder={`e.g. ${(sys.max - 0.5).toFixed(2)}`}
                value={semTargetGpa}
                onChange={(e) => setSemTargetGpa(e.target.value)}
              />
            </div>
            <div className="ncg-quickchips">
              {sys.classes
                .filter((c) => c.short !== "Fail")
                .map((c) => (
                  <button key={c.short} onClick={() => setSemTargetGpa(String(c.min))}>
                    {c.short} ({c.min.toFixed(2)})
                  </button>
                ))}
            </div>
            {semPlan && (
              <div className="ncg-pred" style={{ marginTop: 12 }}>
                {semPlan.verdict === "secured" && (
                  <>
                    <span className="ncg-pill sec">On track</span> Your graded courses already
                    carry you — protect it in the exams.
                  </>
                )}
                {semPlan.verdict === "possible" && (
                  <>
                    <span className="ncg-pill ok">Reachable</span> Average about{" "}
                    <b>{semPlan.suggest.g}</b> ({semPlan.reqAvg.toFixed(2)} pts) across your{" "}
                    {semPlan.epUnits} exam-pending units to hit {Number(semTargetGpa).toFixed(2)}.
                    Each course below shows the exact exam mark.
                  </>
                )}
                {semPlan.verdict === "impossible" && (
                  <>
                    <span className="ncg-pill no">Out of reach</span> Even top marks in the exams
                    won&rsquo;t reach {Number(semTargetGpa).toFixed(2)} this semester. Aim a little
                    lower — you can still finish strong.
                  </>
                )}
              </div>
            )}
            {!semPlan && (
              <p className="ncg-hint" style={{ margin: "10px 0 0" }}>
                Enter a target and your CA scores above to see what each exam needs.
              </p>
            )}
          </details>
        )}
        <details className="ncg-panel ncg-acc">
          <summary className="ncg-acc-sum">
            <span>Previous semesters</span>
            <small>{priorSemesters.length ? `${priorSemesters.length} added` : "optional"}</small>
          </summary>
          {priorSemesters.length === 0 && (
            <p className="ncg-hint">
              Add your past semesters one by one to get your cumulative CGPA. Skip this if you only
              want this semester&rsquo;s GPA.
            </p>
          )}
          {priorSemesters.map((s) => (
            <div className="ncg-prow" key={s.id}>
              <input
                placeholder="Label (e.g. 100L 1st)"
                value={s.label}
                onChange={(e) => updatePriorSemester(s.id, { label: e.target.value })}
                aria-label="Semester label"
              />
              <input
                className="ncg-units"
                type="number"
                step="0.01"
                min="0"
                max={sys.max}
                placeholder="GPA"
                value={s.gpa}
                onChange={(e) => updatePriorSemester(s.id, { gpa: e.target.value })}
                aria-label="Semester GPA"
              />
              <input
                className="ncg-units"
                type="number"
                min="0"
                placeholder="Units"
                value={s.units}
                onChange={(e) => updatePriorSemester(s.id, { units: e.target.value })}
                aria-label="Semester units"
              />
              <button
                className="ncg-del"
                onClick={() => removePriorSemester(s.id)}
                aria-label="Remove semester"
              >
                &times;
              </button>
            </div>
          ))}
          <button className="ncg-add" onClick={addPriorSemester}>+ Add previous semester</button>
        </details>

        {/* Result card */}
        <div className="ncg-result">
          <div className="ncg-eyebrow">RESULT CARD</div>
          <div className="ncg-name">{name || (hasPrior ? "Cumulative CGPA" : "Semester GPA")}</div>
          <div className="ncg-big">{cgpaText}</div>
          {hasResult ? (
            <>
              <div className="ncg-scale-note">on {sys.max}.00 scale</div>
              <div className="ncg-class">{cls.short}</div>
              <div className="ncg-units-note">{shownUnits} credit units counted</div>
              {predictor && predictor.verdict !== "impossible" && (
                <div className="ncg-goal">Chasing {predictor.target.short} 🎯</div>
              )}
            </>
          ) : (
            <div className="ncg-class" style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>
              Nothing to grade yet
            </div>
          )}
          <input
            className="ncg-name-input"
            placeholder="Add your name for the card (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="ncg-actions">
            <button className="ncg-btn ncg-btn-wa" onClick={shareWhatsApp}>Share to WhatsApp</button>
            <button className="ncg-btn ncg-btn-img" onClick={saveImage}>Save card</button>
          </div>
          {onSave && (
            <button
              className="ncg-btn ncg-btn-save"
              disabled={saving}
              onClick={() =>
                onSave({
                  title: name || "My result",
                  level,
                  scale,
                  cgpa: isFinite(shownCgpa) ? Number(shownCgpa.toFixed(2)) : null,
                  className: cls.short,
                  unitsCounted: shownUnits,
                  payload: {
                    level,
                    scale,
                    inputMode,
                    name,
                    courses,
                    priorSemesters,
                    expungeFailedCarryovers,
                    caWeight,
                    semTargetGpa,
                    remainingCourses,
                  },
                })
              }
            >
              {saving ? "Saving…" : "Save my result to my account"}
            </button>
          )}
        </div>

        {/* Predictor */}
        <details className="ncg-panel ncg-acc">
          <summary className="ncg-acc-sum">
            <span>Graduation target</span>
            <small>
              {unitsRemaining || sem.pendingUnits ? `aiming ${targetShort}` : "plan ahead"}
            </small>
          </summary>
          <div className="ncg-two">
            <div className="ncg-field">
              <label>Target class</label>
              <select value={targetShort} onChange={(e) => setTargetShort(e.target.value)}>
                {sys.classes
                  .filter((c) => c.short !== "Fail")
                  .map((c) => (
                    <option key={c.short} value={c.short}>
                      {c.short} ({c.min.toFixed(2)}+)
                    </option>
                  ))}
              </select>
            </div>
            <div className="ncg-field">
              <label>Units left to graduate</label>
              <input
                type="number"
                placeholder={sem.pendingUnits ? `${sem.pendingUnits} (from pending)` : "e.g. 60"}
                value={unitsRemaining}
                onChange={(e) => setUnitsRemaining(e.target.value)}
              />
            </div>
          </div>
          {sem.pendingUnits > 0 && !unitsRemaining && (
            <p className="ncg-hint" style={{ margin: "10px 0 0" }}>
              Using your {sem.pendingUnits} not-taken-yet units. Type a number above to override.
            </p>
          )}
          {predictor && (
            <div className="ncg-pred">
              {predictor.verdict === "secured" && (
                <>
                  <span className="ncg-pill sec">Already secured</span>{" "}
                  Even a low run keeps you at {predictor.target.short}. Don&rsquo;t relax though.
                </>
              )}
              {predictor.verdict === "possible" && (
                <>
                  <span className="ncg-pill ok">Reachable</span>{" "}
                  You need to average <b>{predictor.requiredGpa.toFixed(2)}</b> across your remaining{" "}
                  {predictor.usedUnits} units to hit {predictor.target.short}.
                </>
              )}
              {predictor.verdict === "impossible" && (
                <>
                  <span className="ncg-pill no">Out of reach</span>{" "}
                  {predictor.target.short} needs an average above {sys.max.toFixed(2)} from here — not
                  possible with {predictor.usedUnits} units left. Try a lower target.
                </>
              )}
            </div>
          )}
          {!predictor && (
            <div className="ncg-pred" style={{ color: "var(--muted)" }}>
              Enter your units left to graduate, or mark courses &ldquo;Not taken yet,&rdquo; to see the
              GPA you need.
            </div>
          )}

          {predictor && (
            <div className="ncg-breakdown">
              <div className="ncg-bd-head">
                <span>Try your expected scores (optional)</span>
                {remainingCourses.length === 0 && (
                  <button className="ncg-bd-add" onClick={addRemaining}>+ Add course</button>
                )}
              </div>

              {remainingCourses.length === 0 ? (
                <p className="ncg-hint" style={{ margin: "8px 0 0" }}>
                  List your remaining courses and the score you think you can get in each. I&rsquo;ll
                  show the grade and your projected final CGPA — and whether it hits{" "}
                  {predictor.target.short}.
                </p>
              ) : (
                <>
                  {projection.rows.map((c) => (
                    <div className="ncg-rc" key={c.id}>
                      <div className="ncg-rc-top">
                        <input
                          placeholder="Course (e.g. CSC 401)"
                          value={c.code}
                          onChange={(e) => updateRemaining(c.id, { code: e.target.value })}
                        />
                        <input
                          className="ncg-units"
                          type="number"
                          min="0"
                          placeholder="Units"
                          value={c.units}
                          onChange={(e) => updateRemaining(c.id, { units: e.target.value })}
                          aria-label="Units"
                        />
                        <button
                          className="ncg-del"
                          onClick={() => removeRemaining(c.id)}
                          aria-label="Remove"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="ncg-rc-bot">
                        <input
                          className="ncg-score"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Expected"
                          value={c.score}
                          onChange={(e) => updateRemaining(c.id, { score: e.target.value })}
                          aria-label="Expected score"
                        />
                        <span className="ncg-derived">
                          {c.has ? `${c.grade} · ${c.points}pt` : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button className="ncg-add" onClick={addRemaining}>+ Add course</button>

                  {projection && projection.remUnits > 0 && (
                    <div className="ncg-plan">
                      <div className="ncg-plan-note">
                        Projected final CGPA with these scores
                      </div>
                      <div className="ncg-proj-cgpa">
                        {isFinite(projection.projCgpa) ? projection.projCgpa.toFixed(2) : "—"}
                      </div>
                      <div className="ncg-proj-class">{projection.projClass.short}</div>
                      <div className="ncg-proj-verdict">
                        {projection.meets ? (
                          <span className="ncg-pill ok">
                            Hits {projection.target.short} 🎯
                          </span>
                        ) : (
                          <span className="ncg-pill no">
                            Short of {projection.target.short} by {projection.gap.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {!projection.allScored && (
                        <p className="ncg-proj-hint">
                          Courses without a score count as 0 for now — fill them all for your true
                          projection.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </details>

        <div className="ncg-foot">
          Boundaries vary by school — masters classification especially. This uses a common{" "}
          {LEVELS[level].label} {sys.label} mapping.
          <br />Built for Nigerian students · {DOMAIN}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

// Per-course CA panel: enter CA earned so far, pick a target grade for the
// course, and see the exam mark needed (and what CA alone already locks in).
function CaPlan({ c, sys, caWeight, examWeight, gradeFromScore, examNeed, onCa, onTarget }) {
  const caNum = Number(c.ca) || 0;
  const locked = c.ca === "" ? null : gradeFromScore(caNum, sys); // grade if exam = 0
  const targetObj = sys.grades.find((g) => g.g === c.examTarget) || sys.grades[0];
  const need = c.ca === "" ? null : examNeed(caNum, targetObj);

  return (
    <div className="ncg-ca">
      <div className="ncg-ca-row">
        <label className="ncg-ca-label">
          CA
          <input
            className="ncg-ca-input"
            type="number"
            min="0"
            max={caWeight}
            placeholder={`/${caWeight}`}
            value={c.ca}
            onChange={(e) => onCa(e.target.value)}
            aria-label={`CA score out of ${caWeight}`}
          />
        </label>
        <label className="ncg-ca-label">
          Aim
          <select
            className="ncg-ca-target"
            value={c.examTarget}
            onChange={(e) => onTarget(e.target.value)}
            aria-label="Target grade for this course"
          >
            {sys.grades
              .filter((g) => g.g !== "F")
              .map((g) => (
                <option key={g.g} value={g.g}>
                  {g.g}
                </option>
              ))}
          </select>
        </label>
      </div>
      {need && (
        <div className="ncg-ca-out">
          {need.verdict === "secured" ? (
            <span className="ncg-ca-ok">✓ {c.examTarget} already locked from CA</span>
          ) : need.verdict === "impossible" ? (
            <span className="ncg-ca-no">
              {c.examTarget} needs {Math.ceil(need.mark)}/{examWeight} — not possible
            </span>
          ) : (
            <span className="ncg-ca-need">
              Need <b>{Math.ceil(need.mark)}</b>/{examWeight} in the exam for {c.examTarget}
            </span>
          )}
          {locked && locked !== "F" && need.verdict !== "secured" && (
            <span className="ncg-ca-floor">CA floor: {locked}</span>
          )}
        </div>
      )}
      {c.ca === "" && <span className="ncg-await">Enter CA to see the exam target</span>}
    </div>
  );
}

