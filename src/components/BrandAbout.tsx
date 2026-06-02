"use client";

import { useState } from "react";
import { ArrowRight, Leaf } from "lucide-react";

// Mobile is intentionally compact (single flowing paragraph with inline icon
// and brand). Both layouts clamp the description to 2 lines and reveal the
// rest inline via the Read more / Read less toggle.
export default function BrandAbout() {
  const [expanded, setExpanded] = useState(false);

  const description = (
    <>
      is a trusted manufacturer and exporter of premium organic food products,
      delivering quality and healthy products across global markets. We
      specialize in natural, sustainable, and export-quality food solutions
      with a commitment to excellence and customer satisfaction worldwide.
    </>
  );

  return (
    <section
      aria-label="About Miraly Foods"
      className="py-3 md:py-10 bg-brand-bg/40 border-y border-primary/5"
    >
      <div className="container-custom">
        {/* Mobile: single flowing paragraph */}
        <div className="md:hidden">
          <p
            className={`text-text-heading text-[12px] leading-snug font-serif italic font-semibold ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            <span className="inline-flex items-center justify-center align-text-bottom w-5 h-5 mr-1.5 rounded-full bg-primary/10 text-primary not-italic">
              <Leaf className="w-3 h-3" />
            </span>
            <span className="font-bold not-italic text-primary-dark">
              Miraly Foods
            </span>{" "}
            {description}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-1 inline-flex items-center font-bold text-primary uppercase tracking-wider text-[11px] hover:text-primary-dark"
          >
            {expanded ? "Read less" : "Read more →"}
          </button>
        </div>

        {/* Desktop: icon + paragraph + CTA in a row */}
        <div className="hidden md:flex items-start gap-5 max-w-6xl mx-auto">
          <div className="shrink-0 w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Leaf className="w-[18px] h-[18px]" />
          </div>

          <div className="flex-1">
            <p
              className={`text-text-heading text-[15px] leading-relaxed font-serif italic font-semibold ${
                expanded ? "" : "line-clamp-2"
              }`}
            >
              <span className="font-bold not-italic text-primary-dark">
                Miraly Foods
              </span>{" "}
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="shrink-0 inline-flex items-center gap-1.5 text-primary font-bold text-[13px] uppercase tracking-wider hover:text-primary-dark transition-colors group whitespace-nowrap self-center"
          >
            {expanded ? "Read less" : "Read more"}
            <ArrowRight
              size={14}
              className={`transition-transform ${
                expanded ? "rotate-90" : "group-hover:translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
