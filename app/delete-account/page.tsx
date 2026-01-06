export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Delete Your ScoutHub Account</h1>
          <p className="text-white/60 mb-8">Request deletion of your account and associated data</p>

          <div className="space-y-8 text-white/80">
            <section className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Important Notice
              </h2>
              <p>
                Deleting your account is <strong>permanent and cannot be undone</strong>. All your data will be
                permanently removed from our systems.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">How to Delete Your Account</h2>
              <p className="mb-4">Follow these steps to request account deletion:</p>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <h3 className="font-semibold text-white">Send an email request</h3>
                    <p className="text-white/70">
                      Email us at <a href="mailto:support@scouthub.app?subject=Account%20Deletion%20Request" className="text-blue-400 hover:text-blue-300">support@scouthub.app</a> with
                      the subject line &quot;Account Deletion Request&quot;
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>
                    <h3 className="font-semibold text-white">Include your account email</h3>
                    <p className="text-white/70">
                      In your email, include the email address associated with your ScoutHub account so we can locate it
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>
                    <h3 className="font-semibold text-white">Receive confirmation</h3>
                    <p className="text-white/70">
                      We will verify your identity and confirm the deletion request within 48 hours
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
                  <div>
                    <h3 className="font-semibold text-white">Account deleted</h3>
                    <p className="text-white/70">
                      Your account and all associated data will be permanently deleted within 30 days
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Data That Will Be Deleted</h2>
              <p className="mb-4">When your account is deleted, the following data will be <strong className="text-red-400">permanently removed</strong>:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your account profile (email, name, password)</li>
                <li>All player profiles you have created</li>
                <li>Player statistics, notes, and contract information</li>
                <li>Uploaded player photos and documents</li>
                <li>Calendar events and trial records</li>
                <li>Request/lead information</li>
                <li>Team membership data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Data Retention</h2>
              <p className="mb-4">Please note the following retention policies:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Deletion timeline:</strong> All data will be deleted within 30 days of confirmed request</li>
                <li><strong>Backup systems:</strong> Data may persist in encrypted backups for up to 90 days before automatic purging</li>
                <li><strong>Legal requirements:</strong> Some data may be retained if required by law (e.g., transaction records for tax purposes)</li>
                <li><strong>Anonymized data:</strong> Aggregated, anonymized analytics data may be retained as it cannot identify you</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Agency Owners</h2>
              <p>
                If you are the owner of an agency with team members, deleting your account will also delete the
                entire agency and remove access for all team members. Please ensure you transfer ownership or
                notify your team before requesting deletion.
              </p>
            </section>

            <section className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-blue-400 mb-4">Request Account Deletion</h2>
              <p className="mb-4">Ready to delete your account? Send us an email:</p>
              <a
                href="mailto:support@scouthub.app?subject=Account%20Deletion%20Request&body=I%20would%20like%20to%20request%20the%20deletion%20of%20my%20ScoutHub%20account.%0A%0AMy%20account%20email%3A%20%5BEnter%20your%20email%20here%5D%0A%0AI%20understand%20that%20this%20action%20is%20permanent%20and%20all%20my%20data%20will%20be%20deleted."
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Deletion Request
              </a>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Questions?</h2>
              <p>
                If you have any questions about the account deletion process, please contact us at{' '}
                <a href="mailto:support@scouthub.app" className="text-blue-400 hover:text-blue-300">
                  support@scouthub.app
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20 flex flex-wrap gap-4">
            <a
              href="/"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              &larr; Back to ScoutHub
            </a>
            <a
              href="/privacy"
              className="inline-flex items-center text-white/60 hover:text-white/80 transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
