"use client";

import { ShieldCheck, Heart, Leaf } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "100% Pure & Safe",
    description:
      "We never compromise on purity. Every product is crafted using natural ingredients — free from artificial additives and harmful chemicals.",
  },
  {
    icon: Heart,
    title: "Made with Care",
    description:
      "Quality without shortcuts. Our products are prepared with traditional recipes and modern hygiene standards to ensure the best for your family.",
  },
  {
    icon: Leaf,
    title: "Farm-Sourced Ingredients",
    description:
      "Rooted in nature, responsibly sourced. We partner with trusted farms and suppliers to ensure every ingredient meets our quality and freshness standards.",
  },
];

export default function TrustSection() {
  return (
    <section className="py-6 md:py-16 relative bg-brand-bg/30">
      <div className="container-custom">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl text-text-heading mb-4 inline-block relative font-serif italic">
            Why Shop with Miraly Foods?
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full" />
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center gap-6 p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <feature.icon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-text-heading">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-body leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
