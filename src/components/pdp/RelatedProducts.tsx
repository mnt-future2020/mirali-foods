"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, ShoppingCart, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import {
  useBuyNow,
  useVariantSelection,
  useQuantitySelection,
  cartPayload,
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
  const { addToCart } = useCart();
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
              className="group bg-white rounded-3xl p-3 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
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
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-accent shadow-sm">
                    <Star size={11} fill="currentColor" />
                    <span className="text-[11px] font-semibold">{p.rating}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col flex-1 px-2 pt-4 pb-1">
                {p.category && (
                  <p className="text-xs text-primary font-medium mb-1">
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
                <p className="mt-1.5 text-sm md:text-base font-bold font-number text-text-heading">
                  ₹{getPrice(p)}
                </p>

                {!isOutOfStock && (
                  <>
                    {/* Size / Weight */}
                    {p.variants && p.variants.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.variants.map((v: any, vi: number) => (
                          <button
                            key={vi}
                            onClick={() => selectVariant(p._id, v.uom)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide border transition-colors ${
                              getVariant(p)?.uom === v.uom
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
                          onClick={() => setQty(p._id, getQty(p._id) - 1)}
                          className="text-gray-500 hover:text-primary transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="text-sm font-bold text-text-heading">
                          {getQty(p._id)}
                        </span>
                        <button
                          onClick={() => setQty(p._id, getQty(p._id) + 1)}
                          className="text-gray-500 hover:text-primary transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(cartPayload(p, getVariant(p)), getQty(p._id));
                          setQty(p._id, 1);
                        }}
                        className="flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-primary text-white rounded-lg py-2 text-[10px] font-bold uppercase tracking-wide hover:bg-primary-dark transition-colors"
                      >
                        <ShoppingCart size={13} />
                        <span className="truncate">Add to Cart</span>
                      </button>
                    </div>

                  </>
                )}

                {!isOutOfStock && (
                  <button
                    onClick={() => buyNow(p, getQty(p._id), getVariant(p))}
                    className="mt-4 w-full bg-gray-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-black transition-colors"
                  >
                    Buy Now
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
