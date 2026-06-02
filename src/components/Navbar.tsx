"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Heart,
  MapPin,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import CartDrawer from "./CartDrawer";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useNavbarData } from "@/context/NavbarDataContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { categoryToParam, categoryHref } from "@/lib/utils";

export default function Navbar() {
  const { data: session } = authClient.useSession();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { settings, categories } = useNavbarData();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [mounted, setMounted] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keep the header search dropdown in sync with the URL so a deep-linked
  // /shop?category=rice-flour visit shows the correct option pre-selected.
  // Also maps legacy encoded-name URLs (?category=Rice%20%26%20Flour) to the
  // matching slug so old bookmarks still highlight the right option.
  useEffect(() => {
    if (pathname !== "/shop") return;
    const urlValue = searchParams.get("category") || "";
    if (!urlValue) {
      setSearchCategory("");
      return;
    }
    const match = categories.find(
      (c: any) => categoryToParam(c) === urlValue || c.name === urlValue
    );
    setSearchCategory(match ? categoryToParam(match) : "");
  }, [pathname, searchParams, categories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (searchCategory) params.set("category", searchCategory);
    router.push(`/shop${params.toString() ? `?${params.toString()}` : ""}`);
    setSearchQuery("");
  };

  return (
    <>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <header className="fixed w-full z-50 transition-all duration-300 print:hidden">
        {/* Top Bar */}
        {!isScrolled && (
          <div className="hidden md:block bg-primary-dark text-white py-2 px-4 text-xs">
            <div className="container-custom flex justify-between items-center">
              <div className="flex gap-4 items-center">
                {settings?.socialMedia?.instagram && (
                  <a
                    href={settings.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-300 transition-colors"
                  >
                    <Instagram size={14} />
                  </a>
                )}
                {settings?.socialMedia?.facebook && (
                  <a
                    href={settings.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-300 transition-colors"
                  >
                    <Facebook size={14} />
                  </a>
                )}
                {settings?.socialMedia?.twitter && (
                  <a
                    href={settings.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-300 transition-colors"
                  >
                    <Twitter size={14} />
                  </a>
                )}
                <span className="hidden md:flex items-center gap-2 border-l border-white/20 pl-4">
                  <Clock size={14} /> Mon-Sat: 9:00 AM - 7:00 PM
                </span>
              </div>
              <div className="flex gap-6 items-center">
                {settings?.address && (
                  <span className="hidden lg:flex items-center gap-2">
                    <MapPin size={14} /> {settings.address}
                  </span>
                )}
                {settings?.contactEmail && (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="flex items-center gap-2 hover:text-gray-300 transition-colors"
                  >
                    <Mail size={14} /> {settings.contactEmail}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Header */}
        <div
          className={`bg-primary text-white border-b border-white/10 transition-all duration-300 ${
            isScrolled ? "py-2 shadow-xl backdrop-blur-md bg-primary/95" : "py-2 md:py-4"
          }`}
        >
          <div className="container-custom flex flex-nowrap lg:flex-wrap items-center justify-between gap-2 sm:gap-4">
            {/* Logo + Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-shrink">
              <button
                className="lg:hidden p-1 flex-shrink-0"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
              <Link href="/" className="flex-shrink min-w-0 flex items-center gap-0">
                {settings?.logo ? (
                  <div className="h-9 md:h-16 w-20 sm:w-24 md:w-44 relative flex-shrink-0">
                    <Image
                      src={settings.logo}
                      alt={settings.shopName || "Miraly Foods"}
                      fill
                      sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 176px"
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                ) : (
                  <span className="text-xl md:text-2xl font-serif font-bold text-white truncate">
                    {settings?.shopName || "Miraly Foods"}
                  </span>
                )}
                {settings?.logo2 && (
                  <div className="hidden sm:block h-9 md:h-16 w-16 sm:w-24 md:w-44 relative flex-shrink-0">
                    <Image
                      src={settings.logo2}
                      alt="Secondary Logo"
                      fill
                      sizes="(max-width: 640px) 64px, (max-width: 768px) 96px, 176px"
                      className="object-contain object-left"
                    />
                  </div>
                )}
              </Link>
            </div>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xl mx-4"
            >
              <div className="relative w-full flex items-center bg-white rounded overflow-hidden">
                <select
                  value={searchCategory}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchCategory(value);
                    // Preserve any existing ?search= when switching category
                    // (or picking "All Categories" to clear the category only).
                    const params = new URLSearchParams(searchParams.toString());
                    if (value) params.set("category", value);
                    else params.delete("category");
                    const qs = params.toString();
                    router.push(`/shop${qs ? `?${qs}` : ""}`);
                  }}
                  className="px-4 py-2 text-text-body border-r border-gray-200 hidden lg:block bg-gray-50 text-sm cursor-pointer outline-none appearance-none pr-8 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23555%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center]"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={categoryToParam(cat)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="I'm looking for..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 text-text-body focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark p-2 transition-colors text-white"
                >
                  <Search size={20} />
                </button>
              </div>
            </form>

            {/* Icons & CTA */}
            <div className="flex items-center gap-4 lg:gap-8">
              {settings?.contactPhone && (
                <div className="hidden lg:flex items-center gap-3">
                  <div className="bg-white/10 p-2 rounded-full">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-white/70 leading-none">
                      Call us
                    </p>
                    <p className="text-sm font-bold">{settings.contactPhone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 sm:gap-2 md:gap-3 -mr-2 md:mr-0">
                <Link
                  href={
                    session
                      ? session.user.role === "admin"
                        ? "/admin/dashboard"
                        : session.user.role === "customer"
                          ? "/profile"
                          : "/login"
                      : "/login"
                  }
                  aria-label="Account"
                  className="relative inline-flex items-center justify-center h-11 w-11 md:h-10 md:w-10 rounded-full hover:bg-white/10 active:bg-white/15 hover:text-white/90 transition-colors"
                >
                  <User size={24} className="md:w-6 md:h-6" strokeWidth={2} />
                </Link>
                <Link
                  href="/wishlist"
                  aria-label={`Wishlist${mounted && wishlistCount > 0 ? ` (${wishlistCount} items)` : ""}`}
                  className="relative inline-flex items-center justify-center h-11 w-11 md:h-10 md:w-10 rounded-full hover:bg-white/10 active:bg-white/15 hover:text-white/90 transition-colors"
                >
                  <Heart size={24} className="md:w-6 md:h-6" strokeWidth={2} />
                  {mounted && wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 md:top-0.5 md:right-0.5 bg-accent text-white text-[10px] font-semibold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ring-2 ring-primary">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  aria-label={`Cart${mounted && cartCount > 0 ? ` (${cartCount} items)` : ""}`}
                  className="relative inline-flex items-center justify-center h-11 w-11 md:h-10 md:w-10 rounded-full hover:bg-white/10 active:bg-white/15 hover:text-white/90 transition-colors"
                >
                  <ShoppingBag size={24} className="md:w-6 md:h-6" strokeWidth={2} />
                  {mounted && cartCount > 0 && (
                    <span className="absolute top-1 right-1 md:top-0.5 md:right-0.5 bg-accent text-white text-[10px] font-semibold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ring-2 ring-primary">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="bg-primary text-white hidden lg:block">
          <div className="container-custom">
            <ul className="flex items-center justify-center gap-8 py-3 text-sm font-medium">
              <li>
                <Link
                  href="/"
                  className={`hover:text-white/80 transition-colors cursor-pointer border-b-2 py-1 uppercase ${
                    isActive("/") && pathname === "/"
                      ? "border-white text-white"
                      : "border-transparent hover:border-white/60"
                  }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className={`hover:text-white/80 transition-colors cursor-pointer border-b-2 py-1 uppercase ${
                    isActive("/shop")
                      ? "border-white text-white"
                      : "border-transparent hover:border-white/60"
                  }`}
                >
                  All Products
                </Link>
              </li>
              {categories.slice(0, 3).map((cat) => (
                <li key={cat._id} className="group relative py-1">
                  <Link
                    href={categoryHref(cat)}
                    className="hover:text-white/80 transition-colors cursor-pointer flex items-center gap-1 uppercase"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/about"
                  className={`hover:text-white/80 transition-colors cursor-pointer border-b-2 py-1 uppercase ${
                    isActive("/about")
                      ? "border-white text-white"
                      : "border-transparent hover:border-white/60"
                  }`}
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className={`hover:text-white/80 transition-colors cursor-pointer border-b-2 py-1 uppercase ${
                    isActive("/contact")
                      ? "border-white text-white"
                      : "border-transparent hover:border-white/60"
                  }`}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Mobile Search */}
        <div className="md:hidden bg-primary px-4 pb-2">
          <form
            onSubmit={handleSearch}
            className="flex items-center bg-white rounded overflow-hidden"
          >
            <input
              type="text"
              placeholder="I'm looking for..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 text-text-body focus:outline-none text-sm"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark p-2 text-white"
            >
              <Search size={18} />
            </button>
          </form>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className={isScrolled ? "h-[70px]" : "h-[100px] md:h-[150px] lg:h-[160px]"} />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black z-[60]"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white z-[70] p-6 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {settings?.logo ? (
                    <div className="h-12 w-40 relative">
                      <Image
                        src={settings.logo}
                        alt={settings.shopName || "Miraly Foods"}
                        fill
                        sizes="160px"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-lg font-serif font-bold text-text-heading">
                      {settings?.shopName || "Miraly Foods"}
                    </span>
                  )}
                  {settings?.logo2 && (
                    <div className="h-10 w-10 relative flex-shrink-0">
                      <Image src={settings.logo2} alt="Secondary Logo" fill sizes="40px" className="object-contain" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-text-body"
                >
                  <X size={24} />
                </button>
              </div>

              <ul className="flex flex-col gap-4 text-text-heading font-medium">
                <li className="pb-2 border-b border-gray-100">
                  <Link href="/" onClick={() => setIsMenuOpen(false)}>
                    Home
                  </Link>
                </li>
                <li className="pb-2 border-b border-gray-100 text-primary">
                  <Link href="/shop" onClick={() => setIsMenuOpen(false)}>
                    All Products
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    className="pb-2 border-b border-gray-100 flex justify-between items-center"
                  >
                    <Link
                      href={categoryHref(cat)}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li className="pb-2 border-b border-gray-100">
                  <Link href="/about" onClick={() => setIsMenuOpen(false)}>
                    About Us
                  </Link>
                </li>
                <li className="pb-2 border-b border-gray-100">
                  <Link href="/contact" onClick={() => setIsMenuOpen(false)}>
                    Contact Us
                  </Link>
                </li>
              </ul>

              <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-3">
                <Link
                  href={
                    session
                      ? session.user.role === "admin"
                        ? "/admin/dashboard"
                        : "/profile"
                      : "/login"
                  }
                  className="flex items-center gap-3 text-text-heading font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} />{" "}
                  {session
                    ? session.user.role === "admin"
                      ? "Admin Dashboard"
                      : "My Profile"
                    : "Login / Register"}
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 text-text-heading font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Heart size={20} /> Wishlist
                  {mounted && wishlistCount > 0 && (
                    <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
