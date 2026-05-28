import { NextResponse } from 'next/server';
import { USDC_CHAINS } from '@/lib/chains';
import type { ChainTransfers } from '@/lib/types';

const NANSEN_API_URL = 'https://api.nansen.ai/api/v1/tgm/transfers';
const CONCURRENCY = 10;

async function fetchChainTransfers(
  chain: string,
  address: string,
  label: string,
  color: string,
  shortLabel: string,
  from: string,
  to: string,
  apiKey: string
): Promise<ChainTransfers> {
  try {
    const allTransfers = [];
    let page = 1;
    let isLastPage = false;

    while (!isLastPage) {
      const res = await fetch(NANSEN_API_URL, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          apiKey,
        },
        body: JSON.stringify({
          chain,
          token_address: address,
          date: { from, to },
          pagination: { page, per_page: 1000 },
          filters: {
            include_cex: true,
            include_dex: false,
            non_exchange_transfers: false,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        const detail = `HTTP ${res.status}: ${text.slice(0, 200)}`;
        console.error(`[usdc-flows] ${chain} error:`, detail);
        return { chain, label, color, shortLabel, transfers: allTransfers, error: detail };
      }

      const json = await res.json();
      allTransfers.push(...(json.data ?? []));
      isLastPage = json.pagination?.is_last_page ?? true;
      page += 1;
    }

    return { chain, label, color, shortLabel, transfers: allTransfers };
  } catch (err) {
    const detail = String(err);
    console.error(`[usdc-flows] ${chain} fetch failed:`, detail);
    return { chain, label, color, shortLabel, transfers: [], error: detail };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to query params' }, { status: 400 });
  }

  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NANSEN_API_KEY not configured' }, { status: 500 });
  }

  // Batch chains into groups of CONCURRENCY and fetch in parallel
  const results: ChainTransfers[] = [];
  for (let i = 0; i < USDC_CHAINS.length; i += CONCURRENCY) {
    const batch = USDC_CHAINS.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(({ chain, address, label, color, shortLabel }) =>
        fetchChainTransfers(chain, address, label, color, shortLabel, from, to, apiKey)
      )
    );
    results.push(...batchResults);
  }

  return NextResponse.json(results);
}
