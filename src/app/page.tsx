import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-4">AI Chatbot Builder</h1>
        <p className="text-gray-700 mb-6">
          Create and embed AI chatbots for your website — no code required.
        </p>

        <div className="flex gap-3 justify-center">
          <a
            href="/register"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Get started
          </a>
          <a href="/login" className="px-4 py-2 border rounded">
            Sign in
          </a>
          <a href="/dashboard" className="px-4 py-2 border rounded">
            Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
