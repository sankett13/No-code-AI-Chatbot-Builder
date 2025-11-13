"use client";

import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Create an Account",
      description:
        "Sign up in seconds — no credit card required to get started.",
    },
    {
      step: "2",
      title: "Add Your Context",
      description:
        "Upload your business documents (.txt) and provide key details so your chatbot understands your brand.",
    },
    {
      step: "3",
      title: "Customize Behavior",
      description:
        "Adjust the chatbot's tone, responses, and appearance to reflect your brand voice.",
    },
    {
      step: "4",
      title: "Deploy Live",
      description:
        "Copy the embed snippet and paste it into your website — your chatbot will be live instantly.",
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
          {/* Connection line for desktop with animation */}
          <motion.div
            className="hidden lg:block absolute top-12 left-0 right-0 h-1 bg-gray-200 -z-0"
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut" }}
          ></motion.div>

          {steps.map((item, index) => (
            <motion.div
              key={index}
              className="text-center relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.5 }}
            >
              <motion.div
                className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-lg border-4 border-white"
                initial={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                whileInView={{ backgroundColor: "#141414", color: "#FFFFFF" }}
                viewport={{ once: true }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  delay: index * 0.5,
                }}
              >
                {item.step}
              </motion.div>
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
