"use client";

import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export default function SiteHeader() {
  return (
    <header className="sh">
      <style>{`
        .sh{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;
          gap:12px;padding:10px 16px;background:rgba(244,246,243,0.9);backdrop-filter:blur(8px);
          border-bottom:1px solid #e4e9e4;font-family:Poppins, system-ui, sans-serif;}
        .sh-brand{display:flex;align-items:center;gap:9px;text-decoration:none;}
        .sh-brand img{display:block;}
        .sh-brand span{font-family:Poppins, system-ui, sans-serif;font-weight:800;font-size:20px;
          letter-spacing:-0.5px;color:#0B1F18;}
        .sh-brand b{color:#0F8A5F;font-weight:800;}
        .sh-nav{display:flex;align-items:center;gap:14px;}
        .sh-nav a{font-size:14px;font-weight:600;color:#334;text-decoration:none;}
        .sh-nav a:hover{color:#0F8A5F;}
        @media (max-width:480px){ .sh-link-hide{display:none;} }
      `}</style>
      <Link href="/" className="sh-brand">
        <img src="/logo-icon.svg" alt="" width="30" height="30" />
        <span>Naija<b>CGPA</b></span>
      </Link>
      <nav className="sh-nav">
        <Link href="/calculator">Calculator</Link>
        <AuthButton />
      </nav>
    </header>
  );
}
