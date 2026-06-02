import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import BulkThermalClient from "./BulkThermalClient";

export const metadata = {
  title: "Bulk Thermal Print | Miraly Foods",
};

export const dynamic = "force-dynamic";

export default async function BulkPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const ids = typeof params.ids === "string" ? params.ids.split(",") : [];

  if (ids.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontWeight: "bold", color: "red" }}>
        No orders selected
      </div>
    );
  }

  await connectDB();
  const [orders, settings] = await Promise.all([
    Order.find({ _id: { $in: ids } })
      .sort({ createdAt: -1 })
      .lean(),
    Settings.findOne().select("shopName address contactPhone").lean(),
  ]);

  return (
    <BulkThermalClient
      orders={JSON.parse(JSON.stringify(orders))}
      settings={JSON.parse(JSON.stringify(settings))}
    />
  );
}
