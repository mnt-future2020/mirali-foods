"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart, ArrowRight, Minus, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import {
  useBuyNow,
  useVariantSelection,
  useQuantitySelection,
  cartPayload,
  formatUom,
} from "@/lib/useProductCard";
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
  const { addToCart } = useCart();
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

              <div className="flex flex-col flex-1 px-1 sm:px-2 pt-3 sm:pt-4 pb-1">
                {product.category && (
                  <p className="text-xs text-primary font-medium mb-1">
                    {typeof product.category === "object"
                      ? product.category.name
                      : product.category}
                  </p>
                )}
                <Link href={`/shop/${product.slug}`}>
                  <h3 className="text-sm md:text-base font-semibold text-text-heading leading-snug line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="text-sm md:text-base font-bold font-number text-text-heading">
                    ₹{getPrice(product)}
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-text-body/50 text-xs line-through ml-2 font-medium">
                        ₹{product.mrp}
                      </span>
                    )}
                  </p>

                  {/* Size / Weight — a single variant has nothing to choose */}
                  {product.variants && product.variants.length > 1 && (
                    <select
                      value={getVariant(product)?.uom || ""}
                      onChange={(e) => selectVariant(product._id, e.target.value)}
                      aria-label="Select size"
                      className="ml-auto bg-white border border-gray-200 rounded-lg pl-2 pr-1 py-1 text-[11px] font-bold text-text-heading cursor-pointer outline-none focus:border-primary transition-colors"
                    >
                      {product.variants.map((v: any, vi: number) => (
                        <option key={vi} value={v.uom}>
                          {formatUom(v.uom)}
                        </option>
                      ))}
                    </select>
                  )}

                  {product.variants && product.variants.length === 1 && (
                    <span className="ml-auto text-[11px] font-bold text-text-body/70">
                      {formatUom(product.variants[0].uom)}
                    </span>
                  )}
                </div>

                {/* Quantity + Add to Cart + Buy Now, kept on a single line */}
                <div className="mt-3 flex flex-wrap items-center gap-[2px] sm:gap-2">
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-1 sm:px-2 h-[22px] sm:h-[34px] w-[40px] sm:w-[72px] flex-shrink-0">
                    <button
                      onClick={() => setQty(product._id, getQty(product._id) - 1)}
                      className="text-gray-500 hover:text-primary transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={10} strokeWidth={3} className="sm:hidden" />
                      <Minus size={14} strokeWidth={3} className="hidden sm:block" />
                    </button>
                    <span className="text-[9px] sm:text-sm font-bold text-text-heading">
                      {getQty(product._id)}
                    </span>
                    <button
                      onClick={() => setQty(product._id, getQty(product._id) + 1)}
                      className="text-gray-500 hover:text-primary transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={10} strokeWidth={3} className="sm:hidden" />
                      <Plus size={14} strokeWidth={3} className="hidden sm:block" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(cartPayload(product, getVariant(product)), getQty(product._id));
                      setQty(product._id, 1);
                    }}
                    aria-label="Add to cart"
                    className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-primary text-white rounded-lg h-[22px] w-[22px] sm:h-[34px] sm:w-[34px] hover:bg-primary-dark transition-colors"
                  >
                    <ShoppingCart size={12} className="flex-shrink-0 sm:hidden" />
                    <ShoppingCart size={14} className="flex-shrink-0 hidden sm:block" />
                  </button>
                  <button
                    onClick={() => buyNow(product, getQty(product._id), getVariant(product))}
                    className="flex-1 min-w-[34px] bg-gray-900 text-white rounded-full h-[22px] sm:h-[34px] px-0.5 sm:px-1 text-[9px] sm:text-[10px] xl:text-xs font-semibold whitespace-nowrap hover:bg-black transition-colors"
                  >
                    <span className="sm:hidden">Buy</span>
                    <span className="hidden sm:inline">Buy Now</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
