"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function BeforeAfter() {
  return (
    <section className="py-6 md:py-16 relative overflow-hidden bg-white">
      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 text-center lg:text-left flex flex-col gap-6"
          >
            <h2 className="text-3xl lg:text-5xl font-serif text-text-heading leading-tight">
              Quality you can taste, ingredients you can trust.
            </h2>
            <p className="text-lg text-text-body leading-relaxed max-w-xl mx-auto lg:mx-0">
              Our customers trust{" "}
              <strong className="text-primary font-bold">Miraly Foods</strong>{" "}
              for consistently superior quality. Because great food starts with
              great ingredients — sourced responsibly, prepared with care.
            </p>

            <div className="flex flex-col gap-6 mt-4">
              {[
                { label: "Natural Ingredients", value: 100 },
                { label: "No Preservatives", value: 100 },
                { label: "Farm Fresh Quality", value: 100 },
                { label: "Customer Satisfaction", value: 100 },
              ].map((item, i) => (
                <div key={item.label} className="w-full">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm text-text-heading uppercase tracking-wider">
                      {item.label}
                    </span>
                    <span className="font-bold text-primary text-sm">
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-1 relative aspect-[4/3] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
          >
            <Image
              src="https://6dfa0433ff.imgdist.com/pub/bfra/9ghkfuy7/6xn/dfh/i4j/dried-chili-pepper-pouring-out-from-sac-floor_1150-35720.jpg"
              alt="Miraly Foods Products"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
