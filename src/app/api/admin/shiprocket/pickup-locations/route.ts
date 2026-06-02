import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { listPickupLocations, ShiprocketError } from "@/lib/shiprocket";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const locations = await listPickupLocations();
    return NextResponse.json({ locations });
  } catch (error: any) {
    const httpStatus = error instanceof ShiprocketError ? error.httpStatus : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to load pickup locations" },
      { status: httpStatus },
    );
  }
}
