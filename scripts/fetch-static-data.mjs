#!/usr/bin/env node
/**
 * Fetches 30 days of USDC CEX transfer data from Nansen API, pre-aggregates
 * per chain per day, and writes src/data/usdc-flows.json.
 *
 * Usage:
 *   node scripts/fetch-static-data.mjs
 *   NANSEN_API_KEY=xxx node scripts/fetch-static-data.mjs
 *
 * Reads NANSEN_API_KEY from .env.local if present.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Parse .env.local without requiring dotenv
const envPath = join(ROOT, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const NANSEN_API_URL = 'https://api.nansen.ai/api/v1/tgm/transfers';
const CONCURRENCY = 4;
const DAYS = 30;

const USDC_CHAINS = [
  { chain: 'ethereum', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', label: 'Ethereum', shortLabel: 'ETH', color: '#627EEA' },
  { chain: 'arbitrum', address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', label: 'Arbitrum', shortLabel: 'ARB', color: '#28A0F0' },
  { chain: 'base', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', label: 'Base', shortLabel: 'BASE', color: '#0052FF' },
  { chain: 'optimism', address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', label: 'Optimism', shortLabel: 'OP', color: '#FF0420' },
  { chain: 'polygon', address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', label: 'Polygon', shortLabel: 'POL', color: '#8247E5' },
  { chain: 'avalanche', address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', label: 'Avalanche', shortLabel: 'AVAX', color: '#E84142' },
  { chain: 'bnb', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', label: 'BNB Chain', shortLabel: 'BNB', color: '#F3BA2F' },
  { chain: 'solana', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', label: 'Solana', shortLabel: 'SOL', color: '#9945FF' },
];

function isCexLabel(label) {
  return typeof label === 'string' && label.includes('🏦');
}

function nDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split('T')[0];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

async function fetchAllTransfers(chain, address, from, to, apiKey) {
  const transfers = [];
  let page = 1;

  while (true) {
    const res = await fetch(NANSEN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apiKey },
      body: JSON.stringify({
        chain,
        token_address: address,
        date: { from, to },
        pagination: { page, per_page: 1000 },
        filters: { include_cex: true, include_dex: false, non_exchange_transfers: false },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const batch = json.data ?? [];
    transfers.push(...batch);

    if (json.pagination?.is_last_page || batch.length < 1000) break;
    page++;
    console.log(`    page ${page}...`);
  }

  return transfers;
}

function aggregateTransfers(chain, label, color, shortLabel, transfers) {
  const dayMap = {};

  for (const tx of transfers) {
    const day = tx.block_timestamp.slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { date: day, volume: 0, inflow: 0, outflow: 0, count: 0 };

    const fromCex = isCexLabel(tx.from_address_label);
    const toCex = isCexLabel(tx.to_address_label);
    const usd = tx.transfer_value_usd || 0;

    dayMap[day].volume += usd;
    dayMap[day].count += 1;

    // inflow = wallet → exchange, outflow = exchange → wallet, cex↔cex excluded
    if (!fromCex && toCex) dayMap[day].inflow += usd;
    else if (fromCex && !toCex) dayMap[day].outflow += usd;
  }

  const days = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  const totalVolume = days.reduce((s, d) => s + d.volume, 0);
  const totalCount = days.reduce((s, d) => s + d.count, 0);

  return { chain, label, color, shortLabel, totalCount, totalVolume, days };
}

async function run() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error('Error: NANSEN_API_KEY not set. Add it to .env.local or pass as an env var.');
    process.exit(1);
  }

  const from = nDaysAgo(DAYS);
  const to = todayStr();
  const fetchedAt = new Date().toISOString();

  console.log(`Fetching USDC CEX flows: ${from} → ${to}\n`);

  const chains = [];

  for (let i = 0; i < USDC_CHAINS.length; i += CONCURRENCY) {
    const batch = USDC_CHAINS.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async ({ chain, address, label, shortLabel, color }) => {
        try {
          process.stdout.write(`  ${label}...`);
          const transfers = await fetchAllTransfers(chain, address, from, to, apiKey);
          console.log(` ${transfers.length.toLocaleString()} transfers`);
          return aggregateTransfers(chain, label, color, shortLabel, transfers);
        } catch (err) {
          console.log(` ERROR: ${err.message}`);
          return { chain, label, color, shortLabel, totalCount: 0, totalVolume: 0, error: err.message, days: [] };
        }
      })
    );
    chains.push(...results);
  }

  const output = { fetchedAt, from, to, chains };
  const outPath = join(ROOT, 'src/data/usdc-flows.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  const totalVol = chains.reduce((s, c) => s + c.totalVolume, 0);
  const totalTx = chains.reduce((s, c) => s + c.totalCount, 0);
  console.log(`\nSaved → ${outPath}`);
  console.log(`Total: $${(totalVol / 1e9).toFixed(2)}B across ${totalTx.toLocaleString()} transfers`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
