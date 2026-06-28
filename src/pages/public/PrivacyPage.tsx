export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 prose prose-gray">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: June 1, 2026</p>
      {[
        { title: "Information We Collect", body: "We collect your name, email, phone number, and exam preferences when you register. We also collect usage data such as tests taken, scores, and time spent on the platform to improve your experience." },
        { title: "How We Use Your Data", body: "Your data is used to personalise your learning experience, send you relevant notifications, process payments, and improve our platform. We never sell your personal data to third parties." },
        { title: "Data Security", body: "All data is encrypted in transit (HTTPS/TLS) and at rest. Passwords are hashed using bcrypt with a minimum of 12 rounds. We perform regular security audits." },
        { title: "Cookies", body: "We use session cookies for authentication and local storage for test progress. We do not use third-party tracking cookies." },
        { title: "Your Rights", body: "You can request a copy of your data, correct inaccuracies, or delete your account at any time by contacting support@mpsc-sadhak.com." },
        { title: "Contact", body: "For any privacy concerns, email us at privacy@mpsc-sadhak.com." },
      ].map(s => (
        <div key={s.title} className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h2>
          <p className="text-gray-600 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  );
}
