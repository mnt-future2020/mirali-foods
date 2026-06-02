"use client";

import { useEffect, useState } from "react";

export default function BulkThermalClient({
  orders,
  settings,
}: {
  orders: any[];
  settings: any;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Hide all root layout elements (navbar, footer, mobile nav, whatsapp)
    const elementsToHide = document.querySelectorAll("nav, footer, header, [class*='lg:hidden fixed bottom'], [class*='fixed bottom-']");
    elementsToHide.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
    // Also hide by checking for common fixed/sticky elements
    document.querySelectorAll("body *").forEach((el) => {
      const style = window.getComputedStyle(el);
      const htmlEl = el as HTMLElement;
      if (
        style.position === "fixed" &&
        !htmlEl.closest("#bulk-print-root") &&
        !htmlEl.closest(".info-bar")
      ) {
        htmlEl.dataset.bulkHidden = "true";
        htmlEl.style.display = "none";
      }
    });

    setTimeout(() => window.print(), 1500);

    return () => {
      // Restore hidden elements when navigating away
      document.querySelectorAll("[data-bulk-hidden]").forEach((el) => {
        (el as HTMLElement).style.display = "";
        delete (el as HTMLElement).dataset.bulkHidden;
      });
      elementsToHide.forEach((el) => {
        (el as HTMLElement).style.display = "";
      });
    };
  }, []);

  const shopName = settings?.shopName || "Miraly Foods";
  const address =
    settings?.address ||
    "177/2, Kaligoundanur, Vellar Post, Mettur Taluk, Salem District - 636451";
  const phone = settings?.contactPhone || "+91 8754744204";

  return (
    <>
      <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: white;
          color: black;
          font-family: monospace;
          font-size: 12px;
          line-height: 1.4;
        }
        .info-bar {
          background: #f3f4f6;
          padding: 12px 16px;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          color: #555;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .info-bar button {
          margin-left: 8px;
          padding: 4px 16px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
        }
        .btn-print {
          background: #007D71;
          color: white;
        }
        .btn-close {
          background: #d1d5db;
          color: #374151;
        }
        .receipt {
          width: 80mm;
          margin: 0 auto;
          padding: 16px;
          page-break-after: always;
        }
        .receipt:last-child {
          page-break-after: auto;
        }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-lg { font-size: 16px; }
        .text-sm { font-size: 10px; }
        .uppercase { text-transform: uppercase; }
        .dashed { border-bottom: 1px dashed black; margin: 8px 0; }
        .flex { display: flex; justify-content: space-between; }
        .mt { margin-top: 4px; }
        .mb { margin-bottom: 16px; }
        .total { font-size: 14px; font-weight: bold; }
        @media print {
          .info-bar { display: none !important; }
        }
      `}</style>

      <div id="bulk-print-root">
      <div className="info-bar">
        {orders.length} thermal receipt{orders.length > 1 ? "s" : ""} ready — printing automatically...
        <button className="btn-print" onClick={() => window.print()}>Print Now</button>
        <button className="btn-close" onClick={() => window.close()}>Close</button>
      </div>

      {orders.map((order) => (
        <div key={order._id} className="receipt">
          <div className="text-center mb">
            <div className="text-lg font-bold uppercase">{shopName}</div>
            <div className="text-sm">{address}</div>
            <div className="text-sm">WhatsApp: {phone}</div>
            <div className="dashed" />
            <div className="font-bold">INVOICE</div>
            <div>#{order._id.slice(-6).toUpperCase()}</div>
            <div>{mounted ? new Date(order.createdAt).toLocaleString() : "..."}</div>
          </div>

          <div className="mb">
            <div className="font-bold">Customer:</div>
            <div>{order.shippingAddress.fullName}</div>
            <div>{order.shippingAddress.phone}</div>
            <div className="text-sm mt">Delivery Address:</div>
            <div className="text-sm">{order.shippingAddress.address}</div>
            <div className="text-sm">
              {order.shippingAddress.city} - {order.shippingAddress.pincode}
            </div>
            {order.shippingAddress.state && (
              <div className="text-sm">{order.shippingAddress.state}</div>
            )}
          </div>

          <div className="dashed" />
          <div className="flex font-bold">
            <span>Item</span>
            <span>Qty</span>
            <span>Amt</span>
          </div>
          <div className="dashed" />

          {order.orderItems.map((item: any, i: number) => (
            <div key={i} className="flex">
              <span style={{ flex: 1 }}>{item.name}</span>
              <span style={{ width: 30, textAlign: "right" }}>{item.qty}</span>
              <span style={{ width: 50, textAlign: "right" }}>
                {(item.price * item.qty).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="dashed" />
          <div className="flex font-bold">
            <span>Subtotal:</span>
            <span>{order.itemsPrice.toFixed(2)}</span>
          </div>
          {order.shippingPrice > 0 && (
            <div className="flex">
              <span>Shipping:</span>
              <span>{order.shippingPrice.toFixed(2)}</span>
            </div>
          )}
          {order.discountPrice > 0 && (
            <div className="flex">
              <span>Discount:</span>
              <span>-{order.discountPrice.toFixed(2)}</span>
            </div>
          )}
          <div className="dashed" />
          <div className="flex total">
            <span>TOTAL:</span>
            <span>₹{order.totalPrice.toFixed(2)}</span>
          </div>

          <div className="text-center" style={{ marginTop: 24 }}>
            <div className="font-bold">Thank You!</div>
            <div>Visit Again</div>
          </div>
        </div>
      ))}
      </div>
    </>
  );
}
