import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="sf">
      <style>{`
        .sf{max-width:960px;margin:0 auto;padding:28px 20px;display:flex;align-items:center;
          justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid #e4e9e4;
          font-family:Poppins, system-ui, sans-serif;color:#6b7a72;font-size:13px;}
        .sf nav{display:flex;gap:14px;flex-wrap:wrap;}
        .sf a{color:#6b7a72;text-decoration:none;font-weight:600;}
        .sf a:hover{color:#0F8A5F;}
      `}</style>
      <div>© {new Date().getFullYear()} NaijaCGPA · Built for Nigerian students</div>
      <nav>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}
