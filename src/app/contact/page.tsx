"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Users,
  Calendar,
  Briefcase,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavbarData } from "@/context/NavbarDataContext";
import { validateForm, contactSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

export default function ContactPage() {
  const { settings } = useNavbarData();
  const [activeTab, setActiveTab] = useState<"general" | "corporate">(
    "general",
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    type: "General Inquiry",
    message: "",
    date: "",
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = validateForm(contactSchema, formData);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      setLoading(false);
      return;
    }
    setFieldErrors({});

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          type:
            activeTab === "general" ? "General Inquiry" : "Corporate Booking",
          message: "",
          date: "",
        });
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfos = [
    {
      title: "Visit Us",
      content:
        settings?.address ||
        "177/2, Kaligoundanur, Vellar Post, Mettur Taluk, Salem District - 636451",
      icon: MapPin,
    },
    {
      title: "WhatsApp / Call Us",
      content: settings?.contactPhone || "+91 8754744204",
      icon: Phone,
    },
    {
      title: "Email Us",
      content: settings?.contactEmail || "miracmartcare@gmail.com",
      icon: Mail,
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb Hero Banner */}
      <section className="relative w-full h-[300px] flex items-center overflow-hidden">
        <Image
          src="https://6dfa0433ff.imgdist.com/pub/bfra/9ghkfuy7/uv1/1za/5st/1527661478banner.jpg"
          alt="Contact Banner"
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
              Contact Us
            </h1>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <span className="w-4 h-[1px] bg-white" />
              <span className="text-white font-bold">Contact</span>
            </nav>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-custom py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Contact Info */}
          <div className="lg:col-span-4 space-y-6">
            {contactInfos.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm flex items-start gap-5 border border-gray-100 group hover:border-primary/20 transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                  <item.icon size={22} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-text-heading mb-1">
                    {item.title}
                  </h3>
                  <p className="text-text-body text-sm leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Corporate Services */}
            <div className="bg-primary p-6 rounded-lg text-white relative overflow-hidden">
              <MessageSquare className="absolute -bottom-4 -right-4 w-28 h-28 text-white/5" />
              <h3 className="text-lg font-serif font-bold mb-4">
                Corporate & Events
              </h3>
              <div className="space-y-3 mb-6">
                {[
                  { icon: Briefcase, text: "Corporate Gifting" },
                  { icon: Users, text: "Large Gatherings" },
                  { icon: Calendar, text: "Festival Specials" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <item.icon size={16} className="text-white" />
                    <span className="text-white/90 font-medium">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab("corporate")}
                className="text-xs font-bold uppercase tracking-widest text-white hover:underline"
              >
                Request Quote →
              </button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 md:p-10 rounded-lg shadow-sm border border-gray-100"
            >
              {/* Tab Switcher */}
              <div className="flex gap-3 mb-8 p-1.5 bg-gray-50 rounded-lg">
                <button
                  onClick={() => {
                    setActiveTab("general");
                    setFormData({ ...formData, type: "General Inquiry" });
                  }}
                  className={`flex-1 py-3 rounded-md font-bold text-sm uppercase tracking-wider transition-all ${
                    activeTab === "general"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  General Inquiry
                </button>
                <button
                  onClick={() => {
                    setActiveTab("corporate");
                    setFormData({ ...formData, type: "Corporate Booking" });
                  }}
                  className={`flex-1 py-3 rounded-md font-bold text-sm uppercase tracking-wider transition-all ${
                    activeTab === "corporate"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Corporate / Events
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-body uppercase tracking-wider">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="John Doe"
                      className={`w-full bg-gray-50 border ${fieldErrors.name ? "border-red-300" : "border-gray-200"} focus:border-primary focus:bg-white rounded-lg py-3 px-4 outline-none transition-all text-sm`}
                    />
                    <FormError message={fieldErrors.name} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-body uppercase tracking-wider">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="john@example.com"
                      className={`w-full bg-gray-50 border ${fieldErrors.email ? "border-red-300" : "border-gray-200"} focus:border-primary focus:bg-white rounded-lg py-3 px-4 outline-none transition-all text-sm`}
                    />
                    <FormError message={fieldErrors.email} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-body uppercase tracking-wider">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      placeholder="+91 98765 43210"
                      className={`w-full bg-gray-50 border ${fieldErrors.phone ? "border-red-300" : "border-gray-200"} focus:border-primary focus:bg-white rounded-lg py-3 px-4 outline-none transition-all text-sm`}
                    />
                    <FormError message={fieldErrors.phone} />
                  </div>
                  {activeTab === "corporate" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-body uppercase tracking-wider">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        placeholder="Your Company"
                        className="w-full bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white rounded-lg py-3 px-4 outline-none transition-all text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-body uppercase tracking-wider">
                    {activeTab === "general" ? "Subject" : "Enquiry Type"}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white rounded-lg py-3 px-4 outline-none transition-all text-sm appearance-none cursor-pointer"
                  >
                    {activeTab === "general" ? (
                      <>
                        <option>General Inquiry</option>
                        <option>Order Support</option>
                        <option>Product Question</option>
                        <option>Feedback</option>
                      </>
                    ) : (
                      <>
                        <option>Corporate Booking</option>
                        <option>Event Catering</option>
                        <option>Bulk Order</option>
                        <option>Corporate Gifting</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-body uppercase tracking-wider">
                    Message *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, message: "" }));
                    }}
                    placeholder={
                      activeTab === "general"
                        ? "How can we help you today?"
                        : "Tell us about your event, expected guest count, and requirements..."
                    }
                    className={`w-full bg-gray-50 border ${fieldErrors.message ? "border-red-300" : "border-gray-200"} focus:border-primary focus:bg-white rounded-lg py-3 px-4 outline-none transition-all text-sm resize-none`}
                  />
                  <FormError message={fieldErrors.message} />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-4 text-base group disabled:opacity-70"
                >
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Message{" "}
                      <Send
                        size={18}
                        className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
                      />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
