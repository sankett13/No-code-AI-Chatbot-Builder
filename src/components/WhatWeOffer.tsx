"use client";

import { motion } from "framer-motion";

export default function WhatWeOffer() {
  const features = [
    {
      title: "No Coding Required",
      description:
        "Build intelligent chatbots without writing a single line of code. Our intuitive platform makes it easy for everyone.",
    },
    {
      title: "Train with Your Data",
      description:
        "Simply provide information about your business, products, or services. Your chatbot learns and responds accordingly.",
    },
    {
      title: "Easy Integration",
      description:
        "Embed your chatbot on any website with a simple script tag. It works seamlessly across all platforms.",
    },
    {
      title: "Instant Responses",
      description:
        "Provide 24/7 customer support with AI-powered responses that understand context and intent.",
    },
    {
      title: "Customizable Design",
      description:
        "Match your brand with customizable colors, styles, and chat widget designs.",
    },
    {
      title: "Analytics & Insights",
      description:
        "Track conversations, understand user queries, and improve your chatbot over time.",
    },
  ];

  return (
    <section className="px-6 py-20 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-mono uppercase tracking-wider text-gray-500 mb-4 block">
            Features
          </span>
          <h2 className="text-5xl md:text-6xl font-black mb-4">
            What We <span className="italic">Offer</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to create, customize, and deploy intelligent
            chatbots for your business
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="p-8 bg-gray-50 border-2 border-gray-200 rounded-2xl hover:border-[#141414] hover:shadow-2xl transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
