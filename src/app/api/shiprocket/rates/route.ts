import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import Product from "@/models/Product";
import ShippingRate from "@/models/ShippingRate";
import {
  quoteShippingForCart,
} from "@/lib/shiprocket";

interface CartItemInput {
  productId: string;
  qty: number;
}

interface RateRequest {
  pincode: string;
  state?: string;
  cod?: boolean;
  items: CartItemInput[];
  declaredValue?: number;
}

interface FlatRateResult {
  source: "flat";
  rate: number | null;
  estimatedDelivery?: string;
  courierName?: string;
  available: boolean;
  reason?: string;
}

interface ShiprocketRateResult {
  source: "shiprocket";
  rate: number;
  courierName: string;
  estimatedDelivery?: string;
  available: true;
}

type RateResult = FlatRateResult | ShiprocketRateResult;

async function flatRateFor(state?: string): Promise<FlatRateResult> {
  if (!state) {
    return { source: "flat", rate: null, available: false, reason: "no_state" };
  }
  let location = "Other States";
  if (state === "Tamil Nadu") location = "Tamil Nadu";
  else if (state === "Puducherry") location = "Puducherry";
  const r = await ShippingRate.findOne({ location });
  if (!r) {
    return { source: "flat", rate: null, available: false, reason: "no_rate" };
  }
  return {
    source: "flat",
    rate: r.rate,
    estimatedDelivery: r.estimatedDelivery,
    available: true,
  };
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = (await req.json()) as RateRequest;
    if (!body.pincode || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "pincode and items are required" },
        { status: 400 },
      );
    }

    const settings = await Settings.findOne();
    const sr = settings?.shiprocket;
    const wantsLive = sr?.enabled && sr?.rateMode === "shiprocket";

    if (!wantsLive) {
      const flat = await flatRateFor(body.state);
      return NextResponse.json(flat);
    }

    // Resolve weight from cart items
    const ids = Array.from(new Set(body.items.map((i) => i.productId)));
    const products = await Product.find({ _id: { $in: ids } })
      .select("_id weight")
      .lean();
    const weightMap = new Map<string, number>(
      products.map((p: any) => [String(p._id), Number(p.weight) || 0]),
    );
    const defaultWeight = sr.defaultWeight || 0.5;
    let totalWeight = 0;
    for (const item of body.items) {
      const w = weightMap.get(item.productId) || defaultWeight;
      totalWeight += w * item.qty;
    }
    if (totalWeight <= 0) totalWeight = defaultWeight;

    try {
      const quote = await quoteShippingForCart({
        deliveryPincode: body.pincode,
        totalWeightKg: Number(totalWeight.toFixed(3)),
        cod: !!body.cod,
        declaredValue: body.declaredValue,
      });
      if (!quote) {
        const flat = await flatRateFor(body.state);
        return NextResponse.json({ ...flat, fallback: "no_courier" });
      }
      const result: ShiprocketRateResult = {
        source: "shiprocket",
        rate: quote.rate,
        courierName: quote.courierName,
        estimatedDelivery:
          quote.estimatedDeliveryDays || quote.etd || undefined,
        available: true,
      };
      return NextResponse.json(result);
    } catch (err: any) {
      console.warn(
        "[shiprocket rates] live lookup failed, falling back to flat:",
        err?.message || err,
      );
      const flat = await flatRateFor(body.state);
      return NextResponse.json({ ...flat, fallback: "api_error" });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Rate calculation failed" },
      { status: 500 },
    );
  }
}
