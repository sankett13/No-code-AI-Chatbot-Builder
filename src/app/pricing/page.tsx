"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0/mo",
      buttonText: "Get Started",
      features: [
        "Unlimited chats",
        "100 AI credits",
        "1 seat",
        "Visual builder",
        "2 chatbots & AI agents",
        "500,000 knowledge base characters",
        "1 action per AI agent",
        "Limited chatbot customization",
        "8 AI models",
      ],
    },
    {
      name: "Starter",
      price: "$15/mo",
      buttonText: "Go Starter",
      features: [
        "Unlimited chats",
        "3,000 AI credits",
        "2 seats",
        "Visual builder",
        "5 chatbots & AI agents",
        "20 million knowledge base characters",
        "3 actions per AI agent",
        "Autosync KB sources",
        "Full chatbot customization",
        "31 AI models",
        "API access",
        "Chatbot analytics",
        "Voice input",
      ],
    },
    {
      name: "Ultimate",
      price: "$30/mo",
      buttonText: "Go Ultimate",
      features: [
        "Unlimited chats",
        "12,000 AI credits",
        "6 seats",
        "Visual builder",
        "35 chatbots & AI agents",
        "90 million knowledge base characters",
        "6 actions per AI agent",
        "Autosync KB sources",
        "Full chatbot customization",
        "31 AI models",
        "API access",
        "Chatbot analytics",
        "Voice input",
        "Satisfaction survey",
        "Remove 'Powered by Chatling' branding",
      ],
    },
  ];

  return (
    <section className="px-6 py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 80, damping: 12 }}
        >
          <h2 className="text-5xl md:text-6xl font-extrabold text-center mb-4">
            Find the perfect plan for you
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start with our free plan or upgrade to unlock premium features.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className="border rounded-lg shadow-lg p-6 bg-white text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <p className="text-4xl font-black mb-6">{plan.price}</p>
              <button className="px-6 py-2 border rounded-full font-bold mb-6">
                {plan.buttonText}
              </button>
              <ul className="text-left space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <span className="text-green-500 mr-2">✔</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mt-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  question: "What is included in the Free plan?",
                  answer:
                    "The Free plan includes unlimited chats, 100 AI credits, 1 seat, and basic chatbot features. It is perfect for small-scale usage and testing.",
                },
                {
                  question: "Can I upgrade or downgrade my plan?",
                  answer:
                    "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
                },
                {
                  question: "What payment methods are accepted?",
                  answer:
                    "We accept all major credit cards and PayPal. Payments are securely processed.",
                },
                {
                  question: "Is there a money-back guarantee?",
                  answer:
                    "Yes, we offer a 30-day money-back guarantee for all paid plans. If you are not satisfied, you can request a refund within this period.",
                },
                {
                  question: "How secure is my data?",
                  answer:
                    "We prioritize data security and use industry-standard encryption to protect your information. Your data is safe with us.",
                },
              ].map((faq, index) => {
                const [isOpen, setIsOpen] = useState(false);
                return (
                  <div key={index} className="border-b">
                    <button
                      className="w-full text-left py-4 flex justify-between items-center"
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <span className="text-xl font-semibold">
                        {faq.question}
                      </span>
                      <span className="text-gray-500">
                        {isOpen ? "▼" : "▶"}
                      </span>
                    </button>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: isOpen ? "auto" : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-gray-600 mt-2 pl-4">{faq.answer}</p>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
