# PricingAudit

A tool that analyzes competitor pricing pages and generates AI-powered comparison reports.

## Features

- **Landing Page**: Simple form to input 2-5 competitor URLs
- **Screenshot Capture**: Automatically captures pricing page screenshots using Playwright
- **AI Analysis**: Uses OpenAI GPT-4o-mini to extract pricing tiers, features, and insights
- **Paywall**: Shows preview of competitors, requires $19 payment via Paddle for full report
- **Comparison Table**: Side-by-side comparison of competitors
- **Strategic Insights**: 5-7 AI-generated insights about pricing patterns
- **PDF Export**: Download reports as PDF
- **Share Link**: Copy analysis URL to clipboard

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Hook Form + Zod validation
- OpenAI GPT-4o-mini API
- Paddle.js SDK (payments)
- Playwright (screenshot capture)
- jsPDF + html2canvas (PDF generation)

## Environment Variables

Create a `.env.local` file with:

```env
# Required for AI analysis
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# Required for Paddle payments
NEXT_PUBLIC_PADDLE_VENDOR_ID=your_vendor_id
NEXT_PUBLIC_PADDLE_PRICE_ID=your_price_id
```

### Getting Paddle Credentials

1. Go to: https://vendors.paddle.com/
2. Sign up for a Paddle account (or log in)
3. Go to **Developer Tools** → **Authentication**
4. Copy your **Vendor ID**
5. Go to **Catalog** → **Products**
6. Create a new product:
   - Name: "PricingAudit Report"
   - Price: $19.00 USD
   - One-time payment
7. Copy the **Price ID** (starts with `pri_`)
8. For testing: Use Paddle Sandbox environment

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_PADDLE_VENDOR_ID`
   - `NEXT_PUBLIC_PADDLE_PRICE_ID`
4. Deploy

### Important Notes

- Playwright requires additional setup on Vercel (may need to use a different screenshot solution)
- The `OPENAI_API_KEY` is required for the AI analysis to work
- Paddle credentials are required for payments to work
- Each analysis costs approximately $0.20 (GPT-4o-mini with vision)

## API Routes

- `POST /api/capture`: Captures screenshots of pricing pages
- `POST /api/analyze-preview`: Generates a free preview (competitor names, tier counts)
- `POST /api/analyze`: Full analysis (requires payment ID)

## Payment Flow

1. User submits competitor URLs
2. Screenshots are captured
3. Preview analysis runs (free) - shows competitor names, tier counts, price ranges
4. Payment modal appears with Paddle checkout button
5. User pays $19 via Paddle
6. Full analysis runs and displays:
   - Comparison table
   - 5-7 strategic insights
   - Positioning recommendation
   - Competitor details with features
7. User can download PDF or share the report

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── capture/route.ts         # Screenshot capture API
│   │   ├── analyze-preview/route.ts # Preview analysis API
│   │   └── analyze/route.ts         # Full analysis API
│   ├── analyze/
│   │   ├── page.tsx                 # Suspense wrapper
│   │   └── AnalyzePageContent.tsx   # Analysis results page with paywall
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Landing page
│   └── globals.css                  # Global styles
├── components/
│   ├── PaddleButton.tsx             # Paddle checkout button
│   ├── PaymentModal.tsx             # Payment modal component
│   └── ui/                          # shadcn/ui components
└── lib/
    └── utils.ts                     # Utility functions
```

## Usage

1. Visit the landing page
2. Enter your product name (optional)
3. Input 2-5 competitor pricing page URLs
4. Click "Analyze Pricing"
5. Wait for screenshot capture and preview generation
6. Review the preview (competitor names, tier counts)
7. Click "Unlock Full Analysis" and pay $19 via Paddle
8. Review the full comparison table and strategic insights
9. Download PDF or share the report

## Limitations

- URLs must be publicly accessible (no login required)
- Pricing pages should be in English for best results
- Some websites may block screenshot capture
- AI analysis quality depends on the clarity of the pricing page

## Cost Breakdown

- **OpenAI API**: ~$0.20 per analysis (GPT-4o-mini with vision)
- **Paddle Fees**: ~$0.95 per $19 transaction (5% + $0.50)
- **Net Revenue**: ~$17.85 per report

## License

MIT
