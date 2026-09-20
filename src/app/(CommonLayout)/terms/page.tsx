export const metadata = { title: "Terms of Service – Presciya" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black text-on-surface">Terms of Service</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-on-surface-variant">
        <section>
          <h2 className="mb-2 text-lg font-bold text-on-surface">
            1. Acceptance of Terms
          </h2>
          <p>
            By creating an account you agree to use Presciya in accordance with
            applicable healthcare regulations and these terms.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-on-surface">
            2. Professional Responsibility
          </h2>
          <p>
            You are responsible for the accuracy of the clinical information you
            record. Presciya is a documentation and workflow tool and does not
            provide medical advice.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-on-surface">
            3. Subscriptions
          </h2>
          <p>
            Some features require a paid subscription. Subscription limits and
            entitlements are shown within the application. Existing data is
            retained if a subscription expires; premium features become
            unavailable until renewed.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-on-surface">
            4. Acceptable Use
          </h2>
          <p>
            You must not attempt to access data belonging to other users or
            workspaces, or misuse the service.
          </p>
        </section>
      </div>
    </div>
  );
}
