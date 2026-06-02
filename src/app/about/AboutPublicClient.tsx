"use client";

import Navbar from "@/components/Navbar";
import Image from "next/image";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, Zap, Leaf, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AboutPublicClient({ initialAboutUs }: { initialAboutUs: any }) {
  const aboutUs = initialAboutUs || {};

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb Hero Banner - matches /shop */}
      <section className="relative w-full h-[300px] flex items-center overflow-hidden">
        <Image
          src="https://6dfa0433ff.imgdist.com/pub/bfra/9ghkfuy7/7c2/5zz/0pe/Turmericandchilli.png"
          alt="About Banner"
          fill
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
              About Us
            </h1>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <span className="w-4 h-[1px] bg-white" />
              <span className="text-white font-bold">About</span>
            </nav>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-10 md:py-20">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 text-center lg:text-left"
            >
              <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">
                Our Story
              </span>
              <h2 className="text-4xl lg:text-5xl font-serif font-bold text-text-heading leading-tight mb-6">
                {aboutUs.heroTitle || "Delivering Quality Food Products"}
              </h2>
              <p className="text-lg text-text-body leading-relaxed mb-8">
                {aboutUs.heroDescription ||
                  "Miraly Foods brings you premium quality food products, crafted with the finest ingredients and delivered fresh to your doorstep. We believe that great food starts with great ingredients — sourced responsibly, prepared with care."}
              </p>
              {/* items-center on mobile shrinks rows to content width and
                  centers them as a group (matches centered heading above);
                  lg:items-start reverts to natural left-aligned list on
                  desktop. text-left on each row overrides the inherited
                  text-center so wrapped text reads naturally beside its icon. */}
              <div className="flex flex-col gap-4 items-center lg:items-start">
                {[
                  "Premium Quality Ingredients",
                  "No Artificial Preservatives",
                  "Traditional Recipes, Modern Standards",
                  "Fresh & Hygienic Preparation",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3 font-semibold text-text-heading text-left"
                  >
                    <CheckCircle
                      size={20}
                      className="text-primary fill-primary/10 shrink-0 mt-0.5"
                    />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-1 relative aspect-[4/3] w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src={aboutUs.heroImage || "https://6dfa0433ff.imgdist.com/pub/bfra/9ghkfuy7/7c2/5zz/0pe/Turmericandchilli.png"}
                alt="Our Story"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section - matches homepage Features pattern */}
      <section className="py-10 md:py-20 bg-brand-bg/30">
        <div className="container-custom">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl text-text-heading mb-4 inline-block relative font-serif italic">
              Why Choose Miraly Foods?
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full" />
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Pure & Safe",
                desc: "No artificial colors or preservatives. Just pure, quality ingredients sourced directly from trusted farms.",
                icon: ShieldCheck,
              },
              {
                title: "Made with Love",
                desc: "Every product is crafted with care to maintain the authentic taste that defines our heritage.",
                icon: Heart,
              },
              {
                title: "Fresh Always",
                desc: "Traditional flavors prepared fresh using time-tested methods and delivered directly to you.",
                icon: Zap,
              },
              {
                title: "Farm Sourced",
                desc: "We partner with local farms to ensure every ingredient meets our quality and freshness standards.",
                icon: Leaf,
              },
            ].map((val, i) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center gap-6 p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <val.icon size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 text-text-heading">{val.title}</h3>
                  <p className="text-sm text-text-body leading-relaxed">{val.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-10 md:py-20">
        <div className="container-custom">
          {/* flex-col-reverse on mobile keeps the heading/story above the images
              (reader needs the "Our Journey" context before seeing the photos);
              desktop uses the original images-left, text-right composition. */}
          <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-full flex-1 grid grid-cols-2 gap-4"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg mt-8">
                <Image
                  src={aboutUs.journeyImage1 || "https://images.pexels.com/photos/674483/pexels-photo-674483.jpeg?auto=compress&cs=tinysrgb&w=800"}
                  alt="Quality Ingredients"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src={aboutUs.journeyImage2 || "https://images.pexels.com/photos/1055271/pexels-photo-1055271.jpeg?auto=compress&cs=tinysrgb&w=800"}
                  alt="Our Products"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">
                Our Journey
              </span>
              <h2 className="text-4xl font-serif font-bold text-text-heading mb-4 md:mb-8">
                {aboutUs.journeyTitle || "From Our Family To Yours."}
              </h2>
              <p className="text-lg text-text-body leading-relaxed mb-6 md:mb-10">
                {aboutUs.journeyDescription ||
                  "Miraly Foods started with a simple mission — to bring premium quality food products to every household. Today, we've grown into a trusted name, serving thousands of happy customers across India."}
              </p>
              <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-6 md:pt-10">
                <div>
                  <p className="text-4xl font-bold text-primary mb-1">
                    {aboutUs.happyCustomers || "10k+"}
                  </p>
                  <p className="text-xs font-bold text-text-body uppercase tracking-widest">
                    Happy Customers
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-primary mb-1">
                    {aboutUs.secretRecipes || "50+"}
                  </p>
                  <p className="text-xs font-bold text-text-body uppercase tracking-widest">
                    Quality Products
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section - matches homepage pattern */}
      <section className="py-10 md:py-20 bg-gray-50">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-heading mb-6">
              Ready to taste the difference?
            </h2>
            <p className="text-text-body text-lg mb-10 max-w-2xl mx-auto">
              Explore our range of premium food products and experience quality like never before.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded font-bold uppercase tracking-wider text-sm hover:bg-primary-dark transition-colors"
            >
              Shop Now
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
