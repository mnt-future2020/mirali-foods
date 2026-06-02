import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import connectDB from "@/lib/mongodb";
import Page from "@/models/Page";

export default async function GenericPageComponent({ slug }: { slug: string }) {
  await connectDB();
  const pageDoc = await Page.findOne({ slug }).lean();
  const page = pageDoc ? JSON.parse(JSON.stringify(pageDoc)) : null;

  if (!page) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl font-serif font-bold text-gray-400 mb-4 tracking-tighter">
            Content Coming Soon
          </h1>
          <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">
            We are updating our policies. Please check back later.
          </p>
          <a
            href="/"
            className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px]"
          >
            Back Home
          </a>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      {/* Header */}
      <div className="bg-secondary/10 pt-28 md:pt-40 pb-10 md:pb-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-black text-primary-dark tracking-tighter mb-4 capitalize leading-tight">
            {page.title}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Last Updated:{" "}
            {new Date(page.lastUpdated).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Content Body — styled via .cms-prose rules in globals.css (avoids
          @tailwindcss/typography dependency and JIT scanning quirks with
          long arbitrary-selector class lists). */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 pb-16 md:pb-32">
        <div
          className="cms-prose"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
      <Footer />
    </main>
  );
}
