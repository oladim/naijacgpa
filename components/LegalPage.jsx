import Link from "next/link";

// Presentational wrapper shared by the Privacy and Terms pages.
export default function LegalPage({ title, updated, children }) {
  return (
    <main className="legal">
      <style>{`
        .legal{max-width:720px;margin:0 auto;padding:24px 20px 60px;
          font-family:Inter,system-ui,sans-serif;color:#1c2b24;line-height:1.65;}
        .legal .back{font-size:13px;color:#0F8A5F;text-decoration:none;font-weight:600;}
        .legal h1{font-size:30px;margin:18px 0 4px;color:#0B1F18;letter-spacing:-0.5px;}
        .legal .updated{font-size:13px;color:#6b7a72;margin:0 0 28px;}
        .legal h2{font-size:18px;margin:28px 0 8px;color:#0B1F18;}
        .legal p{margin:0 0 12px;}
        .legal ul{margin:0 0 12px;padding-left:20px;}
        .legal li{margin:4px 0;}
        .legal a{color:#0F8A5F;}
        .legal .foot{margin-top:40px;padding-top:16px;border-top:1px solid #e2e7e2;
          font-size:13px;color:#6b7a72;}
        .legal .foot a{color:#0F8A5F;text-decoration:none;font-weight:600;}
      `}</style>
      <Link href="/" className="back">← Back to app</Link>
      <h1>{title}</h1>
      <p className="updated">Last updated: {updated}</p>
      {children}
      <div className="foot">
        <Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms of Service</Link>{" "}
        · <Link href="/">Home</Link>
      </div>
    </main>
  );
}
