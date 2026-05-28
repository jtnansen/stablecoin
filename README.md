# Stablecoin Dashboard

USDC CEX flow analytics across all chains, powered by Nansen API.

## Features

- USDC CEX transfer flows across 8 chains (Ethereum, Arbitrum, Base, Optimism, Polygon, Avalanche, BNB, Solana)
- 10 concurrent API requests for fast loading
- Stacked bar chart — daily CEX volume by chain
- Chain breakdown table with volume, transfer count, avg size, and share
- Date range presets (7D, 14D, 30D, 90D) and custom range picker

## Tech stack

- Next.js 16 (App Router) — server-side API proxy keeps the Nansen key out of the browser
- Tailwind CSS
- Recharts

## Local development

```bash
cp .env.example .env.local
# edit .env.local and set NANSEN_API_KEY

npm install
npm run dev
```

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add the environment variable in **Project Settings → Environment Variables**:
   - `NANSEN_API_KEY` → your Nansen API key
4. Deploy

The API key is only accessed in the server-side Route Handler (`/api/usdc-flows`) — it never reaches the browser.
