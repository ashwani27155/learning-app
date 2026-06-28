export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: June 1, 2026</p>
      {[
        { title: "1. Acceptance", body: "By using MPSC Sadhak, you agree to these terms. If you do not agree, please do not use the platform." },
        { title: "2. Account", body: "You are responsible for maintaining the confidentiality of your account credentials. You must be at least 16 years old to create an account." },
        { title: "3. Subscriptions & Payments", body: "Subscriptions are billed in advance. Refunds are available within 7 days of purchase if you have not accessed more than 20% of the premium content." },
        { title: "4. Prohibited Use", body: "You may not share your account, copy or distribute our question bank, or use automated tools to access or scrape the platform." },
        { title: "5. Intellectual Property", body: "All content on MPSC Sadhak — including questions, explanations, and study materials — is the property of MPSC Sadhak or its content partners and is protected by copyright." },
        { title: "6. Limitation of Liability", body: "MPSC Sadhak is not liable for exam results or any indirect damages arising from use of the platform. Our maximum liability is limited to the amount you paid in the last 3 months." },
        { title: "7. Contact", body: "For any questions about these terms, contact legal@mpsc-sadhak.com." },
      ].map(s => (
        <div key={s.title} className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h2>
          <p className="text-gray-600 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  );
}
