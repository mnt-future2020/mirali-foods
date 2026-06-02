"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { useNavbarData } from "@/context/NavbarDataContext";

export default function Footer() {
  const { settings } = useNavbarData();

  return (
    <footer className="bg-primary text-white pt-10 md:pt-16 pb-6 md:pb-8 print:hidden">
      <div className="container-custom">
        {/* Google Map */}
        {settings?.googleMapEmbedUrl && (() => {
          let mapSrc = settings.googleMapEmbedUrl.trim();
          const srcMatch = mapSrc.match(/src=["']([^"']+)["']/);
          if (srcMatch) mapSrc = srcMatch[1];
          if (!mapSrc.startsWith("https://")) return null;
          return (
            <div className="mb-6 md:mb-12 rounded-lg overflow-hidden">
              <iframe
                src={mapSrc}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Store Location"
                className="w-full h-[200px] md:h-[300px]"
              />
            </div>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-16">
          {/* Brand Info */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-1">
              {settings?.logo ? (
                <div className="h-14 w-32 relative flex-shrink-0">
                  <Image
                    src={settings.logo}
                    alt={settings.shopName || "Miraly Foods"}
                    fill
                    sizes="128px"
                    className="object-contain object-left"
                  />
                </div>
              ) : (
                <span className="text-2xl font-serif font-bold text-white">
                  {settings?.shopName || "Miraly Foods"}
                </span>
              )}
              {settings?.logo2 && (
                <div className="h-14 w-32 relative flex-shrink-0">
                  <Image
                    src={settings.logo2}
                    alt="Secondary Logo"
                    fill
                    sizes="128px"
                    className="object-contain object-left"
                  />
                </div>
              )}
            </Link>
            <p className="text-white/90 text-sm leading-relaxed">
              Quality food products crafted with care. We believe in bringing the
              finest ingredients to your table, ensuring freshness and purity in
              every product.
            </p>
          </div>

          {/* Contact Us */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-serif font-bold text-white border-b border-white/20 pb-4">
              Contact Us
            </h3>
            <div className="text-sm text-white/90 leading-relaxed flex flex-col gap-2">
              <p>If you have any question, please contact us at:</p>
              {settings?.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="text-white hover:text-white/80 transition-colors"
                >
                  {settings.contactEmail}
                </a>
              )}
              {settings?.contactPhone && (
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="text-white hover:text-white/80 transition-colors"
                >
                  {settings.contactPhone}
                </a>
              )}
              <p className="mt-4 font-bold text-white uppercase tracking-wider">
                Store Location
              </p>
              <p>{settings?.address || "Salem District, Tamil Nadu, India"}</p>
              <div className="flex gap-4 mt-2">
                {settings?.socialMedia?.instagram && (
                  <a
                    href={settings.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Instagram size={16} />
                  </a>
                )}
                {settings?.socialMedia?.facebook && (
                  <a
                    href={settings.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Facebook size={16} />
                  </a>
                )}
                {settings?.socialMedia?.twitter && (
                  <a
                    href={settings.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Twitter size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-serif font-bold text-white border-b border-white/20 pb-4">
              Quick Links
            </h3>
            <ul className="text-sm text-white/90 flex flex-col gap-3">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-white/80 cursor-pointer transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white/80 cursor-pointer transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="hover:text-white/80 cursor-pointer transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/return-and-refund"
                  className="hover:text-white/80 cursor-pointer transition-colors"
                >
                  Return & Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="hover:text-white/80 cursor-pointer transition-colors"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-white/80 cursor-pointer transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/70">
          <p>
            &copy; {new Date().getFullYear()} Miraly Foods. All Rights Reserved.
          </p>
          <p>
            Powered by{" "}
            <span className="text-white">Developed by MnT</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
