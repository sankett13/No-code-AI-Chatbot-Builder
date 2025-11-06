"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in name, email and message.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setSuccess("Thanks — your message has been sent. We'll reply soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      console.error("contact submit error", err);
      setError(err?.message || "Failed to send message");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 5000);
    }
  }

  return (
    <div className="flex items-start justify-center bg-gray-50 py-6 px-6">
      <div className="max-w-7xl w-full mt-8 mb-12 bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left: hero/contact info (brand theme) */}
        <div className="p-8 bg-[#141414] text-white flex flex-col justify-center gap-6">
          <h1 className="text-5xl font-extrabold leading-tight">
            Get in touch
          </h1>
          <p className="text-gray-300 max-w-xl">
            Have a question or need help building your chatbot? Send us a
            message — we typically reply within one business day.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 text-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white text-[#141414] flex items-center justify-center font-semibold">
                G
              </div>
              <div>
                <div className="font-medium">GitHub</div>
                <div className="text-gray-300">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    github.com
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white text-[#141414] flex items-center justify-center font-semibold">
                E
              </div>
              <div>
                <div className="font-medium">Email</div>
                <div className="text-gray-300">shubhampatel0513@gmail.com</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white text-[#141414] flex items-center justify-center font-semibold">
                L
              </div>
              <div>
                <div className="font-medium">LinkedIn</div>
                <div className="text-gray-300">
                  <a
                    href="https://www.linkedin.com/in/shubham-patel-506a79270?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Shubha Patel
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-400">
            Prefer quick answers? Try our live bot in the bottom-right corner —
            it can handle common questions instantly.
          </div>
        </div>

        {/* Right: form */}
        <div className="p-8 lg:p-10">
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-700">Your name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    required
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#141414]"
                    placeholder="Jane Doe"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-gray-700">Email</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#141414]"
                    placeholder="jane@company.com"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-gray-700">Subject</span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  type="text"
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#141414]"
                  placeholder="How can we help?"
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-4 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#141414]"
                  placeholder="Tell us more about your question or issue"
                />
              </label>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#141414] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1f1f1f] disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send message"}
                </button>

                <div className="text-sm">
                  {success && <span className="text-green-600">{success}</span>}
                  {error && <span className="text-red-600">{error}</span>}
                </div>
              </div>
            </form>

            
          </div>
        </div>
      </div>
    </div>
  );
}
