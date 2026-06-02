import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { decryptPassword, encryptPassword } from "@/lib/encryption";
import { loginWith, SHIPROCKET_BASE_URL } from "@/lib/shiprocket";

const MASKED = "********";

// POST /api/admin/shiprocket/test
// Body: { email?, password? } — if omitted, uses the stored credentials.
// Verifies the creds work, persists a fresh token, and returns pickup location count.
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const existing = await Settings.findOne();
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    const email = body.email || existing?.shiprocket?.email;
    let password = body.password;
    if (!password || password === MASKED) {
      const stored = existing?.shiprocket?.password;
      password = stored ? decryptPassword(stored) : undefined;
    }
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const token = await loginWith(email, password);

    // Try to fetch pickup locations as a smoke check
    let pickupLocations: Array<{ id: number; nickname: string; pincode: string; city: string }> = [];
    try {
      const res = await fetch(
        `${SHIPROCKET_BASE_URL}/v1/external/settings/company/pickup`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        pickupLocations = (data?.data?.shipping_address || []).map((x: any) => ({
          id: x.id,
          nickname: x.pickup_location,
          pincode: x.pin_code,
          city: x.city,
        }));
      }
    } catch {
      /* tolerate — auth itself succeeded */
    }

    // Persist token for reuse
    const expiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          "shiprocket.email": email,
          "shiprocket.apiToken": encryptPassword(token),
          "shiprocket.apiTokenExpiresAt": expiresAt,
        },
      },
      { upsert: true },
    );

    return NextResponse.json({
      ok: true,
      pickupLocationCount: pickupLocations.length,
      pickupLocations,
    });
  } catch (error: any) {
    const httpStatus = error?.httpStatus || 400;
    return NextResponse.json(
      { error: error?.message || "Shiprocket connection failed" },
      { status: httpStatus },
    );
  }
}
