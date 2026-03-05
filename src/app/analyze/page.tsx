"use client";

import { Suspense } from "react";
import AnalyzePageContent from "./AnalyzePageContent";
import { Loader2 } from "lucide-react";

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AnalyzePageContent />
    </Suspense>
  );
}
