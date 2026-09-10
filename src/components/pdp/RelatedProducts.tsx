"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, ShoppingCart, Minus, Plus } from "lucide-react";
import VariantSelect from "@/components/VariantSelect";
import { useEffect, useState } from "react";
import {
  useBuyNow,
  useVariantSelection,
  useQuantitySelection,
  formatUom,
} from "@/lib/useProductCard";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  rating: number;
  numReviews: number;
  images: string[];
  category: string;
  stock: number;
  uom?: string;
  variants?: Array<{
    uom: string;
    price: number;
    stock: number;
  }>;
}

export default function RelatedProducts({
  currentId,
  category,
  manageInventory = false,
}: {
  currentId: string;
  category?: string;
  manageInventory?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const buyNow = useBuyNow();
  const { getVariant, selectVariant, getPrice } = useVariantSelection();
  const { getQty, setQty } = useQuantitySelection();

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        // Build query params
        const params = new URLSearchParams({
          limit: "4",
          exclude: currentId,
        });

        // Add category filter if available
        if (category) {
          params.append("category", category);
        }

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch related products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRelatedProducts();
  }, [currentId, category]);

  if (loading) {
    return (
      <section className="py-10 md:py-24 border-t border-primary/5 mt-10 md:mt-20">
        <div className="flex justify-center items-center py-10 md:py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-24 border-t border-primary/5 mt-10 md:mt-20">
      <div className="flex justify-between items-end mb-8 md:mb-16">
        <div>
          <span className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-primary mb-4 block">
            Complete your treat
          </span>
          <h2 className="text-4xl font-serif font-black text-primary-dark tracking-tighter">
            You May Also <span className="text-brown italic">Love</span>
          </h2>
        </div>
        <Link
          href="/shop"
          className="text-xs font-sans font-black uppercase tracking-widest text-primary-dark hover:text-accent transition-colors flex items-center gap-2 group"
        >
          Browse All{" "}
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((p, i) => {
          const totalStock = p.variants?.length
            ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
            : p.stock || 0;
          const isOutOfStock = manageInventory && totalStock === 0;

          return (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-3xl p-2 sm:p-3 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative">
                <Link
                  href={`/shop/${p.slug}`}
                  className="block relative aspect-square rounded-2xl overflow-hidden bg-gray-50"
                >
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ShoppingCart size={40} className="text-gray-300" />
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </Link>

                {p.numReviews > 0 && (
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/95 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 text-accent shadow-sm">
                    <Star size={11} fill="currentColor" />
                    <span className="text-[11px] font-semibold">{p.rating}</span>
                  </span>
                )}
              </div>

              {!isOutOfStock && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 min-w-0 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-1 sm:px-2 h-[26px] sm:h-[34px]">
                    <button
                      onClick={() => setQty(p._id, getQty(p._id) - 1)}
                      className="text-gray-500 hover:text-primary transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={11} strokeWidth={3} className="sm:hidden" />
                      <Minus size={14} strokeWidth={3} className="hidden sm:block" />
                    </button>
                    <span className="text-[10px] sm:text-sm font-bold text-text-heading">
                      {getQty(p._id)}
                    </span>
                    <button
                      onClick={() => setQty(p._id, getQty(p._id) + 1)}
                      className="text-gray-500 hover:text-primary transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={11} strokeWidth={3} className="sm:hidden" />
                      <Plus size={14} strokeWidth={3} className="hidden sm:block" />
                    </button>
                  </div>
                  <button
                    onClick={() => buyNow(p, getQty(p._id), getVariant(p))}
                    className="flex-shrink-0 bg-primary text-white rounded-lg h-[26px] sm:h-[34px] px-3 sm:px-5 text-[10px] sm:text-xs font-semibold whitespace-nowrap hover:bg-primary-dark transition-colors"
                  >
                    Buy
                  </button>
                </div>
              )}

              <div className="flex flex-col flex-1 px-1 sm:px-2 pt-3 pb-1 text-center">
                {p.category && (
                  <p className="text-[10px] sm:text-xs text-primary font-medium uppercase tracking-wide mb-1">
                    {typeof p.category === "object"
                      ? (p.category as any).name
                      : p.category}
                  </p>
                )}
                <Link href={`/shop/${p.slug}`}>
                  <h3 className="text-sm md:text-base font-semibold text-text-heading leading-snug line-clamp-2 hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                </Link>

                <div className="mt-2 flex items-center justify-between gap-2">
                  {/* Size / Weight — a single variant has nothing to choose */}
                  {p.variants && p.variants.length > 1 ? (
                    <VariantSelect
                      variants={p.variants}
                      value={getVariant(p)?.uom || ""}
                      onChange={(uom) => selectVariant(p._id, uom)}
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-text-body/70">
                      {formatUom(p.variants?.[0]?.uom || p.uom)}
                    </span>
                  )}

                  <p className="text-sm md:text-base font-bold font-number text-text-heading">
                    ₹{getPrice(p)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
