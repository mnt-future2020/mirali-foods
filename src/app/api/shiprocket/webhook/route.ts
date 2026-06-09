import { handleTrackingWebhook } from "@/lib/shiprocket/webhook-handler";

// Original webhook path. Shiprocket's dashboard rejects URLs containing
// "shiprocket"/"sr"/"kr", so configure the dashboard to use the keyword-free
// alias at /api/delivery-webhook instead. Both share the same handler.
export async function POST(req: Request) {
  return handleTrackingWebhook(req);
}
