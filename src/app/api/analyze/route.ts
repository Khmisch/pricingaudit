import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

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

interface AnalysisResult {
  competitors: Competitor[];
  insights: string[];
  positioning: string;
  comparison_table_markdown: string;
}

interface ScreenshotData {
  url: string;
  screenshot: string;
  success: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { screenshots, productName, paymentId } = body;

    // Verify payment (required for full analysis)
    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment required to unlock full analysis", code: "PAYMENT_REQUIRED" },
        { status: 402 }
      );
    }

    if (!screenshots || !Array.isArray(screenshots) || screenshots.length === 0) {
      return NextResponse.json(
        { error: "Please provide screenshots" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Build content array for OpenAI
    const content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: `You are analyzing competitor pricing pages for ${productName || "a SaaS product"}. 

For each pricing page screenshot provided:
1. Extract ALL pricing tiers (name, price, billing frequency)
2. Extract ALL features listed for each tier
3. Identify numeric limits (users, storage, API calls, etc.)
4. Identify boolean features (SSO, custom domains, priority support)

Then generate:
A) A comparison table in markdown format with features as rows and competitors as columns
B) 5-7 strategic insights (what patterns do you see? what's unique? what's missing?)
C) Positioning recommendation

Be specific. Use numbers. Don't be generic.

Output ONLY as valid JSON in this exact format:
{
  "competitors": [
    {
      "name": "Competitor Name",
      "url": "...",
      "tiers": [
        {
          "name": "Tier Name",
          "price": "$X/mo",
          "billingFrequency": "monthly/annual",
          "features": ["Feature 1", "10 users", "SSO: Yes"]
        }
      ]
    }
  ],
  "insights": ["insight 1", "insight 2", ...],
  "positioning": "Your positioning analysis here",
  "comparison_table_markdown": "| Feature | Comp A | Comp B |..."
}`,
      },
    ];

    // Add screenshots to the content
    for (const screenshot of screenshots as ScreenshotData[]) {
      if (screenshot.screenshot && screenshot.success) {
        content.push({
          type: "image_url",
          image_url: {
            url: screenshot.screenshot,
          },
        });
        content.push({
          type: "text",
          text: `URL: ${screenshot.url}`,
        });
      }
    }

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: content as any,
        },
      ],
      max_tokens: 4000,
    });

    // Parse the response
    const responseText = response.choices[0]?.message?.content || "";
    
    // Extract JSON from the response
    let analysisResult: AnalysisResult;
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]) as AnalysisResult;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse OpenAI response:", responseText);
      // Return a fallback response
      analysisResult = {
        competitors: screenshots
          .filter((s: ScreenshotData) => s.success)
          .map((s: ScreenshotData) => ({
            name: new URL(s.url).hostname,
            url: s.url,
            tiers: [],
          })),
        insights: ["Unable to parse AI response. Please try again."],
        positioning: "Analysis failed. Please retry.",
        comparison_table_markdown: "| Feature | " + screenshots.filter((s: ScreenshotData) => s.success).map((s: ScreenshotData) => new URL(s.url).hostname).join(" | ") + " |\n|---------|" + screenshots.filter((s: ScreenshotData) => s.success).map(() => "------").join("|") + "|",
      };
    }

    return NextResponse.json({
      ...analysisResult,
      paymentId,
    });
  } catch (error) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
