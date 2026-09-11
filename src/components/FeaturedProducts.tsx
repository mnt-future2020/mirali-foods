"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart, ArrowRight, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import {
  useBuyNow,
  useVariantSelection,
  useQuantitySelection,
  formatUom,
} from "@/lib/useProductCard";
import VariantSelect from "@/components/VariantSelect";
import { useState } from "react";

export default function FeaturedProducts({
  initialProducts,
  title = "Best Selling",
  subtitle,
  viewAllLink = "/shop",
}: {
  initialProducts: any[];
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
}) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const buyNow = useBuyNow();
  const { getVariant, selectVariant, getPrice } = useVariantSelection();
  const { getQty, setQty } = useQuantitySelection();
  const [products] = useState<any[]>(initialProducts);

  if (products.length === 0) return null;

  return (
    <section className="pt-2 pb-6 md:pt-8 md:pb-16">
      <div className="container-custom">
        <div className="flex flex-row justify-between items-center mb-3 md:mb-8 gap-2">
          <div>
            {subtitle && (
              <p className="text-accent font-medium mb-1 text-sm">{subtitle}</p>
            )}
            <h2 className="text-xl md:text-4xl text-text-heading relative inline-block">
              {title}
              <div className="absolute -bottom-2 left-0 w-16 md:w-24 h-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-primary" />
              </div>
            </h2>
          </div>

          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="text-text-body flex items-center gap-1 md:gap-2 hover:text-primary font-semibold transition-colors group text-xs md:text-base whitespace-nowrap"
            >
              View all products{" "}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product, i) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-3xl p-2 sm:p-3 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative">
                <Link
                  href={`/shop/${product.slug}`}
                  className="block relative aspect-square rounded-2xl overflow-hidden bg-gray-50"
                >
                  <Image
                    src={
                      product.images && product.images[0]
                        ? product.images[0]
                        : "https://via.placeholder.com/400x400?text=No+Image"
                    }
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority={i < 2}
                  />
                </Link>

                {/* Badge */}
                {(product.badge ||
                  (product.mrp && product.mrp > product.price)) && (
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 max-w-[calc(100%-3.25rem)] truncate bg-white/95 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-semibold text-text-heading shadow-sm">
                    {product.badge ||
                      `${Math.round(
                        ((product.mrp - product.price) / product.mrp) * 100,
                      )}% OFF`}
                  </span>
                )}

                {/* Wishlist */}
                <button
                  onClick={() => {
                    if (isInWishlist(product._id)) {
                      removeFromWishlist(product._id);
                    } else {
                      addToWishlist(product);
                    }
                  }}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white shadow-sm flex items-center justify-center transition-colors hover:bg-gray-50"
                  aria-label="Add to wishlist"
                >
                  <Heart
                    size={17}
                    className={
                      isInWishlist(product._id)
                        ? "text-red-500"
                        : "text-gray-400"
                    }
                    fill={isInWishlist(product._id) ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-1 sm:px-2 h-[26px] sm:h-[34px]">
                  <button
                    onClick={() => setQty(product._id, getQty(product._id) - 1)}
                    className="text-gray-500 hover:text-primary transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={11} strokeWidth={3} className="sm:hidden" />
                    <Minus size={14} strokeWidth={3} className="hidden sm:block" />
                  </button>
                  <span className="text-[10px] sm:text-sm font-bold text-text-heading">
                    {getQty(product._id)}
                  </span>
                  <button
                    onClick={() => setQty(product._id, getQty(product._id) + 1)}
                    className="text-gray-500 hover:text-primary transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={11} strokeWidth={3} className="sm:hidden" />
                    <Plus size={14} strokeWidth={3} className="hidden sm:block" />
                  </button>
                </div>
                <button
                  onClick={() => buyNow(product, getQty(product._id), getVariant(product))}
                  className="flex-shrink-0 bg-primary text-white rounded-lg h-[26px] sm:h-[34px] px-3 sm:px-5 text-[10px] sm:text-xs font-semibold whitespace-nowrap hover:bg-primary-dark transition-colors"
                >
                  Buy
                </button>
              </div>

              <div className="flex flex-col flex-1 px-1 sm:px-2 pt-3 pb-1 text-center">
                {product.category && (
                  <p className="text-[10px] sm:text-xs text-primary font-medium uppercase tracking-wide mb-1">
                    {typeof product.category === "object"
                      ? (product.category as any).name
                      : product.category}
                  </p>
                )}
                <Link href={`/shop/${product.slug}`}>
                  <h3 className="text-[15px] md:text-base font-semibold text-text-heading leading-snug line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <div className="mt-2 flex items-center justify-between gap-2">
                  {/* Size / Weight — a single variant has nothing to choose */}
                  {product.variants && product.variants.length > 1 ? (
                    <VariantSelect
                      variants={product.variants}
                      value={getVariant(product)?.uom || ""}
                      onChange={(uom) => selectVariant(product._id, uom)}
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-text-body/70">
                      {formatUom(product.variants?.[0]?.uom || product.uom)}
                    </span>
                  )}

                  <p className="text-sm md:text-base font-bold font-number text-text-heading">
                    ₹{getPrice(product)}
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-text-body/50 text-xs line-through ml-1 font-medium">
                        ₹{product.mrp}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
