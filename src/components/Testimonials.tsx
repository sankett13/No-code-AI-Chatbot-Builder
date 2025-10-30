"use client";

import { motion } from "framer-motion";

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        "This platform transformed how we handle customer inquiries. Our response time went from hours to seconds!",
      author: "Sarah Johnson",
      role: "Small Business Owner",
      company: "Boutique Fashion Store",
    },
    {
      quote:
        "As someone with no coding background, I was amazed at how easy it was to create a professional chatbot for my consulting business.",
      author: "Michael Chen",
      role: "Business Consultant",
      company: "Chen Advisory",
    },
    {
      quote:
        "The integration was seamless. I had our chatbot up and running on multiple client websites within an hour.",
      author: "Emma Davis",
      role: "Web Developer",
      company: "Digital Solutions Inc",
    },
    {
      quote:
        "Our customer satisfaction scores increased by 40% after implementing the chatbot. Worth every penny!",
      author: "David Martinez",
      role: "Restaurant Owner",
      company: "Local Eats",
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
          What Our Users Say
        </motion.h2>
        <motion.p
          className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Join thousands of satisfied customers who are transforming their
          customer engagement
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="p-6 bg-gray-50 rounded-lg border"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
              <div className="border-t pt-4">
                <p className="font-bold">{testimonial.author}</p>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
                <p className="text-sm text-gray-500">{testimonial.company}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
