"use client";

import React, { useEffect, useState, useRef } from "react";
import { Star, Loader2, Quote } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

interface GoogleReview {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  userPhoto?: string;
  createdAt: string;
  source: string;
}

interface GoogleReviewsData {
  reviews: GoogleReview[];
  averageRating: number;
  totalReviewCount: number;
  placeId?: string;
  cached?: boolean;
  error?: string;
}

export default function GoogleReviewsCarousel() {
  const [data, setData] = useState<GoogleReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews/google");
        const reviewData = await res.json();
        setData(reviewData);
      } catch (err) {
        console.error("Failed to fetch Google reviews:", err);
        setData({
          reviews: [],
          averageRating: 0,
          totalReviewCount: 0,
          error: "Failed to load reviews",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    if (!data?.reviews?.length) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % data.reviews.length);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data]);

  if (loading) return null;

  if (data?.error || !data?.reviews || data.reviews.length === 0) return null;

  const reviews = data.reviews;

  return (
    <section className="py-6 md:py-16 bg-primary-dark relative overflow-hidden text-white">
      <div className="container-custom relative z-10">
        <div className="flex flex-col items-center max-w-4xl mx-auto text-center">
          <Quote className="text-accent mb-8 opacity-50" size={64} />

          <div className="relative min-h-[250px] md:min-h-[200px] w-full">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: current === i ? 1 : 0,
                  scale: current === i ? 1 : 0.95,
                  display: current === i ? "block" : "none",
                }}
                transition={{ duration: 0.5 }}
                className="absolute inset-x-0"
              >
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      size={18}
                      className={
                        j < review.rating
                          ? "fill-accent text-accent"
                          : "text-white/20"
                      }
                    />
                  ))}
                </div>
                <p className="text-xl md:text-2xl font-serif italic leading-relaxed mb-8 text-gray-100">
                  &ldquo;{review.comment || "Great products! Highly recommended."}&rdquo;
                </p>
                <div className="flex items-center justify-center gap-3 mb-2">
                  {review.userPhoto ? (
                    <Image
                      src={review.userPhoto}
                      alt={review.userName}
                      width={40}
                      height={40}
                      className="rounded-full ring-2 ring-accent/30"
                      unoptimized
                    />
                  ) : null}
                  <h4 className="text-lg font-bold text-accent uppercase tracking-widest">
                    {review.userName}
                  </h4>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3 mt-12">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  current === i ? "bg-accent w-10" : "bg-white/30"
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            {data.placeId && (
              <a
                href={`https://search.google.com/local/writereview?placeid=${data.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-primary-dark px-8 py-3 rounded font-bold uppercase tracking-wider text-xs transition-all"
              >
                <Star size={16} className="fill-primary" />
                Write a Review
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
