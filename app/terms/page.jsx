import LegalPage from "@/components/LegalPage";

// NOTE: Starter template — not legal advice. Replace the placeholders below
// (contact email, effective date, governing law if not Nigeria) and have it
// reviewed before relying on it.
const CONTACT = "nexitafrica@gmail.com"; // <-- change this

export const metadata = {
  title: "Terms of Service — NaijaCGPA",
  description: "The terms for using NaijaCGPA.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="29 July 2026">
      <p>
        These terms govern your use of NaijaCGPA (&ldquo;the Service&rdquo;). By using the Service you
        agree to them. If you do not agree, please do not use the Service.
      </p>

      <h2>What NaijaCGPA is</h2>
      <p>
        NaijaCGPA is a study tool that helps you estimate and plan your CGPA. It is provided to assist
        your own planning and is not affiliated with, or endorsed by, any university.
      </p>

      <h2>Estimates only — not an official record</h2>
      <p>
        All grades, CGPA figures, class predictions, and required-score suggestions are estimates
        based on the information you enter and common grading scales. Grade boundaries and
        classification rules vary by institution and can change. NaijaCGPA is not an official academic
        record. Always confirm your actual results and classification with your school. You are
        responsible for decisions you make based on the Service.
      </p>

      <h2>Your account</h2>
      <p>
        You sign in with Google and are responsible for activity under your account. Keep your access
        secure and let us know of any unauthorised use.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not misuse the Service, attempt to disrupt it, or access data that is not yours.</li>
        <li>Do not use the Service for any unlawful purpose.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        The academic data you enter remains yours. You grant us permission to store and process it
        only as needed to provide the Service to you, as described in our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>Availability</h2>
      <p>
        We aim to keep the Service running but may change, suspend, or discontinue features at any
        time, and the Service may occasionally be unavailable.
      </p>

      <h2>No warranty</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not warrant
        that calculations are error-free or that the Service will be uninterrupted.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, NaijaCGPA and its operators are not liable for any
        indirect or consequential loss, or for any academic outcome, arising from your use of the
        Service.
      </p>

      <h2>Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time. We may suspend or end
        access if these terms are breached.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms. We will update the date above and, for significant changes, notify
        you in the app or by email. Continued use means you accept the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email us at <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </LegalPage>
  );
}
