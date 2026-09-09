"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatUom } from "@/lib/useProductCard";

/**
 * Size picker for a product card.
 *
 * A native <select> drops its option list downward, straight over the Add to
 * Cart and Buy Now row sitting directly beneath the price. This opens upward
 * instead, so the buttons stay visible and clickable while a size is chosen.
 */
export default function VariantSelect({
  variants,
  value,
  onChange,
}: {
  variants: Array<{ uom: string; price: number; stock: number }>;
  value: string;
  onChange: (uom: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select size"
        className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg pl-2 pr-1 py-1 text-[11px] font-bold text-text-heading hover:border-primary/50 focus:border-primary outline-none transition-colors"
      >
        {formatUom(value)}
        <ChevronDown
          size={12}
          className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Size"
          className="absolute bottom-full right-0 mb-1 z-30 min-w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          {variants.map((v, i) => (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={v.uom === value}
              onClick={() => {
                onChange(v.uom);
                setOpen(false);
              }}
              className={`block w-full text-left whitespace-nowrap px-3 py-1.5 text-[11px] font-bold transition-colors ${
                v.uom === value
                  ? "bg-primary text-white"
                  : "text-text-heading hover:bg-gray-50"
              }`}
            >
              {formatUom(v.uom)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
