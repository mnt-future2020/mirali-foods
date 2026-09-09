"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";
import { authClient } from "@/lib/auth-client";

/**
 * Default variant for a product shown outside the PDP. Mirrors ProductClient:
 * first in-stock variant, else the first one. Cards no longer let the user
 * pick a size, so this is what they transact and price with.
 */
export function resolveVariant(product: any) {
  if (!product?.variants || product.variants.length === 0) return null;
  return product.variants.find((v: any) => v.stock > 0) || product.variants[0];
}

/** Price a card should show: the default variant's, else the base price. */
export function displayPrice(product: any) {
  return resolveVariant(product)?.price ?? product?.price;
}

/**
 * Per-card size/weight selection, keyed by product id. Cards render many
 * products at once, so the choice cannot live in a single piece of state.
 */
export function useVariantSelection() {
  const [selected, setSelected] = useState<Record<string, string>>({});

  const getVariant = useCallback(
    (product: any) => {
      if (!product?.variants || product.variants.length === 0) return null;
      const uom = selected[product._id];
      return (
        product.variants.find((v: any) => v.uom === uom) ||
        resolveVariant(product)
      );
    },
    [selected],
  );

  const selectVariant = useCallback((productId: string, uom: string) => {
    setSelected((prev) => ({ ...prev, [productId]: uom }));
  }, []);

  const getPrice = useCallback(
    (product: any) => getVariant(product)?.price ?? product?.price,
    [getVariant],
  );

  return { getVariant, selectVariant, getPrice };
}

/** Per-card quantity, keyed by product id. Defaults to 1, never below 1. */
export function useQuantitySelection() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQty = useCallback(
    (productId: string) => quantities[productId] || 1,
    [quantities],
  );

  const setQty = useCallback((productId: string, val: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, val) }));
  }, []);

  return { getQty, setQty };
}

/** Product payload for the cart, priced by the default variant. */
export function cartPayload(product: any, variant?: any) {
  const v = variant ?? resolveVariant(product);
  return v ? { ...product, price: v.price, uom: v.uom } : product;
}

/**
 * "Buy Now" for product cards: adds the product to the cart and sends the
 * user straight to checkout. Same behaviour as the PDP button.
 */
export function useBuyNow() {
  const { addToCart } = useCart();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return useCallback(
    (product: any, qty: number = 1, variant?: any) => {
      if (session?.user?.role === "admin") {
        toast.error("Admin cannot make orders");
        return;
      }
      addToCart(cartPayload(product, variant), qty);
      router.push("/checkout");
    },
    [addToCart, router, session?.user?.role],
  );
}

/**
 * Unit names are typed by hand in the admin panel, so the same unit arrives
 * spelled several ways ("grams", "gms", "Killogram"). Match on the unit word
 * and render a short form; anything unrecognised is passed through untouched
 * so a new unit still displays sensibly.
 */
const UNIT_ABBREVIATIONS: Array<[RegExp, string]> = [
  [/^(kilo?grams?|killo?grams?|kilos?|kgs?)$/i, "kg"],
  [/^(milligrams?|mgs?)$/i, "mg"],
  [/^(grams?|gms?|g)$/i, "g"],
  [/^(millilitres?|milliliters?|mls?)$/i, "ml"],
  [/^(litres?|liters?|ltrs?|l)$/i, "L"],
  [/^(pieces?|pcs?)$/i, "pcs"],
  [/^(packets?|packs?)$/i, "pack"],
];

/** "500 grams" -> "500 g", "1 Killogram" -> "1 kg". */
export function formatUom(uom?: string): string {
  if (!uom) return "";
  const trimmed = uom.trim().replace(/\s+/g, " ");
  const match = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(.+)$/);
  if (!match) return trimmed;

  const [, qty, unit] = match;
  for (const [pattern, short] of UNIT_ABBREVIATIONS) {
    if (pattern.test(unit)) return `${qty} ${short}`;
  }
  return trimmed;
}
