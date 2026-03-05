"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, ArrowRight, Sparkles, BarChart3, Zap, Shield } from "lucide-react";

const urlSchema = z.object({
  productName: z.string().optional(),
  urls: z.array(
    z.object({
      value: z.string().url("Please enter a valid URL").min(1, "URL is required"),
    })
  ).min(2, "At least 2 competitor URLs are required").max(5, "Maximum 5 URLs allowed"),
});

type FormData = z.infer<typeof urlSchema>;

export default function Home() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      productName: "",
      urls: [{ value: "" }, { value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "urls",
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const urls = data.urls.map((u) => u.value).filter(Boolean);
    const queryParams = new URLSearchParams();
    urls.forEach((url) => queryParams.append("urls", url));
    if (data.productName) {
      queryParams.append("productName", data.productName);
    }
    router.push(`/analyze?${queryParams.toString()}`);
  };

  const addUrlField = () => {
    if (fields.length < 5) {
      append({ value: "" });
    }
  };

  const removeUrlField = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">PricingAudit</span>
          </div>
          <div className="text-sm text-gray-500">Free Beta</div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Pricing Analysis
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Compare Your Pricing to{" "}
            <span className="text-blue-500">Competitors</span> in 60 Seconds
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Analyze competitor pricing pages, extract features, and generate strategic insights 
            to optimize your SaaS pricing strategy.
          </p>

          {/* Form Card */}
          <Card className="max-w-2xl mx-auto shadow-xl border-0">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Product Name (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Product Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <Input
                    {...register("productName")}
                    placeholder="e.g., MySaaS"
                    className="h-12"
                  />
                </div>

                {/* URL Inputs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competitor Pricing Page URLs <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          {...register(`urls.${index}.value`)}
                          placeholder={`https://competitor${index + 1}.com/pricing`}
                          className="h-12 flex-1"
                          type="url"
                        />
                        {fields.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 shrink-0"
                            onClick={() => removeUrlField(index)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.urls?.root && (
                    <p className="text-red-500 text-sm mt-2">{errors.urls.root.message}</p>
                  )}
                  {errors.urls?.[0]?.value && (
                    <p className="text-red-500 text-sm mt-2">{errors.urls[0].value.message}</p>
                  )}

                  {/* Add URL Button */}
                  {fields.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3 w-full h-12 border-dashed"
                      onClick={addUrlField}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Competitor URL
                    </Button>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-blue-500 hover:bg-blue-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Analyzing..."
                  ) : (
                    <>
                      Analyze Pricing
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Results in 60 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>AI-powered insights</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-500">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Enter URLs</h3>
              <p className="text-gray-600">Input 2-5 competitor pricing page URLs you want to analyze</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-500">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
              <p className="text-gray-600">Our AI extracts pricing tiers, features, and key differentiators</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-500">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Get Insights</h3>
              <p className="text-gray-600">Receive a comparison table and strategic recommendations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>Built with AI • Free during beta • Get your first report now</p>
        </div>
      </footer>
    </main>
  );
}
