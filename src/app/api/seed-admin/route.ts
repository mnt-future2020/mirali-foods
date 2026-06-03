import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { client } from "@/lib/mongodb-client";

/**
 * Seed Admin User API Route
 * Creates the admin user via better-auth so the password hash is compatible
 * with better-auth's login verification.
 *
 * Usage (one-time bootstrap):
 *   POST /api/seed-admin   with header  x-seed-secret: <SEED_SECRET>
 *
 * SECURITY:
 *   - Disabled unless the SEED_SECRET env var is set AND supplied in the
 *     x-seed-secret header (compared in constant time).
 *   - POST only, so crawlers / prefetch / <img> tags can't trigger it.
 *   - Non-destructive: if the admin already exists it does nothing.
 *   - Never returns the password.
 *   - Delete this file once the admin account exists.
 */

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    const SEED_SECRET = process.env.SEED_SECRET;
    const provided = req.headers.get("x-seed-secret") || "";

    if (!SEED_SECRET || !secretMatches(provided, SEED_SECRET)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@miralyfoods.com";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    // Refuse to create an admin with a hardcoded/default password.
    if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Set the ADMIN_PASSWORD env var (min 8 chars) before seeding the admin.",
        },
        { status: 400 }
      );
    }

    const db = client.db();
    const usersCollection = db.collection("user");

    // Non-destructive: never delete an existing admin from an HTTP call.
    const existingAdmin = await usersCollection.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin already exists. To reset it, delete this user in MongoDB (Atlas) and call this route again, or change the password from the admin UI.",
          admin: { email: existingAdmin.email, role: existingAdmin.role },
        },
        { status: 409 }
      );
    }

    // Create the user through better-auth (hashes the password correctly).
    await auth.api.signUpEmail({
      body: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: "Admin",
      },
    });

    // Promote to admin and mark the email verified.
    await usersCollection.updateOne(
      { email: ADMIN_EMAIL },
      { $set: { role: "admin", emailVerified: true, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      admin: { email: ADMIN_EMAIL, role: "admin" },
      loginUrl: "/admin/login",
    });
  } catch (error: any) {
    console.error("Seed admin error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to seed admin",
      },
      { status: 500 }
    );
  }
}
