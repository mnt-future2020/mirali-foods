"use client";

import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function PromoSection() {
  return (
    <section className="py-6 md:py-16 relative overflow-hidden">
      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-brand-bg rounded-3xl overflow-hidden shadow-2xl border border-primary/5 px-6 py-10 md:px-12 md:py-16"
        >
          {/* Subtle decorative accents to fill space the image used to occupy */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
            <span className="inline-flex items-center gap-2 text-accent font-bold text-sm md:text-base uppercase tracking-widest bg-accent/10 px-4 py-1.5 rounded-full">
              <Sparkles size={16} />
              Limited Offer
            </span>

            <div>
              <h2 className="text-3xl md:text-5xl text-text-heading leading-tight mb-3 font-serif">
                Miraly Foods{" "}
                <span className="text-primary italic">Special Combo Pack</span>
              </h2>
              <p className="text-base md:text-xl font-medium text-primary-dark/80 italic">
                Quality & Freshness in Every Bite
              </p>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-2 text-left max-w-xl w-full">
              {[
                "Premium Quality Ingredients",
                "No Artificial Preservatives",
                "Farm Fresh & Natural",
                "Best Value for Money",
              ].map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 font-semibold text-text-heading text-sm md:text-base"
                >
                  <CheckCircle
                    size={20}
                    className="text-primary fill-primary/10 shrink-0"
                  />
                  {item}
                </motion.li>
              ))}
            </ul>

            <Link
              href="/shop"
              className="btn-primary text-base md:text-lg group mt-4"
            >
              SHOP NOW{" "}
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
