"use client";

export default function Footer() {
  return (
    <footer className="bg-gray-100 py-8 border-t">
      <div className="max-w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Project Name and Description */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            AI Chatbot Builder
          </h2>
        <p className="text-sm text-gray-600 mt-2">
            Build intelligent chatbots.<br />
            Effortlessly with our no-code platform.<br />
            Perfect for businesses of all sizes.
        </p>
        </div>

        {/* Right Side: Links to Pages */}
        <nav className="flex flex-col md:items-end gap-2">
          <a href="/privacy" className="text-gray-600 hover:underline">
            Privacy Policy
          </a>
          <a href="/terms" className="text-gray-600 hover:underline">
            Terms of Service
          </a>
          <a href="/contact" className="text-gray-600 hover:underline">
            Contact Us
          </a>
        </nav>
      </div>

      {/* Bottom: Copyright */}
      <div className="text-center text-sm text-gray-600 mt-8 border-t pt-4">
        © 2025 AI Chatbot Builder. All rights reserved.
      </div>
    </footer>
  );
}
