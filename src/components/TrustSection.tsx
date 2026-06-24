"use client";

import { ShieldCheck, Heart, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "100% Pure & Safe",
    description:
      "We never compromise on purity. Every product is crafted using natural ingredients — free from artificial additives and harmful chemicals.",
    image:
      "https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
  {
    icon: Heart,
    title: "Made with Care",
    description:
      "Quality without shortcuts. Our products are prepared with traditional recipes and modern hygiene standards to ensure the best for your family.",
    image:
      "https://images.pexels.com/photos/4198714/pexels-photo-4198714.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
  {
    icon: Leaf,
    title: "Farm-Sourced Ingredients",
    description:
      "Rooted in nature, responsibly sourced. We partner with trusted farms and suppliers to ensure every ingredient meets our quality and freshness standards.",
    image:
      "https://images.pexels.com/photos/1483880/pexels-photo-1483880.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
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
              className="group relative flex flex-col min-h-[400px] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300 ring-1 ring-black/5"
            >
              {/* Background image */}
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-[1.5s] group-hover:scale-110"
              />
              {/* Readability overlay — bottom-weighted scrim keeps text crisp */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/25" />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />

              {/* Icon — top */}
              <div className="relative z-10 p-7">
                <div className="w-14 h-14 rounded-2xl bg-primary/90 backdrop-blur-sm flex items-center justify-center text-white shadow-lg ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-300">
                  <feature.icon size={28} />
                </div>
              </div>

              {/* Text — anchored to bottom */}
              <div className="relative z-10 mt-auto p-7 pt-0">
                <h3 className="text-2xl font-serif font-bold mb-2 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
                  {feature.title}
                </h3>
                <div className="w-10 h-[3px] bg-accent rounded-full mb-4" />
                <p className="text-[15px] text-white/90 leading-relaxed [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">
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
