"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const defaultFeatures = [
  {
    title: "Traditional Recipes",
    desc: "Heritage blends refined over 25 years. Our recipes are family heirlooms — not from a lab or an algorithm.",
    num: "01",
  },
  {
    title: "Premium Ingredients",
    desc: "Sun-dried, stone-ground spices and farm-sourced raw materials. You'll taste the real difference.",
    num: "02",
  },
  {
    title: "Authentic Freshness",
    desc: "Ground and packed in small batches to lock in aroma and flavor. From our facility to your kitchen in days, not months.",
    num: "03",
  },
];

export default function WhyChooseUs({ configuration }: { configuration?: any }) {
  // Safe fallbacks for config
  const title = configuration?.title || "No Shortcuts.\nNo Compromises.";
  const highlightWord = configuration?.highlightWord || "Compromises.";
  const description = configuration?.description || "Every product we make carries a promise — pure, authentic, and crafted the traditional way.";
  const image = configuration?.image || "https://images.pexels.com/photos/4686958/pexels-photo-4686958.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
  const badge1Value = configuration?.badge1Value || "25+";
  const badge1Label = configuration?.badge1Label || "Years of Heritage";
  const badge2Value = configuration?.badge2Value || "10K+";
  const badge2Label = configuration?.badge2Label || "Happy Customers";
  
  // Merge dynamic feature text with static icons/numbers
  const features = defaultFeatures.map((def, i) => {
    const dynamicFeature = configuration?.features?.[i];
    return {
      ...def,
      title: dynamicFeature && dynamicFeature.title ? dynamicFeature.title : def.title,
      desc: dynamicFeature && dynamicFeature.desc ? dynamicFeature.desc : def.desc,
    };
  });

  const renderTitle = () => {
    if (!highlightWord) return title;
    const parts = title.split(new RegExp(`(${highlightWord})`, "i"));
    return parts.map((part: string, i: number) => 
      part.toLowerCase() === highlightWord.toLowerCase() ? (
        <span key={i} className="text-[#C4743F] italic">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <section className="py-28 bg-[#007D71] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C4743F]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(248,191,81,0.5) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left: Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#C4743F] mb-5 block">
                Why Choose Us
              </span>
              <h2 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tight leading-[1.05] mb-3 whitespace-pre-line">
                {renderTitle()}
              </h2>
              <div className="w-16 h-1 bg-[#C4743F] rounded-full mb-8" />
              <p className="text-white/40 text-base leading-relaxed mb-12 max-w-md whitespace-pre-line">
                {description}
              </p>
            </motion.div>

            <div className="space-y-6">
              {features.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }}
                  viewport={{ once: true }}
                  className="flex gap-5 group p-5 rounded-2xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
                >
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#C4743F] group-hover:scale-105 transition-all duration-300 shadow-lg shadow-black/10">
                    <span className="text-xl font-serif font-black text-[#C4743F] group-hover:text-[#007D71] transition-colors delay-75">
                      {item.num}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-white">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative group"
          >
            <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden border-2 border-white/10 shadow-2xl shadow-[#007D71]/15 relative">
              <Image
                src={image}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
                alt="Section Image"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#007D71]/40 via-transparent to-transparent" />
            </div>

            {/* Stats badge */}
            <div className="absolute -bottom-6 -left-6 bg-[#C4743F] p-7 rounded-3xl shadow-2xl shadow-[#007D71]/15">
              <p className="text-4xl font-serif font-black text-[#007D71] mb-1">
                {badge1Value}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#007D71]/70">
                {badge1Label}
              </p>
            </div>

            {/* Secondary badge */}
            <div className="absolute -top-4 -right-4 bg-white p-5 rounded-2xl shadow-2xl shadow-[#007D71]/10">
              <p className="text-2xl font-serif font-black text-[#007D71] mb-0.5">
                {badge2Value}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#007D71]/50">
                {badge2Label}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
