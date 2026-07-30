import Script from "next/script";

const GA_ID = "G-FP2SDKWEF2";

export const metadata = {
  title: "NaijaCGPA — Know your class. Chase your goal.",
  description:
    "Calculate your CGPA on your school's grading system and share a result card. Built for Nigerian students.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#F4F6F3", fontFamily: "'Poppins', system-ui, sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
          body, button, input, select, textarea { font-family: 'Poppins', system-ui, sans-serif; }
        `}</style>
        {children}

        {/* Google Analytics (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
