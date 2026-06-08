import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getShiprocketConfig, srFetch } from "./client";
import { listCouriers, CourierOption } from "./rates";
import {
  ShiprocketCreateOrderPayload,
  ShiprocketCreateOrderResponse,
  ShiprocketError,
  ShiprocketOrderItem,
} from "./types";

type OrderDoc = any;
type ProductDoc = any;

function formatOrderDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

interface BuildPayloadOptions {
  order: OrderDoc;
  productMap: Map<string, ProductDoc>;
  config: Awaited<ReturnType<typeof getShiprocketConfig>>;
}

function buildPayload({
  order,
  productMap,
  config,
}: BuildPayloadOptions): ShiprocketCreateOrderPayload {
  const items: ShiprocketOrderItem[] = order.orderItems.map((it: any) => {
    const productId = String(it.product);
    const product = productMap.get(productId);
    const sku =
      (product?.sku && String(product.sku)) ||
      (product?.slug && String(product.slug)) ||
      `P-${productId.slice(-6)}`;
    return {
      name: it.name,
      sku,
      units: it.qty,
      selling_price: it.price,
      hsn: product?.hsnCode || config.defaultHsnCode || "",
    };
  });

  let totalWeight = 0;
  let maxLength = 0;
  let maxBreadth = 0;
  let totalHeight = 0;
  for (const it of order.orderItems) {
    const product = productMap.get(String(it.product));
    const w = Number(product?.weight) || config.defaultWeight;
    const l = Number(product?.length) || config.defaultLength;
    const b = Number(product?.breadth) || config.defaultBreadth;
    const h = Number(product?.height) || config.defaultHeight;
    totalWeight += w * it.qty;
    if (l > maxLength) maxLength = l;
    if (b > maxBreadth) maxBreadth = b;
    totalHeight += h * it.qty;
  }
  if (totalWeight <= 0) totalWeight = config.defaultWeight;
  if (maxLength <= 0) maxLength = config.defaultLength;
  if (maxBreadth <= 0) maxBreadth = config.defaultBreadth;
  if (totalHeight <= 0) totalHeight = config.defaultHeight;

  const address = order.shippingAddress;
  const isCod = String(order.paymentMethod).toLowerCase().includes("cod");

  // Shiprocket requires billing_last_name to be PRESENT in the payload (it can be
  // empty, but the key must exist). Split the stored full name into first + last.
  const fullName = String(address.fullName || "").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  return {
    order_id: String(order._id),
    order_date: formatOrderDate(new Date(order.createdAt || Date.now())),
    pickup_location: config.pickupLocation,
    channel_id: config.channelId,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: address.address,
    billing_city: address.city,
    billing_pincode: address.pincode,
    billing_state: address.state || "",
    billing_country: "India",
    billing_email: address.email,
    billing_phone: String(address.phone),
    shipping_is_billing: true,
    order_items: items,
    payment_method: isCod ? "COD" : "Prepaid",
    sub_total: order.itemsPrice,
    length: Math.max(1, Math.round(maxLength)),
    breadth: Math.max(1, Math.round(maxBreadth)),
    height: Math.max(1, Math.round(totalHeight)),
    weight: Number(totalWeight.toFixed(3)),
  };
}

function computeOrderWeight(
  order: OrderDoc,
  productMap: Map<string, ProductDoc>,
  config: Awaited<ReturnType<typeof getShiprocketConfig>>,
): number {
  let totalWeight = 0;
  for (const it of order.orderItems) {
    const product = productMap.get(String(it.product));
    const w = Number(product?.weight) || config.defaultWeight;
    totalWeight += w * it.qty;
  }
  return totalWeight > 0
    ? Number(totalWeight.toFixed(3))
    : config.defaultWeight;
}

async function loadProductsForOrder(
  order: OrderDoc,
): Promise<Map<string, ProductDoc>> {
  const ids = Array.from(
    new Set(order.orderItems.map((it: any) => String(it.product))),
  );
  const products = await Product.find({ _id: { $in: ids } })
    .select("_id sku slug hsnCode weight length breadth height")
    .lean();
  const map = new Map<string, ProductDoc>();
  for (const p of products as ProductDoc[]) map.set(String(p._id), p);
  return map;
}

export interface PushResult {
  ok: true;
  srOrderId: string;
  shipmentId: string;
  awbCode?: string;
  courierName?: string;
}

export interface PushFailure {
  ok: false;
  code: string;
  message: string;
  httpStatus: number;
}

// Server-side push. Caller passes the order document (or _id).
// Updates `order.shiprocket.*` in place and persists to DB. Idempotent: if the order
// already has a Shiprocket order id, returns the existing IDs without re-pushing.
export async function pushOrderToShiprocket(
  orderOrId: OrderDoc | string,
): Promise<PushResult | PushFailure> {
  await connectDB();
  const order: OrderDoc =
    typeof orderOrId === "string"
      ? await Order.findById(orderOrId)
      : orderOrId;
  if (!order) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
      httpStatus: 404,
    };
  }
  if (order.shiprocket?.orderId) {
    return {
      ok: true,
      srOrderId: order.shiprocket.orderId,
      shipmentId: order.shiprocket.shipmentId,
      awbCode: order.awbNumber,
      courierName: order.courierName,
    };
  }
  try {
    const config = await getShiprocketConfig();
    const productMap = await loadProductsForOrder(order);
    const payload = buildPayload({ order, productMap, config });
    const res = await srFetch<ShiprocketCreateOrderResponse>(
      "/v1/external/orders/create/adhoc",
      { method: "POST", body: payload },
    );
    const update: Record<string, any> = {
      "shiprocket.orderId": String(res.order_id),
      "shiprocket.shipmentId": String(res.shipment_id),
      "shiprocket.status": "pushed",
      "shiprocket.lastSyncedAt": new Date(),
      "shiprocket.lastError": null,
      "shiprocket.lastStatusCode": res.status_code,
      "shiprocket.lastStatus": res.status,
      $inc: { "shiprocket.pushAttempts": 1 } as any,
    };
    if (res.awb_code) update.awbNumber = res.awb_code;
    if (res.courier_name) update.courierName = res.courier_name;
    const { $inc, ...set } = update;
    await Order.findByIdAndUpdate(order._id, { $set: set, $inc });
    return {
      ok: true,
      srOrderId: String(res.order_id),
      shipmentId: String(res.shipment_id),
      awbCode: res.awb_code,
      courierName: res.courier_name,
    };
  } catch (err: any) {
    const isSrErr = err instanceof ShiprocketError;
    const code = isSrErr ? err.code : "UNKNOWN";
    const httpStatus = isSrErr ? err.httpStatus : 500;
    const message = err?.message || "Shiprocket push failed";
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        "shiprocket.status": "failed",
        "shiprocket.lastError": `${code}: ${message}`,
        "shiprocket.lastSyncedAt": new Date(),
      },
      $inc: { "shiprocket.pushAttempts": 1 },
    });
    return { ok: false, code, message, httpStatus };
  }
}

export interface OrderShipContext {
  pickupPincode: string;
  deliveryPincode: string;
  deliveryState?: string;
  orderValue: number;
  paymentMethod: string; // "Prepaid" | "COD"
  weightKg: number;
}

// Lists the serviceable couriers for an already-pushed order so an admin can
// pick one in the dashboard (instead of choosing in the Shiprocket UI).
export async function listCouriersForOrder(
  orderId: string,
): Promise<
  | { ok: true; couriers: CourierOption[]; context: OrderShipContext }
  | PushFailure
> {
  await connectDB();
  const order: OrderDoc = await Order.findById(orderId);
  if (!order) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
      httpStatus: 404,
    };
  }
  try {
    const config = await getShiprocketConfig();
    if (!config.pickupPincode) {
      return {
        ok: false,
        code: "MISSING_PICKUP_PINCODE",
        message: "Set Pickup Pincode in Shiprocket settings first",
        httpStatus: 400,
      };
    }
    const deliveryPincode = String(order.shippingAddress?.pincode || "");
    if (!deliveryPincode) {
      return {
        ok: false,
        code: "NO_DELIVERY_PINCODE",
        message: "Order has no delivery pincode",
        httpStatus: 400,
      };
    }
    const productMap = await loadProductsForOrder(order);
    const weight = computeOrderWeight(order, productMap, config);
    const isCod = String(order.paymentMethod).toLowerCase().includes("cod");
    // Declared value = value of the GOODS (itemsPrice), not the order total
    // (which also includes the shipping the customer paid). Matches what we
    // send Shiprocket as sub_total and what Shiprocket shows as Order Value.
    const goodsValue = Number(order.itemsPrice) || Number(order.totalPrice) || 0;
    const couriers = await listCouriers({
      pickupPincode: config.pickupPincode,
      deliveryPincode,
      weight,
      cod: isCod,
      declaredValue: goodsValue,
    });
    // Shiprocket bills a flat per-shipment "Notify Charges" on top of freight
    // that the rate API doesn't return; surface it so totals match the dashboard.
    const notify = Number(config.notifyCharges) || 0;
    for (const c of couriers) c.notifyCharges = notify;
    return {
      ok: true,
      couriers,
      context: {
        pickupPincode: config.pickupPincode,
        deliveryPincode,
        deliveryState: order.shippingAddress?.state || undefined,
        orderValue: goodsValue,
        paymentMethod: isCod ? "COD" : "Prepaid",
        weightKg: weight,
      },
    };
  } catch (err: any) {
    const isSrErr = err instanceof ShiprocketError;
    return {
      ok: false,
      code: isSrErr ? err.code : "UNKNOWN",
      message: err?.message || "Failed to load couriers",
      httpStatus: isSrErr ? err.httpStatus : 500,
    };
  }
}

// Assigns an AWB for a pushed order using the chosen courier (or Shiprocket's
// default if courierId is omitted), then best-effort schedules a pickup.
export async function assignAwbForOrder(
  orderId: string,
  courierId?: number,
): Promise<
  { ok: true; awbCode: string; courierName: string } | PushFailure
> {
  await connectDB();
  const order: OrderDoc = await Order.findById(orderId);
  if (!order) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
      httpStatus: 404,
    };
  }
  const shipmentId = order.shiprocket?.shipmentId;
  if (!shipmentId) {
    return {
      ok: false,
      code: "NO_SHIPMENT",
      message: "Push the order to Shiprocket first",
      httpStatus: 400,
    };
  }
  if (order.awbNumber) {
    return {
      ok: true,
      awbCode: order.awbNumber,
      courierName: order.courierName || "",
    };
  }
  try {
    const body: Record<string, any> = { shipment_id: Number(shipmentId) };
    if (courierId) body.courier_id = courierId;
    const res = await srFetch<any>("/v1/external/courier/assign/awb", {
      method: "POST",
      body,
    });
    const data = res?.response?.data || {};
    const awbCode = data.awb_code ? String(data.awb_code) : "";
    const courierName = data.courier_name ? String(data.courier_name) : "";
    if (!awbCode) {
      const reason =
        data.awb_assign_error ||
        res?.awb_assign_error ||
        res?.message ||
        "Shiprocket did not return an AWB";
      return {
        ok: false,
        code: "AWB_NOT_ASSIGNED",
        message: String(reason),
        httpStatus: 422,
      };
    }
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        awbNumber: awbCode,
        courierName: courierName || order.courierName,
        "shiprocket.status": "pushed",
        "shiprocket.lastSyncedAt": new Date(),
        "shiprocket.lastError": null,
      },
    });
    // Best-effort pickup request — don't fail the assignment if it errors.
    try {
      await srFetch("/v1/external/courier/generate/pickup", {
        method: "POST",
        body: { shipment_id: [Number(shipmentId)] },
      });
    } catch (e: any) {
      console.warn("[shiprocket] generate pickup failed:", e?.message || e);
    }
    return { ok: true, awbCode, courierName };
  } catch (err: any) {
    const isSrErr = err instanceof ShiprocketError;
    return {
      ok: false,
      code: isSrErr ? err.code : "UNKNOWN",
      message: err?.message || "AWB assignment failed",
      httpStatus: isSrErr ? err.httpStatus : 500,
    };
  }
}

export async function cancelShiprocketOrder(
  srOrderId: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await srFetch("/v1/external/orders/cancel", {
      method: "POST",
      body: { ids: [Number(srOrderId)] },
    });
    return { ok: true };
  } catch (err: any) {
    const message = err?.message || "Shiprocket cancel failed";
    console.error("[shiprocket] cancel failed:", srOrderId, message);
    return { ok: false, message };
  }
}
