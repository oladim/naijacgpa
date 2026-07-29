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
      <body style={{ margin: 0, background: "#F4F6F3" }}>
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
