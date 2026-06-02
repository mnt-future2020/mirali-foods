"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { categoryHref } from "@/lib/utils";

export default function CategorySection({
  initialCategories,
}: {
  initialCategories: any[];
}) {
  const [categories] = useState<any[]>(initialCategories);

  if (categories.length === 0) return null;

  return (
    <section className="py-6 md:py-14 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl text-text-heading mb-4 inline-block relative italic">
            Shop By Category
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent rounded-full" />
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {categories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <Link
                href={categoryHref(cat)}
                className="flex flex-col items-center gap-4 group"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-md transform group-hover:scale-105">
                  <Image
                    src={
                      cat.image ||
                      "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=400"
                    }
                    alt={cat.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-semibold text-text-heading group-hover:text-primary transition-colors text-center px-2">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
