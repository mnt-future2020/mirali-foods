import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// URL-safe identifier for a category. Prefers the admin-defined slug;
// falls back to a percent-encoded name only if a legacy category lacks one
// (defensive — Category admin enforces slug on create).
export function categoryToParam(cat: { slug?: string; name?: string } | null | undefined): string {
  if (!cat) return "";
  if (cat.slug) return cat.slug;
  if (cat.name) return encodeURIComponent(cat.name);
  return "";
}

// Full shop href for a category. Omits the ?category= query entirely when the
// category produces no usable identifier, so we never emit a dangling "?category=".
export function categoryHref(cat: { slug?: string; name?: string } | null | undefined): string {
  const param = categoryToParam(cat);
  return param ? `/shop?category=${param}` : "/shop";
}
