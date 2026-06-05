import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { decryptPassword } from "@/lib/encryption";
import {
  applyWebhookToOrder,
  verifyWebhookSignature,
} from "@/lib/shiprocket";

// Shiprocket webhook receiver.
// Configure in Shiprocket dashboard → Settings → API → Configure Webhooks.
// Header "X-Api-Key" must contain the secret saved in admin Shipping settings.
export async function POST(req: Request) {
  try {
    // Read the raw body once. Shiprocket's dashboard "Test Webhook" button (and
    // generic reachability pings) send an empty or non-JSON body — acknowledge
    // those with 200 so the dashboard test succeeds instead of failing on a
    // 400/401. An empty body carries no order data, so this is a safe no-op and
    // doesn't need the token check.
    const raw = (await req.text()).trim();
    let payload: any = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = null;
      }
    }
    if (!payload) {
      console.log(
        "[shiprocket webhook] empty/non-JSON body — treating as connectivity test",
      );
      return NextResponse.json({ ok: true, ping: true });
    }

    await connectDB();
    const settings = await Settings.findOne();
    const encryptedSecret = settings?.shiprocket?.webhookSecret;
    if (!encryptedSecret) {
      // Refuse silently with 200 to avoid Shiprocket disabling the hook,
      // but log so admin notices.
      console.warn("[shiprocket webhook] received but no secret configured");
      return NextResponse.json({ ok: false, reason: "not_configured" });
    }
    const expectedSecret = decryptPassword(encryptedSecret);
    const headerToken =
      req.headers.get("x-api-key") || req.headers.get("X-Api-Key");
    if (!verifyWebhookSignature(headerToken, expectedSecret)) {
      console.warn("[shiprocket webhook] invalid signature");
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }

    const result = await applyWebhookToOrder(payload);
    if (!result.matched) {
      console.warn(
        "[shiprocket webhook] no order matched payload",
        payload?.awb || payload?.order_id,
      );
    } else {
      console.log(
        `[shiprocket webhook] updated order ${result.orderId} (${payload.current_status || payload.shipment_status})`,
      );
    }
    return NextResponse.json({ ok: true, matched: result.matched });
  } catch (err: any) {
    console.error("[shiprocket webhook] error", err?.message || err);
    // Still return 200 so Shiprocket doesn't retry-flood on our bugs.
    return NextResponse.json({ ok: false, error: err?.message });
  }
}
