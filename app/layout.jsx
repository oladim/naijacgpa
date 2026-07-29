export const metadata = {
  title: "NaijaCGPA — Know your class. Chase your goal.",
  description:
    "Calculate your CGPA on your school's grading system and share a result card. Built for Nigerian students.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#F4F6F3" }}>{children}</body>
    </html>
  );
}
