import { Metadata } from "next";
import { cache } from "react";
import connectDB from "@/lib/mongodb";
import Page from "@/models/Page";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import { Calendar, FileText, Shield, Lock, RotateCcw, Truck, ScrollText } from "lucide-react";

// Force dynamic rendering to avoid build-time database timeouts
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// React cache() deduplicates across generateMetadata + page render
const getPageData = cache(async (slug: string) => {
  await connectDB();
  const page = await Page.findOne({ slug }).lean();
  return page ? JSON.parse(JSON.stringify(page)) : null;
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageData(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: `${page.title} | Miraly Foods`,
    description: page.content.substring(0, 160).replace(/<[^>]*>/g, ""),
  };
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageData(slug);

  if (!page) {
    notFound();
  }

  const iconMap: Record<string, any> = {
    privacy: Lock,
    terms: ScrollText,
    returns: RotateCcw,
    shipping: Truck,
  };
  const PageIcon = iconMap[slug] || FileText;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-28 md:pt-44 pb-6 md:pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-lg mb-4 md:mb-6">
            <PageIcon className="text-primary" size={28} />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-primary-dark mb-3 md:mb-4">
            {page.title}
          </h1>
          {page.lastUpdated && (
            <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
              <Calendar size={16} />
              <span>
                Last updated:{" "}
                {new Date(page.lastUpdated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="py-8 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">


            {/* Content Body — styled via .cms-prose rules in globals.css
                (the prose-* classes don't take effect because the
                @tailwindcss/typography plugin is not installed). */}
            <div className="p-6 md:p-12">
              <div
                className="cms-prose"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              If you have any questions about this policy, please{" "}
              <a
                href="/contact"
                className="text-accent font-semibold hover:underline"
              >
                contact us
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
