import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import BrandAbout from "@/components/BrandAbout";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import TrustSection from "@/components/TrustSection";
import PromoSection from "@/components/PromoSection";
import BannerRow from "@/components/BannerRow";
import BeforeAfter from "@/components/BeforeAfter";
import GoogleReviewsCarousel from "@/components/GoogleReviewsCarousel";
import Footer from "@/components/Footer";
import { getHeroSlides, getCategories, getFeaturedProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

async function HeroSection() {
  const heroSlides = await getHeroSlides();
  return <HeroCarousel initialSlides={heroSlides} />;
}

async function CategoriesSection() {
  const categories = await getCategories();
  return <CategorySection initialCategories={categories} />;
}

async function ProductsSection() {
  const products = await getFeaturedProducts(8);
  return <FeaturedProducts initialProducts={products} />;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <Suspense
        fallback={
          <div className="h-[200px] md:h-[400px] bg-gray-100 animate-pulse" />
        }
      >
        <HeroSection />
      </Suspense>

      <BrandAbout />

      <Suspense
        fallback={<div className="h-96 bg-white animate-pulse" />}
      >
        <ProductsSection />
      </Suspense>

      <Suspense
        fallback={<div className="h-64 bg-gray-50 animate-pulse" />}
      >
        <CategoriesSection />
      </Suspense>

      <PromoSection />

      <TrustSection />

      <BannerRow />

      <BeforeAfter />

      <GoogleReviewsCarousel />

      <Footer />
    </main>
  );
}
