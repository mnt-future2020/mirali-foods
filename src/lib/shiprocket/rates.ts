import { cached } from "@/lib/cache";
import { getShiprocketConfig, srFetch } from "./client";
import {
  ShiprocketError,
  ShiprocketServiceabilityCourier,
  ShiprocketServiceabilityResponse,
} from "./types";

const RATE_CACHE_TTL_MS = 5 * 60 * 1000;

export interface ServiceabilityArgs {
  pickupPincode: string;
  deliveryPincode: string;
  weight: number; // kg
  cod?: boolean;
  declaredValue?: number;
}

export interface RateQuote {
  courierName: string;
  courierCompanyId: number;
  rate: number;
  estimatedDeliveryDays?: string;
  etd?: string;
}

export async function getServiceability(
  args: ServiceabilityArgs,
): Promise<RateQuote | null> {
  const { pickupPincode, deliveryPincode, weight, cod = false } = args;
  if (!pickupPincode || !deliveryPincode || !weight) {
    throw new ShiprocketError(
      "INVALID_INPUT",
      "pickupPincode, deliveryPincode and weight are required",
      400,
    );
  }
  const key = `sr-rate:${pickupPincode}:${deliveryPincode}:${weight.toFixed(3)}:${cod ? 1 : 0}`;
  return cached(key, RATE_CACHE_TTL_MS, async () => {
    const params = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: String(weight),
      cod: cod ? "1" : "0",
    });
    if (args.declaredValue) {
      params.set("declared_value", String(args.declaredValue));
    }
    const res = await srFetch<ShiprocketServiceabilityResponse>(
      `/v1/external/courier/serviceability/?${params.toString()}`,
      { method: "GET" },
    );
    const couriers = res?.data?.available_courier_companies || [];
    if (couriers.length === 0) return null;
    const recommendedId =
      res.data.shiprocket_recommended_courier_id ||
      res.data.recommended_courier_company_id ||
      res.data.cheapest_courier_id;
    let chosen: ShiprocketServiceabilityCourier | undefined;
    if (recommendedId) {
      chosen = couriers.find((c) => c.courier_company_id === recommendedId);
    }
    if (!chosen) {
      chosen = [...couriers].sort((a, b) => a.rate - b.rate)[0];
    }
    if (!chosen) return null;
    return {
      courierName: chosen.courier_name,
      courierCompanyId: chosen.courier_company_id,
      rate: Number(chosen.rate),
      estimatedDeliveryDays: chosen.estimated_delivery_days,
      etd: chosen.etd,
    };
  });
}

export interface CourierOption {
  courierCompanyId: number;
  courierName: string;
  rate: number;
  etd?: string;
  estimatedDeliveryDays?: string;
  recommended: boolean;
  mode: string; // "Air" | "Surface"
  rating?: number;
  minWeight?: number;
  rtoCharges?: number;
  chargeableWeight?: number;
  expectedPickup?: string;
  // Flat per-shipment fee Shiprocket adds at billing ("Notify Charges") that
  // the serviceability API does NOT return — surfaced so the displayed total
  // matches what Shiprocket actually bills. Set per order in listCouriersForOrder.
  notifyCharges?: number;
}

// Returns ALL serviceable couriers for manual selection in the admin UI,
// sorted recommended-first then cheapest.
export async function listCouriers(
  args: ServiceabilityArgs,
): Promise<CourierOption[]> {
  const { pickupPincode, deliveryPincode, weight, cod = false } = args;
  if (!pickupPincode || !deliveryPincode || !weight) {
    throw new ShiprocketError(
      "INVALID_INPUT",
      "pickupPincode, deliveryPincode and weight are required",
      400,
    );
  }
  const params = new URLSearchParams({
    pickup_postcode: pickupPincode,
    delivery_postcode: deliveryPincode,
    weight: String(weight),
    cod: cod ? "1" : "0",
  });
  if (args.declaredValue) {
    params.set("declared_value", String(args.declaredValue));
  }
  const res = await srFetch<ShiprocketServiceabilityResponse>(
    `/v1/external/courier/serviceability/?${params.toString()}`,
    { method: "GET" },
  );
  const couriers = res?.data?.available_courier_companies || [];
  const recommendedId =
    res?.data?.shiprocket_recommended_courier_id ||
    res?.data?.recommended_courier_company_id ||
    res?.data?.cheapest_courier_id;
  return couriers
    .map((c) => ({
      courierCompanyId: c.courier_company_id,
      courierName: c.courier_name,
      rate: Number(c.rate),
      etd: c.etd,
      estimatedDeliveryDays: c.estimated_delivery_days,
      recommended: c.courier_company_id === recommendedId,
      mode: c.is_surface ? "Surface" : "Air",
      rating: typeof c.rating === "number" ? c.rating : undefined,
      minWeight: typeof c.min_weight === "number" ? c.min_weight : undefined,
      rtoCharges:
        typeof c.rto_charges === "number" ? c.rto_charges : undefined,
      chargeableWeight:
        typeof c.charge_weight === "number" ? c.charge_weight : undefined,
      expectedPickup: c.pickup_availability || undefined,
    }))
    .sort((a, b) => {
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
      return a.rate - b.rate;
    });
}

// Helper used by the checkout rates endpoint. Caller supplies cart items;
// we resolve weights via Product defaults.
export async function quoteShippingForCart(args: {
  deliveryPincode: string;
  totalWeightKg: number;
  cod?: boolean;
  declaredValue?: number;
}): Promise<RateQuote | null> {
  const config = await getShiprocketConfig();
  if (!config.pickupPincode) {
    throw new ShiprocketError(
      "MISSING_PICKUP_PINCODE",
      "Pickup pincode is not configured in Shiprocket settings",
      400,
    );
  }
  return getServiceability({
    pickupPincode: config.pickupPincode,
    deliveryPincode: args.deliveryPincode,
    weight: args.totalWeightKg,
    cod: args.cod,
    declaredValue: args.declaredValue,
  });
}

export async function listPickupLocations(): Promise<
  Array<{ id: number; nickname: string; pincode: string; city: string }>
> {
  const res = await srFetch<any>(
    "/v1/external/settings/company/pickup",
    { method: "GET" },
  );
  const items = res?.data?.shipping_address || [];
  return items.map((x: any) => ({
    id: x.id,
    nickname: x.pickup_location,
    pincode: x.pin_code,
    city: x.city,
  }));
}
