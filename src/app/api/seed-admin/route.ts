import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { client } from "@/lib/mongodb-client";

/**
 * Seed Admin User API Route
 * Creates an admin user via better-auth so the password hash is compatible
 * with better-auth's login verification.
 *
 * Usage: GET /api/seed-admin?token=<SEED_SECRET>
 *   - Add &force=true to recreate an existing admin (destructive).
 *
 * SECURITY:
 *   - Gated behind the SEED_SECRET env var. If SEED_SECRET is not set, the
 *     route is disabled (returns 403) so it can't be abused.
 *   - Does NOT delete the existing admin unless &force=true is passed.
 *   - Does NOT return the password in the response.
 *   - Delete this file once the admin account exists.
 */

export async function GET(req: Request) {
  try {
    const SEED_SECRET = process.env.SEED_SECRET;
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    // Disabled unless a setup secret is configured AND supplied by the caller.
    if (!SEED_SECRET || token !== SEED_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@miralyfoods.com";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
    const force = url.searchParams.get("force") === "true";

    const db = client.db();
    const usersCollection = db.collection("user");
    const accountsCollection = db.collection("account");

    const existingAdmin = await usersCollection.findOne({ email: ADMIN_EMAIL });

    // Non-destructive by default: never wipe an existing admin unless forced.
    if (existingAdmin && !force) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin user already exists. Pass &force=true to recreate it (this deletes the current admin login).",
          admin: { email: existingAdmin.email, role: existingAdmin.role },
        },
        { status: 200 }
      );
    }

    if (existingAdmin && force) {
      const existingUserId = existingAdmin.id || existingAdmin._id;
      await accountsCollection.deleteMany({ userId: existingUserId });
      await usersCollection.deleteOne({ email: ADMIN_EMAIL });
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
      message: existingAdmin
        ? "Admin user recreated successfully"
        : "Admin user created successfully",
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
