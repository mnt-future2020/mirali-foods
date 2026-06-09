import { handleTrackingWebhook } from "@/lib/shiprocket/webhook-handler";

// Keyword-free webhook URL for the Shiprocket dashboard (it rejects URLs that
// contain "shiprocket"/"kartrocket"/"sr"/"kr"). Same handler as the original.
// Configure in Shiprocket: https://miralyfoods.com/api/delivery-webhook
export async function POST(req: Request) {
  return handleTrackingWebhook(req);
}
