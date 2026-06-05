import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { encryptPassword, decryptPassword } from "@/lib/encryption";
import { uploadToCloudinary } from "@/lib/cloudinary";
import Razorpay from "razorpay";
import { revalidateTag } from "next/cache";
import { revalidatePublicData, CACHE_KEYS } from "@/lib/cache";

const MASKED = "********";

// A stored secret looks like "<32-hex iv>:<hex ciphertext>" (see lib/encryption.ts).
// If an already-encrypted value is submitted back on save — e.g. an old/cached
// client that rendered the raw ciphertext instead of the masked dots — treat it
// like MASKED and keep the existing stored value. Re-encrypting ciphertext would
// double-encrypt it, so it would decrypt to garbage and silently break auth.
const isEncrypted = (v: unknown): boolean =>
  typeof v === "string" && /^[0-9a-f]{32}:[0-9a-f]+$/i.test(v);
const isKept = (v: unknown): boolean => v === MASKED || isEncrypted(v);

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne();

    if (settings) {
      const masked = settings.toObject();

      // Migration: Convert old taxRate to taxRates array
      if (
        masked.taxRate !== undefined &&
        (!masked.taxRates || masked.taxRates.length === 0)
      ) {
        masked.taxRates = [
          {
            name: "GST",
            rate: masked.taxRate,
            isDefault: true,
          },
        ];
        // Update in database
        await Settings.findOneAndUpdate(
          {},
          {
            taxRates: masked.taxRates,
            $unset: { taxRate: "" },
          },
        );
      }

      if (masked.payment?.razorpayKeySecret)
        masked.payment.razorpayKeySecret = MASKED;
      if (masked.payment?.razorpayWebhookSecret)
        masked.payment.razorpayWebhookSecret = MASKED;
      if (masked.smtp?.password) masked.smtp.password = MASKED;
      if (masked.googleMyBusiness?.apiKey)
        masked.googleMyBusiness.apiKey = MASKED;
      if (masked.shiprocket?.password) masked.shiprocket.password = MASKED;
      if (masked.shiprocket?.webhookSecret)
        masked.shiprocket.webhookSecret = MASKED;
      // Never expose the cached Shiprocket auth token to the client
      if (masked.shiprocket) {
        delete masked.shiprocket.apiToken;
        delete masked.shiprocket.apiTokenExpiresAt;
      }
      return NextResponse.json(masked);
    }

    return NextResponse.json({});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type");
    let data;

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const rawData = formData.get("data") as string;
      data = JSON.parse(rawData);

      const logoFile = formData.get("logo") as File;
      const faviconFile = formData.get("favicon") as File;

      if (logoFile && logoFile instanceof File) {
        const buffer = Buffer.from(await logoFile.arrayBuffer());
        const base64Image = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
        const result = await uploadToCloudinary(
          base64Image,
          "miralyfoods/brand",
        );
        data.logo = result.secure_url;
      }

      if (faviconFile && faviconFile instanceof File) {
        const buffer = Buffer.from(await faviconFile.arrayBuffer());
        const base64Image = `data:${faviconFile.type};base64,${buffer.toString("base64")}`;
        const result = await uploadToCloudinary(
          base64Image,
          "miralyfoods/brand",
        );
        data.favicon = result.secure_url;
      }
    } else {
      data = await req.json();
    }

    // Upload any base64 images to Cloudinary (prevent MB+ document bloat)
    if (data.logo && data.logo.startsWith("data:")) {
      const logoResult = await uploadToCloudinary(data.logo, "miralyfoods/brand");
      data.logo = logoResult.secure_url;
    }
    if (data.logo2 && data.logo2.startsWith("data:")) {
      const logo2Result = await uploadToCloudinary(data.logo2, "miralyfoods/brand");
      data.logo2 = logo2Result.secure_url;
    }
    if (data.favicon && data.favicon.startsWith("data:")) {
      const faviconResult = await uploadToCloudinary(data.favicon, "miralyfoods/brand");
      data.favicon = faviconResult.secure_url;
    }
    if (data.seo?.ogImage && data.seo.ogImage.startsWith("data:")) {
      const ogResult = await uploadToCloudinary(data.seo.ogImage, "miralyfoods/brand");
      data.seo.ogImage = ogResult.secure_url;
    }

    // Process About Us images
    if (data.aboutUs?.heroImage && data.aboutUs.heroImage.startsWith("data:")) {
      const heroResult = await uploadToCloudinary(data.aboutUs.heroImage, "miralyfoods/about");
      data.aboutUs.heroImage = heroResult.secure_url;
    }
    if (data.aboutUs?.journeyImage1 && data.aboutUs.journeyImage1.startsWith("data:")) {
      const journey1Result = await uploadToCloudinary(data.aboutUs.journeyImage1, "miralyfoods/about");
      data.aboutUs.journeyImage1 = journey1Result.secure_url;
    }
    if (data.aboutUs?.journeyImage2 && data.aboutUs.journeyImage2.startsWith("data:")) {
      const journey2Result = await uploadToCloudinary(data.aboutUs.journeyImage2, "miralyfoods/about");
      data.aboutUs.journeyImage2 = journey2Result.secure_url;
    }
    // Process Our Story image
    if (data.ourStory?.image && data.ourStory.image.startsWith("data:")) {
      const storyResult = await uploadToCloudinary(data.ourStory.image, "miralyfoods/cms");
      data.ourStory.image = storyResult.secure_url;
    }
    // Process Why Choose Us image
    if (data.whyChooseUs?.image && data.whyChooseUs.image.startsWith("data:")) {
      const whyResult = await uploadToCloudinary(data.whyChooseUs.image, "miralyfoods/cms");
      data.whyChooseUs.image = whyResult.secure_url;
    }

    await connectDB();

    // Determine which tab triggered the save
    const saveContext = data._saveContext;
    delete data._saveContext;

    // Handle Sensitive fields
    const existing = await Settings.findOne();

    // Track if Razorpay credentials are actually being changed
    let razorpayCredentialsChanged = false;

    // --- Handle Payment Keys ---
    if (data.payment?.razorpayKeySecret) {
      if (isKept(data.payment.razorpayKeySecret)) {
        data.payment.razorpayKeySecret = existing?.payment?.razorpayKeySecret;
      } else {
        razorpayCredentialsChanged = true;
        data.payment.razorpayKeySecret = encryptPassword(
          data.payment.razorpayKeySecret,
        );
      }
    }

    if (data.payment?.razorpayWebhookSecret) {
      if (isKept(data.payment.razorpayWebhookSecret)) {
        data.payment.razorpayWebhookSecret =
          existing?.payment?.razorpayWebhookSecret;
      } else {
        data.payment.razorpayWebhookSecret = encryptPassword(
          data.payment.razorpayWebhookSecret,
        );
      }
    }

    // --- Validate Razorpay Credentials (only when saving payment tab and credentials changed) ---
    if (
      saveContext === "payment" &&
      razorpayCredentialsChanged &&
      data.payment?.razorpayKeyId &&
      data.payment?.razorpayKeySecret
    ) {
      try {
        const testSecret = decryptPassword(data.payment.razorpayKeySecret);

        const instance = new Razorpay({
          key_id: data.payment.razorpayKeyId,
          key_secret: testSecret,
        });
        await (instance.orders as any).all({ count: 1 });
      } catch (rzpError: any) {
        return NextResponse.json(
          { error: "Invalid Razorpay credentials. Connection test failed." },
          { status: 400 },
        );
      }
    }

    // --- Handle SMTP password ---
    if (data.smtp?.password) {
      if (isKept(data.smtp.password)) {
        data.smtp.password = existing?.smtp?.password;
      } else {
        data.smtp.password = encryptPassword(data.smtp.password);
      }
    }

    // --- Handle Google My Business API Key ---
    if (data.googleMyBusiness?.apiKey) {
      if (isKept(data.googleMyBusiness.apiKey)) {
        data.googleMyBusiness.apiKey = existing?.googleMyBusiness?.apiKey;
      } else {
        data.googleMyBusiness.apiKey = encryptPassword(
          data.googleMyBusiness.apiKey,
        );
      }
    }

    // --- Handle Shiprocket credentials ---
    if (data.shiprocket) {
      // Password: keep existing if masked, else encrypt + invalidate cached token
      if (data.shiprocket.password) {
        if (isKept(data.shiprocket.password)) {
          data.shiprocket.password = existing?.shiprocket?.password;
        } else {
          data.shiprocket.password = encryptPassword(data.shiprocket.password);
          // Force a fresh login on next API call
          data.shiprocket.apiToken = "";
          data.shiprocket.apiTokenExpiresAt = null;
        }
      }
      // Webhook secret
      if (data.shiprocket.webhookSecret) {
        if (isKept(data.shiprocket.webhookSecret)) {
          data.shiprocket.webhookSecret = existing?.shiprocket?.webhookSecret;
        } else {
          data.shiprocket.webhookSecret = encryptPassword(
            data.shiprocket.webhookSecret,
          );
        }
      }
      // Never let the client write the cached token directly
      delete data.shiprocket.apiToken;
      delete data.shiprocket.apiTokenExpiresAt;
      // Preserve the cached token if email didn't change
      if (
        existing?.shiprocket?.apiToken &&
        existing?.shiprocket?.email === data.shiprocket.email &&
        data.shiprocket.password === existing.shiprocket.password
      ) {
        data.shiprocket.apiToken = existing.shiprocket.apiToken;
        data.shiprocket.apiTokenExpiresAt =
          existing.shiprocket.apiTokenExpiresAt;
      }
    }

    // Safety net: never store base64 images in MongoDB
    if (data.logo && data.logo.startsWith("data:")) delete data.logo;
    if (data.logo2 && data.logo2.startsWith("data:")) delete data.logo2;
    if (data.favicon && data.favicon.startsWith("data:")) delete data.favicon;
    if (data.seo?.ogImage && data.seo.ogImage.startsWith("data:")) delete data.seo.ogImage;
    if (data.aboutUs?.heroImage && data.aboutUs.heroImage.startsWith("data:")) delete data.aboutUs.heroImage;
    if (data.aboutUs?.journeyImage1 && data.aboutUs.journeyImage1.startsWith("data:")) delete data.aboutUs.journeyImage1;
    if (data.aboutUs?.journeyImage2 && data.aboutUs.journeyImage2.startsWith("data:")) delete data.aboutUs.journeyImage2;
    if (data.ourStory?.image && data.ourStory.image.startsWith("data:")) delete data.ourStory.image;
    if (data.whyChooseUs?.image && data.whyChooseUs.image.startsWith("data:")) delete data.whyChooseUs.image;

    const settings = await Settings.findOneAndUpdate({}, data, {
      returnDocument: "after",
      upsert: true,
    });

    const response = settings.toObject();
    if (response.payment?.razorpayKeySecret)
      response.payment.razorpayKeySecret = MASKED;
    if (response.payment?.razorpayWebhookSecret)
      response.payment.razorpayWebhookSecret = MASKED;
    if (response.smtp?.password) response.smtp.password = MASKED;
    if (response.googleMyBusiness?.apiKey)
      response.googleMyBusiness.apiKey = MASKED;
    if (response.shiprocket?.password) response.shiprocket.password = MASKED;
    if (response.shiprocket?.webhookSecret)
      response.shiprocket.webhookSecret = MASKED;
    if (response.shiprocket) {
      delete response.shiprocket.apiToken;
      delete response.shiprocket.apiTokenExpiresAt;
    }

    revalidatePublicData([CACHE_KEYS.SEO, CACHE_KEYS.NAVBAR, CACHE_KEYS.SETTINGS_PUBLIC]);
    revalidateTag("seo-settings", "default");
    revalidateTag("navbar-data", "default");
    revalidateTag("settings-public", "default");

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT method for updating settings
export async function PUT(req: Request) {
  return POST(req); // Reuse POST logic
}
