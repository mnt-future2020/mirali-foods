"use client";

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#007D71",
              color: "#fff",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: "600",
              padding: "16px",
            },
            success: {
              iconTheme: {
                primary: "#C4743F",
                secondary: "#fff",
              },
            },
          }}
        />
        {children}
      </WishlistProvider>
    </CartProvider>
  );
}
