export const metadata = { title: "Privacy Policy – Presciya" };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black text-on-surface">Privacy Policy</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-on-surface-variant">
        <section>
          <h2 className="mb-2 text-lg font-bold text-on-surface">
            1. Information We Collect
          </h2>
          <p>
            Presciya stores the information you provide to operate your
            practice: account details, workspace and chamber information,
            patient records, prescriptions and appointment/finance records you
            create. Patient data is stored per workspace and is only accessible
            to members of that workspace.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-on-surface">
            2. How We Use Information
          </h2>
          <p>
            We use your information solely to provide the service — generating
            prescriptions, managing appointments and finances, and enabling
            verification. We do not sell personal data.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-on-surface">
            3. Data Security
          </h2>
          <p>
            Access is protected by authentication and workspace-scoped
            authorization. Sensitive credentials such as passwords and tokens
            are never exposed in logs or API responses.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-on-surface">
            4. Your Rights
          </h2>
          <p>
            You may access, correct or delete the data you have created through
            the application. For any privacy request, contact
            support@presciya.com.
          </p>
        </section>
      </div>
    </div>
  );
}
