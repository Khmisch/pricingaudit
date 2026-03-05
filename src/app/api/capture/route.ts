import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache for screenshots (in production, use Redis or similar)
const screenshotCache = new Map<string, string>();

async function captureScreenshot(url: string): Promise<string> {
  // Check cache first
  const cacheKey = `${url}_${new Date().toISOString().split("T")[0]}`;
  if (screenshotCache.has(cacheKey)) {
    return screenshotCache.get(cacheKey)!;
  }

  try {
    // Dynamic import to avoid issues if playwright is not installed
    const { chromium } = await import("playwright");
    
    const browser = await chromium.launch({
      headless: true,
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    
    const page = await context.newPage();
    
    // Navigate with timeout
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    
    // Wait for page to settle
    await page.waitForTimeout(2000);
    
    // Take screenshot
    const screenshot = await page.screenshot({
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    
    await browser.close();
    
    // Convert to base64
    const base64 = screenshot.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    // Cache the result
    screenshotCache.set(cacheKey, dataUrl);
    
    return dataUrl;
  } catch (error) {
    console.error(`Failed to capture screenshot for ${url}:`, error);
    throw new Error(`Failed to capture screenshot: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length < 2 || urls.length > 5) {
      return NextResponse.json(
        { error: "Please provide 2-5 URLs" },
        { status: 400 }
      );
    }

    // Validate URLs
    for (const url of urls) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: `Invalid URL: ${url}` },
          { status: 400 }
        );
      }
    }

    // Capture screenshots
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        try {
          const screenshot = await captureScreenshot(url);
          return { url, screenshot, success: true };
        } catch (error) {
          return { 
            url, 
            screenshot: null, 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to capture" 
          };
        }
      })
    );

    const screenshots = results.map((result) =>
      result.status === "fulfilled" ? result.value : null
    );

    const failedUrls = screenshots
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .filter((s) => !s.success)
      .map((s) => s.url);

    if (failedUrls.length === urls.length) {
      return NextResponse.json(
        { error: "Failed to capture all screenshots", failedUrls },
        { status: 500 }
      );
    }

    return NextResponse.json({
      screenshots: screenshots.filter((s): s is NonNullable<typeof s> => s !== null),
      failedUrls,
    });
  } catch (error) {
    console.error("Capture API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
