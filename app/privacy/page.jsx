import LegalPage from "@/components/LegalPage";

// NOTE: Starter template — not legal advice. Replace the placeholders below
// (contact email, effective date) and have it reviewed, including for Nigeria's
// NDPR, before relying on it.
const CONTACT = "nexitafrica@gmail.com"; // <-- change this

export const metadata = {
  title: "Privacy Policy — NaijaCGPA",
  description: "How NaijaCGPA collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="29 July 2026">
      <p>
        NaijaCGPA (&ldquo;we&rdquo;, &ldquo;us&rdquo;) helps students calculate and track their CGPA.
        This policy explains what we collect, why, and the choices you have. By using NaijaCGPA you
        agree to this policy.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information.</strong> When you sign in with Google, we receive your name
          and email address so we can create and secure your account.
        </li>
        <li>
          <strong>Academic data you enter.</strong> The courses, units, grades, scores, and targets
          you type in, and the results you choose to save.
        </li>
        <li>
          <strong>Basic technical data.</strong> Standard information your browser sends (such as
          device and general usage) needed to run the service securely.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To provide the calculator and save and sync the results you choose to keep.</li>
        <li>To send optional reminder and motivational emails, which you can opt out of at any time.</li>
        <li>To keep the service secure and to improve how it works.</li>
      </ul>
      <p>We do not sell your personal information, and we do not show ads.</p>

      <h2>Data stored on your device</h2>
      <p>
        To let you use the calculator offline and avoid losing your work, we save a draft of your
        entries in your browser&rsquo;s local storage. This stays on your device and you can clear it
        by clearing your browser data.
      </p>

      <h2>Service providers</h2>
      <p>We share information only with providers that help us run NaijaCGPA:</p>
      <ul>
        <li><strong>Google</strong> — sign-in.</li>
        <li><strong>Supabase</strong> — secure database and authentication.</li>
        <li><strong>Resend</strong> — sending emails.</li>
        <li><strong>Our hosting provider</strong> — serving the website.</li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li>Opt out of emails using the unsubscribe option or by contacting us.</li>
        <li>Delete any saved result from within the app at any time.</li>
        <li>Request deletion of your account and associated data by emailing us.</li>
      </ul>

      <h2>Data retention</h2>
      <p>
        We keep your saved results until you delete them or ask us to delete your account. Draft data
        on your device remains until you clear it.
      </p>

      <h2>Security</h2>
      <p>
        We use reasonable measures to protect your information, including access controls that limit
        each account to its own data. No method of storage or transmission is completely secure.
      </p>

      <h2>Students and age</h2>
      <p>
        NaijaCGPA is intended for university and post-secondary students. If you believe a child has
        provided us personal information without appropriate consent, contact us and we will remove it.
      </p>

      <h2>Nigeria data protection</h2>
      <p>
        Where the Nigeria Data Protection Act/Regulation applies, you have rights to access, correct,
        and delete your personal data. Contact us to exercise these rights.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. We will update the date above and, for
        significant changes, notify you in the app or by email.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email us at <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </LegalPage>
  );
}
