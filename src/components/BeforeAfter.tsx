"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export type QualityStat = { label?: string; value?: number };

export type QualitySection = {
  title?: string;
  description?: string;
  highlightWord?: string;
  image?: string;
  stats?: QualityStat[];
};

/**
 * Used when the store has no qualitySection configured yet, and exported so
 * the CMS editor can seed itself with what the page is currently showing —
 * Mongoose defaults only apply to newly created documents, so without this an
 * existing store would open an empty form and a save would blank the section.
 */
export const QUALITY_SECTION_DEFAULTS = {
  title: "Quality you can taste, ingredients you can trust.",
  description:
    "Our customers trust Miraly Foods for consistently superior quality. Because great food starts with great ingredients — sourced responsibly, prepared with care.",
  highlightWord: "Miraly Foods",
  image:
    "https://6dfa0433ff.imgdist.com/pub/bfra/9ghkfuy7/6xn/dfh/i4j/dried-chili-pepper-pouring-out-from-sac-floor_1150-35720.jpg",
  stats: [
    { label: "Natural Ingredients", value: 100 },
    { label: "No Preservatives", value: 100 },
    { label: "Farm Fresh Quality", value: 100 },
    { label: "Customer Satisfaction", value: 100 },
  ],
};

/** Bolds every occurrence of the highlight word inside the description. */
function withHighlight(text: string, highlight?: string) {
  if (!highlight) return text;
  const parts = text.split(highlight);
  if (parts.length === 1) return text;

  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <strong className="text-primary font-bold">{highlight}</strong>
      )}
    </Fragment>
  ));
}

export default function BeforeAfter({
  qualitySection,
}: {
  qualitySection?: QualitySection;
}) {
  const title = qualitySection?.title || QUALITY_SECTION_DEFAULTS.title;
  const description =
    qualitySection?.description || QUALITY_SECTION_DEFAULTS.description;
  const highlightWord =
    qualitySection?.highlightWord ?? QUALITY_SECTION_DEFAULTS.highlightWord;
  const image = qualitySection?.image || QUALITY_SECTION_DEFAULTS.image;

  // A saved-but-emptied list should hide the bars, not fall back to the
  // defaults — so only substitute when nothing was configured at all.
  const stats = qualitySection?.stats ?? QUALITY_SECTION_DEFAULTS.stats;
  const visibleStats = stats.filter((s) => s?.label);

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
              {title}
            </h2>
            <p className="text-lg text-text-body leading-relaxed max-w-xl mx-auto lg:mx-0">
              {withHighlight(description, highlightWord)}
            </p>

            {visibleStats.length > 0 && (
              <div className="flex flex-col gap-6 mt-4">
                {visibleStats.map((item, i) => {
                  const value = Math.max(0, Math.min(100, item.value ?? 0));

                  return (
                    <div key={`${item.label}-${i}`} className="w-full">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-sm text-text-heading uppercase tracking-wider">
                          {item.label}
                        </span>
                        <span className="font-bold text-primary text-sm">
                          {value}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${value}%` }}
                          transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                          viewport={{ once: true }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-1 relative aspect-[4/3] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
          >
            <Image
              src={image}
              alt={title}
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
