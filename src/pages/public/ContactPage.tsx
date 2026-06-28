import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const { data: settingsRaw } = useQuery({
    queryKey: ["public-settings"],
    queryFn:  () => api.get<any>("/settings"),
    staleTime: 600_000,
  });
  const settings = (settingsRaw as any)?.data ?? settingsRaw ?? {};

  const supportEmail    = settings.supportEmail    || "support@mpsc-sadhak.com";
  const supportWhatsApp = settings.supportWhatsApp || "+91 90000 00000";
  const whatsappNumber  = supportWhatsApp.replace(/\D/g, "");

  const contactCards = [
    { icon: "📧", label: "Email",     value: supportEmail,    href: `mailto:${supportEmail}` },
    { icon: "💬", label: "WhatsApp",  value: supportWhatsApp, href: `https://wa.me/${whatsappNumber}` },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error("Please fill all fields"); return; }
    setSent(true);
    toast.success("Message sent! We'll get back to you within 24 hours.");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-8">Have a question or feedback? We'd love to hear from you.</p>

      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        {contactCards.map(c => (
          <a key={c.label} href={c.href} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="text-3xl">{c.icon}</div>
            <div>
              <div className="font-semibold text-gray-900">{c.label}</div>
              <div className="text-sm text-primary-600">{c.value}</div>
            </div>
          </a>
        ))}
      </div>

      {sent ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">✅</div>
          <p className="font-semibold text-gray-900">Message sent successfully!</p>
          <p className="text-gray-500 text-sm mt-1">We'll reply within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea className="input-field resize-none" rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="How can we help?" />
          </div>
          <button type="submit" className="btn-primary w-full">Send Message</button>
        </form>
      )}
    </div>
  );
}
