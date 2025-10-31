"use client";

import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: "70px 70px",
      }}
    >
      <div className="bg-white p-6 rounded">
        <motion.div
          className="relative z-10 max-w-5xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="inline-block px-4 py-2 bg-[#141414] text-white text-sm font-mono rounded-full mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            ✨ No Code Required
          </motion.div>

          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-black mb-4 leading-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Build Your Own <span className="text-[#141414]">AI Chatbot</span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-800 mb-4 font-light"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Powered by <span className="font-bold">AI</span>. Built for{" "}
            <span className="font-bold">Everyone</span>.
          </motion.p>

          <motion.p
            className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Create intelligent chatbots by simply providing your business
            context. No coding, no complexity—just results.
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center flex-wrap"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <a
              href="/register"
              className="px-8 py-4 bg-[#141414] text-white rounded-lg border-2 border-transparent hover:bg-white hover:text-[#141414] hover:border-[#141414] transition-colors duration-300 ease-in-out text-lg font-semibold"
            >
              Start Building Free →
            </a>
            <a
              href="#HowItWorks"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                const el =
                  document.getElementById("HowItWorks") ||
                  document.getElementById("how-it-works");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  // fallback to setting the hash so the browser can try to navigate
                  window.location.hash = "#HowItWorks";
                }
              }}
              className="px-8 py-4 border-2 border-[#141414] rounded-lg hover:bg-[#141414] hover:text-white transition text-lg font-semibold"
            >
              See How It Works
            </a>
          </motion.div>

          <motion.div
            className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✓</span>
              <span>Free to Start</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✓</span>
              <span>5 Min Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✓</span>
              <span>No Credit Card</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
