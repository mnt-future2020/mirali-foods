"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Slide {
  _id?: string;
  title: string;
  titleAccent: string;
  tag: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  badge1: string;
  badge2: string;
}

function getImageUrl(image: string): string {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.includes("/"))
    return `https://res.cloudinary.com/druglbh2m/image/upload/f_auto,q_auto/v1/${image}`;
  return image;
}

const fallbackSlides: Slide[] = [
  {
    title: "Quality Food",
    titleAccent: "Products",
    tag: "Bestseller",
    description: "Premium quality food products crafted with the finest ingredients.",
    image:
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    ctaText: "Shop Now",
    ctaLink: "/shop",
    badge1: "Fresh Quality",
    badge2: "Pure Ingredients",
  },
  {
    title: "Fresh &",
    titleAccent: "Natural",
    tag: "New Arrival",
    description: "Discover our range of fresh and natural food products.",
    image:
      "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    ctaText: "Explore",
    ctaLink: "/shop",
    badge1: "No Preservatives",
    badge2: "Farm Fresh",
  },
  {
    title: "Premium",
    titleAccent: "Selection",
    tag: "Premium",
    description: "Handpicked selection of premium food products for your family.",
    image:
      "https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    ctaText: "View All",
    ctaLink: "/shop",
    badge1: "Curated",
    badge2: "Best Quality",
  },
];

export default function HeroCarousel({
  initialSlides,
}: {
  initialSlides?: Slide[];
}) {
  const [current, setCurrent] = useState(0);
  const [slides] = useState<Slide[]>(
    initialSlides && initialSlides.length > 0 ? initialSlides : fallbackSlides
  );
  const touchStartX = useRef(0);

  const prev = () => {
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setCurrent((p) => (p + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  };

  const slide = slides[current];

  return (
    <section
      className="relative h-[200px] md:h-[400px] w-full overflow-hidden group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 block"
        >
          {slide.ctaLink ? (
            <Link href={slide.ctaLink} className="relative block w-full h-full">
              <Image
                src={getImageUrl(slide.image)}
                alt={`${slide.title} ${slide.titleAccent}`}
                fill
                className="object-cover"
                quality={90}
                priority
                sizes="100vw"
              />
            </Link>
          ) : (
            <Image
              src={getImageUrl(slide.image)}
              alt={`${slide.title} ${slide.titleAccent}`}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 md:p-3 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 md:p-3 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

    </section>
  );
}
