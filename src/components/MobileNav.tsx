"use client";

import Link from "next/link";
import { Home, Store, ShoppingCart, CreditCard, Package } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";

export default function MobileNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide on invoice, bulk-print, and admin pages
  if (pathname?.includes("/invoice") || pathname?.includes("/bulk-print") || pathname?.startsWith("/admin")) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  const openCart = () => window.dispatchEvent(new Event("open-cart"));

  return (
    <div className="lg:hidden print:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 px-4 py-2">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 ${
            isActive("/") && pathname === "/"
              ? "text-primary"
              : "text-text-body hover:text-primary transition-colors"
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] uppercase font-bold">Home</span>
        </Link>
        <Link
          href="/shop"
          className={`flex flex-col items-center gap-1 ${
            isActive("/shop")
              ? "text-primary"
              : "text-text-body hover:text-primary transition-colors"
          }`}
        >
          <Store size={20} />
          <span className="text-[10px] uppercase font-bold">Shop</span>
        </Link>
        <button
          type="button"
          onClick={openCart}
          className="flex flex-col items-center gap-1 relative text-text-body hover:text-primary transition-colors"
        >
          <ShoppingCart size={20} />
          {mounted && cartCount > 0 && (
            <span className="absolute top-0 right-1 bg-primary text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] uppercase font-bold">Cart</span>
        </button>
        <Link
          href="/checkout"
          className={`flex flex-col items-center gap-1 ${
            isActive("/checkout")
              ? "text-primary"
              : "text-text-body hover:text-primary transition-colors"
          }`}
        >
          <CreditCard size={20} />
          <span className="text-[10px] uppercase font-bold">Checkout</span>
        </Link>
        <Link
          href="/orders"
          className={`flex flex-col items-center gap-1 ${
            isActive("/orders")
              ? "text-primary"
              : "text-text-body hover:text-primary transition-colors"
          }`}
        >
          <Package size={20} />
          <span className="text-[10px] uppercase font-bold">Orders</span>
        </Link>
      </div>
    </div>
  );
}
