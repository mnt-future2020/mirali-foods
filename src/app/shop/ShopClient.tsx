"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Filter,
  Search as SearchIcon,
  ChevronDown,
  ShoppingCart,
  Loader2,
  Heart,
  Eye,
  X,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSearchParams } from "next/navigation";

export default function ShopClient({
  initialProducts,
  initialCategories,
  initialManageInventory,
}: {
  initialProducts: any[];
  initialCategories: any[];
  initialManageInventory: boolean;
}) {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  // URLs use category slugs (e.g. ?category=rice-flour). Convert to the
  // category name for the in-memory filter, which matches on p.category === name.
  // Fallback to the raw value preserves any legacy bookmarks that still use names.
  const resolveCategory = useCallback(
    (value: string) => {
      if (!value) return "All";
      const bySlug = initialCategories.find((c: any) => c.slug === value);
      if (bySlug) return bySlug.name;
      const byName = initialCategories.find((c: any) => c.name === value);
      return byName ? byName.name : "All";
    },
    [initialCategories]
  );
  const urlCategory = resolveCategory(searchParams.get("category") || "");
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [products] = useState<any[]>(initialProducts);
  const [categories] = useState<any[]>(initialCategories);
  const [loading] = useState(false);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);

  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [activeSubCategory, setActiveSubCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [sortBy, setSortBy] = useState("menu_order");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, val: number) =>
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, val) }));
  const itemsPerPage = 12;

  useEffect(() => {
    setActiveCategory(resolveCategory(searchParams.get("category") || ""));
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams, resolveCategory]);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (activeCategory === "All") {
        setSubCategories([]);
        setActiveSubCategory("All");
        return;
      }
      setLoadingSubCategories(true);
      try {
        const category = categories.find((c) => c.name === activeCategory);
        if (category) {
          const res = await fetch(
            `/api/admin/subcategories?categoryId=${category._id}`
          );
          const data = await res.json();
          setSubCategories(data);
          setActiveSubCategory("All");
        }
      } catch (error) {
        console.error("Failed to fetch subcategories", error);
        setSubCategories([]);
      } finally {
        setLoadingSubCategories(false);
      }
    };
    fetchSubCategories();
  }, [activeCategory, categories]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          activeCategory === "All" || p.category === activeCategory;
        const matchesSubCategory =
          activeSubCategory === "All" ||
          (p.subCategory &&
            (p.subCategory === activeSubCategory ||
              p.subCategory._id === activeSubCategory));
        const matchesSearch = p.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesPrice =
          p.price >= priceRange[0] && p.price <= priceRange[1];
        return matchesCategory && matchesSubCategory && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === "price") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "date")
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        return 0;
      });
  }, [products, activeCategory, activeSubCategory, searchQuery, priceRange, sortBy]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="bg-white">
      {/* Breadcrumb Hero Banner */}
      <section className="relative w-full h-[300px] flex items-center overflow-hidden">
        <Image
          src="https://6dfa0433ff.imgdist.com/pub/bfra/9ghkfuy7/iaz/rth/7n3/turmeric-1-1024x683_1.jpg"
          alt="Shop Banner"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-white"
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 text-white">
              Shop
            </h1>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <span className="w-4 h-[1px] bg-white" />
              <span className="text-white font-bold">Shop</span>
            </nav>
          </motion.div>
        </div>
      </section>

      {/* Search Bar (below hero) */}
      <div className="container-custom py-6">
        <div className="relative max-w-md">
          <SearchIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-body/40"
            size={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search products..."
            className="w-full bg-white border border-gray-200 rounded py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-primary transition-all text-text-heading placeholder:text-text-body/40"
          />
        </div>
      </div>

      {/* Main Layout */}
      <div className="container-custom py-8 md:py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-10 lg:w-1/4 flex-shrink-0">
            {/* Product Categories */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
              <h2 className="text-xl font-serif font-bold mb-6 pb-2 border-b border-gray-100">
                Product categories
              </h2>
              <ul className="flex flex-col gap-3">
                <li>
                  <button
                    onClick={() => {
                      setActiveCategory("All");
                      setActiveSubCategory("All");
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left text-sm transition-colors flex items-center justify-between group ${
                      activeCategory === "All"
                        ? "text-primary font-bold"
                        : "text-text-body hover:text-primary"
                    }`}
                  >
                    All Products
                    <span
                      className={`text-[10px] px-2 py-1 rounded transition-colors ${
                        activeCategory === "All"
                          ? "bg-primary text-white"
                          : "bg-gray-50 text-gray-400 group-hover:bg-primary group-hover:text-white"
                      }`}
                    >
                      ({products.length})
                    </span>
                  </button>
                </li>
                {categories.map((cat) => {
                  const count = products.filter(
                    (p) => p.category === cat.name
                  ).length;
                  return (
                    <li key={cat._id}>
                      <button
                        onClick={() => {
                          setActiveCategory(cat.name);
                          setActiveSubCategory("All");
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left text-sm transition-colors flex items-center justify-between group ${
                          activeCategory === cat.name
                            ? "text-primary font-bold"
                            : "text-text-body hover:text-primary"
                        }`}
                      >
                        {cat.name}
                        <span
                          className={`text-[10px] px-2 py-1 rounded transition-colors ${
                            activeCategory === cat.name
                              ? "bg-primary text-white"
                              : "bg-gray-50 text-gray-400 group-hover:bg-primary group-hover:text-white"
                          }`}
                        >
                          ({count})
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Subcategories */}
              {activeCategory !== "All" && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-text-heading mb-3">
                    Sub Categories
                  </h3>
                  {loadingSubCategories ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2
                        size={16}
                        className="animate-spin text-primary/40"
                      />
                    </div>
                  ) : subCategories.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      <li>
                        <button
                          onClick={() => {
                            setActiveSubCategory("All");
                            setCurrentPage(1);
                          }}
                          className={`text-sm transition-colors ${
                            activeSubCategory === "All"
                              ? "text-primary font-bold"
                              : "text-text-body hover:text-primary"
                          }`}
                        >
                          All {activeCategory}
                        </button>
                      </li>
                      {subCategories.map((sub) => (
                        <li key={sub._id}>
                          <button
                            onClick={() => {
                              setActiveSubCategory(sub._id);
                              setCurrentPage(1);
                            }}
                            className={`text-sm transition-colors ${
                              activeSubCategory === sub._id
                                ? "text-primary font-bold"
                                : "text-text-body hover:text-primary"
                            }`}
                          >
                            {sub.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-body/50 italic">
                      No subcategories
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Filter by Price */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
              <h2 className="text-xl font-serif font-bold mb-6 pb-2 border-b border-gray-100">
                Filter by price
              </h2>
              <div className="flex flex-col gap-6">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="w-full accent-primary h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-text-heading">
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="bg-primary text-white px-4 py-1.5 rounded-sm text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors"
                  >
                    Filter
                  </button>
                  <p className="text-gray-400 font-medium">
                    Price:{" "}
                    <span className="text-text-heading">
                      ₹{priceRange[0]} — ₹{priceRange[1]}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Featured Banner */}
            <div className="rounded-lg overflow-hidden relative group cursor-pointer aspect-square">
              <Image
                src="https://6dfa0433ff.imgdist.com/pub/bfra/9ghkfuy7/oss/lad/169/spice-up-your-curry-with-aromatic-seasonings-generated-by-ai_188544-20552.jpg"
                alt="Fresh Products"
                fill
                sizes="25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-6">
                <p className="text-white font-bold text-lg leading-tight">
                  100% Fresh &amp; Natural
                  <br />
                  <span className="text-accent text-sm font-normal">
                    Guaranteed Quality
                  </span>
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:w-3/4 flex-grow flex flex-col gap-8">
            {/* Mobile Categories Toggle */}
            <div className="lg:hidden flex flex-col gap-4">
              <button
                onClick={() => setShowMobileCategories(!showMobileCategories)}
                className="w-full flex items-center justify-between bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider shadow-md"
              >
                <span className="flex items-center gap-2">
                  <Filter size={18} /> Categories
                </span>
                <ChevronDown
                  size={18}
                  className={`transition-transform ${showMobileCategories ? "rotate-180" : ""}`}
                />
              </button>

              {showMobileCategories && (
                <div className="bg-white border border-gray-100 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 shadow-inner max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setActiveCategory("All");
                      setActiveSubCategory("All");
                      setCurrentPage(1);
                      setShowMobileCategories(false);
                    }}
                    className={`text-left text-sm py-2 px-3 rounded transition-colors ${
                      activeCategory === "All"
                        ? "bg-primary text-white"
                        : "text-text-body hover:bg-gray-50"
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => {
                        setActiveCategory(cat.name);
                        setActiveSubCategory("All");
                        setCurrentPage(1);
                        setShowMobileCategories(false);
                      }}
                      className={`text-left text-sm py-2 px-3 rounded transition-colors ${
                        activeCategory === cat.name
                          ? "bg-primary text-white"
                          : "text-text-body hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm font-medium text-text-body">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredProducts.length
                )}
                –
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
                of {filteredProducts.length} results
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 w-full md:w-auto">
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-sm font-bold text-text-heading uppercase hidden sm:block">
                    Sort by:
                  </span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="appearance-none bg-gray-50 border border-gray-200 rounded px-4 py-1.5 pr-10 text-sm focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="menu_order">Default sorting</option>
                      <option value="date">Sort by latest</option>
                      <option value="price">Sort by price: low to high</option>
                      <option value="price-desc">
                        Sort by price: high to low
                      </option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-body"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 border-l border-gray-200 pl-3 md:pl-6">
                  <span className="text-sm font-bold text-text-heading uppercase hidden sm:block">
                    View:
                  </span>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === "list"
                        ? "bg-primary text-white"
                        : "text-text-body hover:bg-gray-100"
                    }`}
                  >
                    <List size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === "grid"
                        ? "bg-primary text-white"
                        : "text-text-body hover:bg-gray-100"
                    }`}
                  >
                    <LayoutGrid size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-4 space-y-4 border border-gray-100"
                  >
                    <div className="aspect-square bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-lg border border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-text-body/30">
                  <LayoutGrid size={32} />
                </div>
                <h3 className="text-lg font-serif font-bold text-text-heading mb-2">
                  No Products Found
                </h3>
                <p className="text-text-body text-sm max-w-xs mx-auto">
                  We couldn&apos;t find any products matching your filters. Try
                  adjusting them!
                </p>
                <button
                  onClick={() => {
                    setActiveCategory("All");
                    setActiveSubCategory("All");
                    setPriceRange([0, 2000]);
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="mt-6 btn-primary inline-flex"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`grid gap-6 md:gap-8 ${
                    viewMode === "grid"
                      ? "grid-cols-2 md:grid-cols-3"
                      : "grid-cols-1"
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {paginatedProducts.map((p, idx) => (
                      <motion.div
                        layout
                        key={p._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                          <Link
                            href={`/shop/${p.slug || p._id}`}
                            className="absolute inset-0 block"
                          >
                            <Image
                              src={
                                p.images?.[0] ||
                                "https://via.placeholder.com/400x400?text=No+Image"
                              }
                              alt={p.name}
                              fill
                              sizes="(max-width: 768px) 50vw, 33vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              priority={idx < 4}
                            />
                          </Link>

                          {/* Discount Badge */}
                          {p.mrp && p.mrp > p.price && (
                            <div className="absolute top-3 left-3 bg-primary text-white px-2 py-1 rounded text-[10px] font-bold">
                              {Math.round(
                                ((p.mrp - p.price) / p.mrp) * 100
                              )}
                              % OFF
                            </div>
                          )}

                          {/* Hover Actions (always visible on mobile) */}
                          <div className="absolute top-3 right-3 md:top-4 md:right-4 flex flex-col gap-2 opacity-100 translate-x-0 md:opacity-0 md:translate-x-4 transition-all duration-300 md:group-hover:opacity-100 md:group-hover:translate-x-0">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (isInWishlist(p._id)) {
                                  removeFromWishlist(p._id);
                                } else {
                                  addToWishlist(p);
                                }
                              }}
                              className={`p-2 rounded-full shadow-sm transition-colors ${
                                isInWishlist(p._id)
                                  ? "bg-primary text-white"
                                  : "bg-white text-text-body hover:bg-primary hover:text-white"
                              }`}
                              aria-label="Add to wishlist"
                            >
                              <Heart
                                size={18}
                                fill={
                                  isInWishlist(p._id) ? "currentColor" : "none"
                                }
                              />
                            </button>
                            <Link
                              href={`/shop/${p.slug || p._id}`}
                              className="hidden md:flex items-center justify-center bg-white p-2 rounded-full text-text-body hover:bg-primary hover:text-white transition-colors shadow-sm"
                              aria-label="Quick view"
                            >
                              <Eye size={18} />
                            </Link>
                          </div>

                        </div>

                        {/* Quantity and Add to Cart Row */}
                        <div className="flex gap-2 p-4 pb-0">
                          <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-sm px-4 py-2 border border-gray-100">
                            <button
                              onClick={() => setQty(p._id, getQty(p._id) - 1)}
                              className="text-text-body hover:text-primary transition-colors h-full flex items-center"
                            >
                              <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="text-sm font-bold text-text-heading mx-2">
                              {getQty(p._id)}
                            </span>
                            <button
                              onClick={() => setQty(p._id, getQty(p._id) + 1)}
                              className="text-text-body hover:text-primary transition-colors h-full flex items-center"
                            >
                              <Plus size={14} strokeWidth={3} />
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              if (p.variants && p.variants.length > 0) {
                                const bestVariant = p.variants[0];
                                addToCart(
                                  {
                                    ...p,
                                    price: bestVariant.price,
                                    uom: bestVariant.uom,
                                  },
                                  getQty(p._id)
                                );
                              } else {
                                addToCart(p, getQty(p._id));
                              }
                              setQty(p._id, 1);
                            }}
                            className="bg-primary text-white p-3 rounded-sm hover:bg-primary-dark transition-colors shadow-md flex items-center justify-center aspect-square"
                          >
                            <ShoppingCart size={18} />
                          </button>
                        </div>

                        <Link
                          href={`/shop/${p.slug || p._id}`}
                          className="block p-4 text-center"
                        >
                          {p.category && (
                            <p className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1">
                              {typeof p.category === "object"
                                ? p.category.name
                                : p.category}
                            </p>
                          )}
                          <h3 className="text-sm font-sans font-semibold text-text-heading mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                            {p.name}
                          </h3>
                          <p className="text-primary font-bold">
                            ₹{p.price}
                            {p.mrp && p.mrp > p.price && (
                              <span className="text-text-body/50 text-xs line-through ml-2 font-normal">
                                ₹{p.mrp}
                              </span>
                            )}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12 pb-20">
                    <ul className="flex items-center gap-2">
                      {currentPage > 1 && (
                        <li>
                          <button
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="w-10 h-10 flex items-center justify-center rounded bg-white text-text-body hover:bg-primary hover:text-white transition-all font-bold border border-gray-200"
                          >
                            <ChevronLeft size={16} />
                          </button>
                        </li>
                      )}
                      {[...Array(totalPages)].map((_, i) => (
                        <li key={i}>
                          <button
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-10 h-10 flex items-center justify-center rounded font-bold transition-all ${
                              currentPage === i + 1
                                ? "bg-primary text-white shadow-md"
                                : "bg-white text-text-body hover:bg-primary hover:text-white border border-gray-200"
                            }`}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))}
                      {currentPage < totalPages && (
                        <li>
                          <button
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="px-4 h-10 flex items-center justify-center rounded bg-white text-text-body hover:bg-primary hover:text-white transition-all font-bold border border-gray-200 uppercase text-xs tracking-widest"
                          >
                            Next
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white z-[101] shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-serif font-bold text-text-heading">
                    Filters
                  </h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-text-heading"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8 pb-20">
                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-bold text-text-heading uppercase mb-4">
                      Categories
                    </h3>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setActiveCategory("All");
                          setActiveSubCategory("All");
                          setCurrentPage(1);
                        }}
                        className={`text-left text-sm py-2 px-3 rounded transition-colors ${
                          activeCategory === "All"
                            ? "bg-primary text-white"
                            : "text-text-body hover:bg-gray-50"
                        }`}
                      >
                        All Products
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => {
                            setActiveCategory(cat.name);
                            setActiveSubCategory("All");
                            setCurrentPage(1);
                          }}
                          className={`text-left text-sm py-2 px-3 rounded transition-colors ${
                            activeCategory === cat.name
                              ? "bg-primary text-white"
                              : "text-text-body hover:bg-gray-50"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SubCategories */}
                  {activeCategory !== "All" && subCategories.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-text-heading uppercase mb-4">
                        Sub Categories
                      </h3>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setActiveSubCategory("All");
                            setCurrentPage(1);
                          }}
                          className={`text-left text-sm py-2 px-3 rounded transition-colors ${
                            activeSubCategory === "All"
                              ? "bg-primary text-white"
                              : "text-text-body hover:bg-gray-50"
                          }`}
                        >
                          All {activeCategory}
                        </button>
                        {subCategories.map((sub) => (
                          <button
                            key={sub._id}
                            onClick={() => {
                              setActiveSubCategory(sub._id);
                              setCurrentPage(1);
                            }}
                            className={`text-left text-sm py-2 px-3 rounded transition-colors ${
                              activeSubCategory === sub._id
                                ? "bg-primary text-white"
                                : "text-text-body hover:bg-gray-50"
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div>
                    <h3 className="text-sm font-bold text-text-heading uppercase mb-4">
                      Price Range
                    </h3>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([0, parseInt(e.target.value)])
                      }
                      className="w-full accent-primary h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-3">
                      <span className="text-sm text-gray-400">₹0</span>
                      <span className="text-sm font-bold text-text-heading">
                        Up to ₹{priceRange[1]}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full btn-primary"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
