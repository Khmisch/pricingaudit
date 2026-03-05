import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

interface ScreenshotData {
  url: string;
  screenshot: string;
  success: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { screenshots, productName } = body;

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

    // Build content array for OpenAI - quick preview only
    const content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: `Quickly analyze these competitor pricing pages for ${productName || "a SaaS product"}. 

Extract ONLY:
1. Company/product names
2. Number of pricing tiers each has
3. Tier names (Starter, Pro, Enterprise, etc.)
4. Price ranges (lowest to highest)

Keep it brief. This is just a preview.

Output as JSON:
{
  "competitors": [
    {
      "name": "Company Name",
      "url": "...",
      "tierCount": 3,
      "tierNames": ["Starter", "Pro", "Enterprise"],
      "priceRange": "$29 - $299/mo"
    }
  ],
  "requiresPayment": true,
  "message": "Unlock full analysis to see feature comparison, strategic insights, and positioning recommendations."
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

    // Call OpenAI API with lower token limit for preview
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: content as any,
        },
      ],
      max_tokens: 1000, // Cheaper preview
    });

    const responseText = response.choices[0]?.message?.content || "";
    
    // Extract JSON from the response
    let previewResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        previewResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse preview response:", responseText);
      // Return a fallback preview
      previewResult = {
        competitors: screenshots
          .filter((s: ScreenshotData) => s.success)
          .map((s: ScreenshotData) => ({
            name: new URL(s.url).hostname,
            url: s.url,
            tierCount: "?",
            tierNames: [],
            priceRange: "?",
          })),
        requiresPayment: true,
        message: "Unlock full analysis to see feature comparison, strategic insights, and positioning recommendations.",
      };
    }

    return NextResponse.json(previewResult);
  } catch (error) {
    console.error("Preview API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
