"use client";

import { motion } from "framer-motion";

export default function WhyChooseUs() {
  const benefits = [
    {
      title: "Built for Everyone",
      description:
        "Whether you're a small business owner, professional, or developer, our platform is designed to meet your needs. No technical expertise required.",
      highlight: "User-Friendly",
    },
    {
      title: "Cost-Effective Solution",
      description:
        "Save thousands on customer support costs. Our affordable pricing makes AI chatbots accessible to businesses of all sizes.",
      highlight: "Affordable",
    },
    {
      title: "Quick Setup",
      description:
        "Get your chatbot up and running in minutes, not days. Start engaging with customers immediately.",
      highlight: "Fast Deployment",
    },
    {
      title: "Reliable & Secure",
      description:
        "Built with enterprise-grade security and reliability. Your data and customer conversations are always protected.",
      highlight: "Trustworthy",
    },
  ];

  return (
    <section className="px-6 py-16 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Why Choose Us
        </motion.h2>
        <motion.p
          className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          We're committed to making AI chatbots accessible, affordable, and
          effective for everyone
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="p-6 border-l-4 border-[#141414]"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="inline-block px-3 py-1 bg-[#141414] text-white text-sm rounded mb-3">
                {benefit.highlight}
              </div>
              <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-gray-700">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
