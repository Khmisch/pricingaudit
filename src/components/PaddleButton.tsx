"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

declare global {
  interface Window {
    Paddle: {
      Environment: {
        set: (env: "sandbox" | "production") => void;
      };
      Setup: (config: { vendor: number }) => void;
      Checkout: {
        open: (config: {
          items: Array<{
            priceId: string;
            quantity: number;
          }>;
          settings?: {
            displayMode?: "overlay" | "inline";
            theme?: "light" | "dark";
            locale?: string;
          };
          successCallback?: (data: PaddleCheckoutData) => void;
          closeCallback?: () => void;
          errorCallback?: (error: Error) => void;
        }) => void;
      };
    };
  }
}

interface PaddleCheckoutData {
  checkout: {
    id: string;
    created_at: string;
    completed_at: string | null;
    completed: boolean;
    transaction_id: string | null;
    customer_id: string | null;
    customer_email: string | null;
    customer_name: string | null;
  };
}

interface PaddleButtonProps {
  priceId: string;
  onSuccess: (data: PaddleCheckoutData) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export default function PaddleButton({
  priceId,
  onSuccess,
  onError,
  onClose,
  isLoading = false,
}: PaddleButtonProps) {
  const paddleInitialized = useRef(false);
  const vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID;

  useEffect(() => {
    if (!vendorId) {
      console.error("NEXT_PUBLIC_PADDLE_VENDOR_ID is not configured");
      return;
    }

    // Check if Paddle script already exists
    const existingScript = document.getElementById("paddle-script");
    if (existingScript) {
      paddleInitialized.current = true;
      return;
    }

    // Load Paddle.js SDK
    const script = document.createElement("script");
    script.id = "paddle-script";
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;

    script.onload = () => {
      if (window.Paddle) {
        // Set environment (use sandbox for testing)
        const isSandbox = vendorId.startsWith("test_") || process.env.NODE_ENV === "development";
        if (isSandbox) {
          window.Paddle.Environment.set("sandbox");
        }

        // Initialize Paddle
        window.Paddle.Setup({
          vendor: parseInt(vendorId.replace("test_", "").replace("act_", "")),
        });

        paddleInitialized.current = true;
      }
    };

    script.onerror = () => {
      console.error("Failed to load Paddle SDK");
      if (onError) onError(new Error("Failed to load Paddle SDK"));
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount
    };
  }, [vendorId, onError]);

  const openCheckout = useCallback(() => {
    if (!window.Paddle || !paddleInitialized.current) {
      console.error("Paddle not initialized");
      if (onError) onError(new Error("Paddle not initialized"));
      return;
    }

    window.Paddle.Checkout.open({
      items: [
        {
          priceId: priceId,
          quantity: 1,
        },
      ],
      settings: {
        displayMode: "overlay",
        theme: "light",
        locale: "en",
      },
      successCallback: (data: PaddleCheckoutData) => {
        console.log("Paddle checkout success:", data);
        onSuccess(data);
      },
      closeCallback: () => {
        console.log("Paddle checkout closed");
        if (onClose) onClose();
      },
      errorCallback: (error: Error) => {
        console.error("Paddle checkout error:", error);
        if (onError) onError(error);
      },
    });
  }, [priceId, onSuccess, onError, onClose]);

  if (!vendorId) {
    return (
      <div className="text-red-500 text-sm">
        Paddle not configured. Please contact support.
      </div>
    );
  }

  return (
    <Button
      onClick={openCheckout}
      disabled={isLoading || !paddleInitialized.current}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Lock className="w-5 h-5 mr-2" />
          Unlock Full Analysis - $19
        </>
      )}
    </Button>
  );
}
