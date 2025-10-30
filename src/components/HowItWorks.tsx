"use client";

import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Sign Up",
      description:
        "Create your account in seconds. No credit card required to get started.",
    },
    {
      step: "2",
      title: "Provide Context",
      description:
        "Upload documents, add text, or link to your website. Tell your chatbot about your business.",
    },
    {
      step: "3",
      title: "Customize",
      description:
        "Personalize your chatbot's appearance, tone, and behavior to match your brand.",
    },
    {
      step: "4",
      title: "Deploy",
      description:
        "Copy the embed code and add it to your website. Your chatbot is now live!",
    },
  ];

  return (
    <section id="HowItWorks" className="px-6 py-20 bg-gray-50 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-mono uppercase tracking-wider text-gray-500 mb-4 block">
            Process
          </span>
          <h2 className="text-5xl md:text-6xl font-black mb-4">
            How It <span className="italic">Works</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started in four simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection line for desktop */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-1 bg-gray-200 -z-0"></div>

          {steps.map((item, index) => (
            <motion.div
              key={index}
              className="text-center relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="w-20 h-20 bg-[#141414] text-white rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-lg border-4 border-white">
                {item.step}
              </div>
              <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
