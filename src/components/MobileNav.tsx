"use client";

import Link from "next/link";
import { Home, Store, CreditCard, Heart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useWishlist } from "@/context/WishlistContext";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";

export default function MobileNav() {
  const pathname = usePathname();
  const { wishlistCount } = useWishlist();
  const { data: session } = authClient.useSession();
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

  const profileHref = mounted && session
    ? session.user.role === "admin"
      ? "/admin/dashboard"
      : "/profile"
    : "/login";

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
          href="/wishlist"
          className={`flex flex-col items-center gap-1 relative ${
            isActive("/wishlist")
              ? "text-primary"
              : "text-text-body hover:text-primary transition-colors"
          }`}
        >
          <Heart size={20} />
          {mounted && wishlistCount > 0 && (
            <span className="absolute top-0 right-1 bg-primary text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
          <span className="text-[10px] uppercase font-bold">Wishlist</span>
        </Link>
        <Link
          href={profileHref}
          className={`flex flex-col items-center gap-1 ${
            isActive("/profile") || isActive("/login")
              ? "text-primary"
              : "text-text-body hover:text-primary transition-colors"
          }`}
        >
          <User size={20} />
          <span className="text-[10px] uppercase font-bold">Account</span>
        </Link>
      </div>
    </div>
  );
}
