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
              className="group bg-white rounded-3xl p-3 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
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
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] font-semibold text-text-heading shadow-sm">
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
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center transition-colors hover:bg-gray-50"
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

              <div className="flex flex-col flex-1 px-2 pt-4 pb-1">
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
                <p className="mt-1.5 text-sm md:text-base font-bold font-number text-text-heading">
                  ₹{getPrice(product)}
                  {product.mrp && product.mrp > product.price && (
                    <span className="text-text-body/50 text-xs line-through ml-2 font-medium">
                      ₹{product.mrp}
                    </span>
                  )}
                </p>

                {/* Size / Weight */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {product.variants.map((v: any, vi: number) => (
                      <button
                        key={vi}
                        onClick={() => selectVariant(product._id, v.uom)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide border transition-colors ${
                          getVariant(product)?.uom === v.uom
                            ? "bg-primary border-primary text-white"
                            : "bg-white border-gray-200 text-text-body hover:border-primary/50"
                        }`}
                      >
                        {formatUom(v.uom)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quantity */}
                <p className="mt-3 text-[10px] font-bold text-primary uppercase tracking-wider">
                  Quantity:
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 w-[104px] flex-shrink-0">
                    <button
                      onClick={() => setQty(product._id, getQty(product._id) - 1)}
                      className="text-gray-500 hover:text-primary transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="text-sm font-bold text-text-heading">
                      {getQty(product._id)}
                    </span>
                    <button
                      onClick={() => setQty(product._id, getQty(product._id) + 1)}
                      className="text-gray-500 hover:text-primary transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(cartPayload(product, getVariant(product)), getQty(product._id));
                      setQty(product._id, 1);
                    }}
                    className="flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-primary text-white rounded-lg py-2 text-[10px] font-bold uppercase tracking-wide hover:bg-primary-dark transition-colors"
                  >
                    <ShoppingCart size={13} />
                    <span className="truncate">Add to Cart</span>
                  </button>
                </div>

                <button
                  onClick={() =>
                    buyNow(product, getQty(product._id), getVariant(product))
                  }
                  className="mt-4 w-full bg-gray-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-black transition-colors"
                >
                  Buy Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
