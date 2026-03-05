"use client";

import { X, Check, FileText, Lightbulb, BarChart3, Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaddleButton from "./PaddleButton";

interface CompetitorPreview {
  name: string;
  url: string;
  tierCount: number;
  tierNames: string[];
  priceRange: string;
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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: PaddleCheckoutData) => void;
  previewData: {
    competitors?: CompetitorPreview[];
    message?: string;
  } | null;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  previewData 
}: PaymentModalProps) {
  const competitorCount = previewData?.competitors?.length || 0;
  
  // Paddle Price ID for PricingAudit product ($19)
  // You need to create this in your Paddle dashboard
  const paddlePriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || "pri_01xxxxx";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Unlock Full Analysis</h2>
              <p className="text-gray-500 mt-1">
                We analyzed {competitorCount} competitor{competitorCount !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          {/* Competitor Preview Cards */}
          {previewData?.competitors && previewData.competitors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Competitors Found
              </h3>
              <div className="space-y-3">
                {previewData.competitors.map((competitor, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{competitor.name}</h4>
                      <span className="text-sm text-blue-600 font-medium">
                        {competitor.tierCount} tiers
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      {competitor.tierNames.slice(0, 3).join(", ")}
                      {competitor.tierNames.length > 3 && "..."}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {competitor.priceRange}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What's Included */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Full Report Includes
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Comparison Table</span>
                  </div>
                  <p className="text-xs text-gray-500">Feature-by-feature breakdown</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">5-7 Insights</span>
                  </div>
                  <p className="text-xs text-gray-500">Strategic recommendations</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Positioning</span>
                  </div>
                  <p className="text-xs text-gray-500">Where you stand</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">PDF Export</span>
                  </div>
                  <p className="text-xs text-gray-500">Download & share</p>
                </div>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-center mb-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-gray-600 mb-1">One-time payment</p>
            <p className="text-4xl font-bold text-gray-900">$19</p>
            <p className="text-sm text-gray-500 mt-1">No subscription required</p>
          </div>

          {/* Paddle Button */}
          <div className="mb-4">
            <PaddleButton
              priceId={paddlePriceId}
              onSuccess={onSuccess}
              onError={(err) => {
                console.error("Payment failed:", err);
                alert("Payment failed. Please try again.");
              }}
              onClose={() => {
                console.log("Checkout closed");
              }}
            />
          </div>

          {/* Cancel Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-500 hover:text-gray-700"
          >
            Maybe Later
          </Button>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Secure payment processed by Paddle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
