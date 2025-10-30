"use client";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="px-6 py-24 bg-[#141414] text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          className="inline-block px-4 py-2 bg-white text-[#141414] text-sm font-mono rounded-full mb-6"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          🚀 Launch Your Chatbot Today
        </motion.div>

        <motion.h2
          className="text-5xl md:text-6xl font-black mb-6"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Ready to <span className="italic">Transform</span> Your Customer
          Experience?
        </motion.h2>

        <motion.p
          className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Start using an AI chatbot to enhance customer engagement and improve response times.
        </motion.p>

        <motion.div
          className="flex gap-4 justify-center flex-wrap mb-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <a
            href="/register"
            className="px-8 py-4 bg-white text-[#141414] rounded-lg hover:bg-gray-200 transition font-bold text-lg shadow-xl"
          >
            Start Free Trial →
          </a>
          <a
            href="/dashboard"
            className="px-8 py-4 border-2 border-white rounded-lg hover:bg-white hover:text-[#141414] transition font-bold text-lg"
          >
            View Demo
          </a>
        </motion.div>

        <motion.p
          className="text-sm text-white font-mono"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          No credit card required • Free 14-day trial • Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
