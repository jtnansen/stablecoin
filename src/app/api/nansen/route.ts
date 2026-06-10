import { NextRequest, NextResponse } from 'next/server';

const ENDPOINTS: Record<string, string> = {
  'flow-intelligence': 'https://api.nansen.ai/api/v1/tgm/flow-intelligence',
  'transfers':         'https://api.nansen.ai/api/v1/tgm/transfers',
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NANSEN_API_KEY not configured' }, { status: 500 });
  }

  const endpoint = req.nextUrl.searchParams.get('endpoint') ?? '';
  const nansenUrl = ENDPOINTS[endpoint];
  if (!nansenUrl) {
    return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 400 });
  }

  const body = await req.text();

  const upstream = await fetch(nansenUrl, {
    method: 'POST',
    headers: { 'apiKey': apiKey, 'Content-Type': 'application/json' },
    body,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
