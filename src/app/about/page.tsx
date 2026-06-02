import { getSettings } from "@/lib/data";
import AboutPublicClient from "./AboutPublicClient";

export const metadata = {
  title: "About Us | Miraly Foods",
  description: "Learn about the heritage, philosophy, and culinary journey of Miraly Foods.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getSettings();

  return <AboutPublicClient initialAboutUs={settings.aboutUs} />;
}
