export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          <p className="text-white/60 mb-8">Last updated: January 2025</p>

          <div className="space-y-8 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
              <p>
                Welcome to ScoutHub. We respect your privacy and are committed to protecting your personal data.
                This privacy policy explains how we collect, use, and safeguard your information when you use our
                mobile application and web platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
              <p className="mb-4">We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
                <li><strong>Player Data:</strong> Information about football players you add to the platform (names, statistics, contract details, notes)</li>
                <li><strong>Usage Data:</strong> How you interact with our app, including features used and time spent</li>
                <li><strong>Device Information:</strong> Device type, operating system, and app version</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain our service</li>
                <li>Authenticate your account and ensure security</li>
                <li>Enable team collaboration features</li>
                <li>Send important notifications about your account</li>
                <li>Improve and develop new features</li>
                <li>Provide customer support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
              <p className="mb-4">
                Your data is stored securely using Supabase, a trusted cloud database provider. We implement
                industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>TLS encryption for all data in transit</li>
                <li>Encrypted data at rest</li>
                <li>Row-level security policies</li>
                <li>Multi-tenant architecture to keep agency data separate</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Data Sharing</h2>
              <p className="mb-4">
                We do not sell, trade, or rent your personal information to third parties. Your data may only be
                shared in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With team members you invite to your agency (within the app)</li>
                <li>With service providers necessary for app operation (Supabase for data storage)</li>
                <li>If required by law or legal process</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Export:</strong> Export your data in a portable format</li>
                <li><strong>Withdraw Consent:</strong> Opt out of optional data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active or as needed to provide services.
                If you delete your account, we will delete your personal data within 30 days, except where
                retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Children&apos;s Privacy</h2>
              <p>
                ScoutHub is not intended for users under the age of 18. We do not knowingly collect personal
                information from children. If you believe a child has provided us with personal data, please
                contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any significant
                changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us at:
              </p>
              <p className="text-blue-400">
                <a href="mailto:support@scouthub.app">support@scouthub.app</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <a
              href="/"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              &larr; Back to ScoutHub
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
