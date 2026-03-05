"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  Share2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Target,
  RefreshCw,
  Lock,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PaymentModal from "@/components/PaymentModal";

interface PricingTier {
  name: string;
  price: string;
  billingFrequency?: string;
  features: string[];
}

interface Competitor {
  name: string;
  url: string;
  tiers: PricingTier[];
}

interface CompetitorPreview {
  name: string;
  url: string;
  tierCount: number;
  tierNames: string[];
  priceRange: string;
}

interface AnalysisResult {
  competitors: Competitor[];
  insights: string[];
  positioning: string;
  comparison_table_markdown: string;
  paymentId?: string;
}

interface PreviewResult {
  competitors?: CompetitorPreview[];
  message?: string;
  requiresPayment?: boolean;
}

interface ScreenshotResult {
  url: string;
  screenshot: string | null;
  success: boolean;
  error?: string;
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

export default function AnalyzePageContent() {
  const searchParams = useSearchParams();
  const urls = searchParams.getAll("urls");
  const productName = searchParams.get("productName") || "";
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const [screenshots, setScreenshots] = useState<ScreenshotResult[]>([]);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const runPreview = useCallback(async () => {
    if (urls.length === 0) return;
    
    try {
      setProgress(10);
      setStatus("Capturing pricing page screenshots...");

      // Step 1: Capture screenshots
      const captureResponse = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      if (!captureResponse.ok) {
        const errorData = await captureResponse.json();
        throw new Error(errorData.error || "Failed to capture screenshots");
      }

      const captureData = await captureResponse.json();
      setScreenshots(captureData.screenshots);
      
      if (captureData.failedUrls.length > 0) {
        console.warn("Failed to capture:", captureData.failedUrls);
      }

      const successfulScreenshots: ScreenshotResult[] = captureData.screenshots.filter(
        (s: ScreenshotResult) => s.success
      );

      if (successfulScreenshots.length === 0) {
        throw new Error("Failed to capture any screenshots");
      }

      setProgress(40);
      setStatus("Generating preview...");

      // Step 2: Get preview (free)
      const previewResponse = await fetch("/api/analyze-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenshots: successfulScreenshots,
          productName,
        }),
      });

      if (!previewResponse.ok) {
        const errorData = await previewResponse.json();
        throw new Error(errorData.error || "Failed to generate preview");
      }

      const previewData: PreviewResult = await previewResponse.json();
      setPreviewResult(previewData);
      setProgress(60);
      
      // Show payment modal
      setShowPaymentModal(true);
    } catch (err) {
      console.error("Preview error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setProgress(0);
    }
  }, [urls, productName]);

  useEffect(() => {
    runPreview();
  }, [runPreview]);

  const runFullAnalysis = async (paddleData: PaddleCheckoutData) => {
    try {
      // Extract transaction ID from Paddle checkout data
      const transactionId = paddleData.checkout.transaction_id || paddleData.checkout.id;
      setPaymentId(transactionId);
      setShowPaymentModal(false);
      setPaymentComplete(true);
      setProgress(70);
      setStatus("Running full analysis...");

      const successfulScreenshots = screenshots.filter((s) => s.success);

      // Run full analysis with payment ID
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenshots: successfulScreenshots,
          urls: successfulScreenshots.map((s) => s.url),
          productName,
          paymentId: transactionId,
        }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        if (errorData.code === "PAYMENT_REQUIRED") {
          setShowPaymentModal(true);
          setPaymentComplete(false);
          throw new Error("Payment required");
        }
        throw new Error(errorData.error || "Failed to analyze pricing");
      }

      const analysisData: AnalysisResult = await analyzeResponse.json();
      setResult(analysisData);
      setProgress(100);
      setStatus("Analysis complete!");
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setProgress(0);
    }
  };

  const generatePDF = async () => {
    if (!resultRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`pricing-audit-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const retry = () => {
    setError(null);
    setResult(null);
    setPreviewResult(null);
    setPaymentComplete(false);
    setPaymentId(null);
    setShowPaymentModal(false);
    setProgress(0);
    runPreview();
  };

  // Loading/Preview State (before payment)
  if (!result && !error && !paymentComplete) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">PricingAudit</span>
            </Link>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-20">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Analyzing Pricing Pages</h2>
                <p className="text-gray-600">{status}</p>
              </div>

              <Progress value={progress} className="h-2 mb-4" />
              
              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${progress >= 10 ? "text-green-500" : "text-gray-300"}`} />
                  <span className={progress >= 10 ? "text-gray-900" : "text-gray-400"}>
                    Capturing screenshots
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${progress >= 40 ? "text-green-500" : "text-gray-300"}`} />
                  <span className={progress >= 40 ? "text-gray-900" : "text-gray-400"}>
                    Identifying competitors
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Lock className={`w-5 h-5 ${progress >= 60 ? "text-amber-500" : "text-gray-300"}`} />
                  <span className={progress >= 60 ? "text-gray-900" : "text-gray-400"}>
                    Unlock full analysis
                  </span>
                </div>
              </div>

              {screenshots.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm text-gray-500 mb-3">Captured pages:</p>
                  <div className="space-y-2">
                    {screenshots.map((screenshot, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {screenshot.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="truncate">{screenshot.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewResult?.competitors && previewResult.competitors.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm text-gray-500 mb-3">Competitors found:</p>
                  <div className="space-y-3">
                    {previewResult.competitors.map((comp, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{comp.name}</span>
                          <span className="text-sm text-blue-600">{comp.tierCount} tiers</span>
                        </div>
                        <p className="text-sm text-gray-500">{comp.priceRange}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={runFullAnalysis}
          previewData={previewResult}
        />
      </main>
    );
  }

  // Full Analysis Loading State
  if (paymentComplete && !result && !error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">PricingAudit</span>
            </Link>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-20">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Complete!</h2>
              <p className="text-gray-600 mb-6">Generating your full analysis report...</p>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Error State
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">PricingAudit</span>
            </Link>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-20">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={retry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Link href="/">
              <Button variant="default">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Results State (after payment)
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">PricingAudit</span>
          </Link>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={copyLink}
              className="hidden sm:flex"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </>
              )}
            </Button>
            <Button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div ref={resultRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Success Banner */}
        {paymentId && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-green-800">Payment Confirmed</p>
              <p className="text-sm text-green-600">Transaction ID: {paymentId.slice(0, 16)}...</p>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {productName ? `${productName} - ` : ""}Pricing Analysis Report
          </h1>
          <p className="text-gray-600">
            Generated on {new Date().toLocaleDateString()} • {urls.length} competitors analyzed
          </p>
        </div>

        {/* Positioning Card */}
        {result?.positioning && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Positioning Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{result.positioning}</p>
            </CardContent>
          </Card>
        )}

        {/* Insights Section */}
        {result?.insights && result.insights.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Strategic Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.insights.map((insight, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Comparison Table */}
        {result?.comparison_table_markdown && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Comparison Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="prose max-w-none">
                  <ReactMarkdown
                    components={{
                      table: ({ children }) => (
                        <Table className="border">
                          {children}
                        </Table>
                      ),
                      thead: ({ children }) => <TableHeader>{children}</TableHeader>,
                      tbody: ({ children }) => <TableBody>{children}</TableBody>,
                      tr: ({ children }) => <TableRow>{children}</TableRow>,
                      th: ({ children }) => (
                        <TableHead className="bg-gray-50 font-semibold">{children}</TableHead>
                      ),
                      td: ({ children }) => <TableCell>{children}</TableCell>,
                    }}
                  >
                    {result.comparison_table_markdown}
                  </ReactMarkdown>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competitor Details */}
        {result?.competitors && result.competitors.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Competitor Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {result.competitors.map((competitor, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-1">{competitor.name}</h3>
                    <a
                      href={competitor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline mb-4 block"
                    >
                      {competitor.url}
                    </a>
                    {competitor.tiers.length > 0 ? (
                      <div className="space-y-3">
                        {competitor.tiers.map((tier, tierIndex) => (
                          <div key={tierIndex} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{tier.name}</span>
                              <span className="text-blue-600 font-semibold">{tier.price}</span>
                            </div>
                            {tier.features.length > 0 && (
                              <ul className="text-sm text-gray-600 space-y-1">
                                {tier.features.slice(0, 5).map((feature, fIndex) => (
                                  <li key={fIndex} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    {feature}
                                  </li>
                                ))}
                                {tier.features.length > 5 && (
                                  <li className="text-gray-400">
                                    +{tier.features.length - 5} more features
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No pricing tiers extracted</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t">
          <Button onClick={copyLink} variant="outline" className="sm:hidden">
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Share Report
              </>
            )}
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Analyze New Competitors
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
