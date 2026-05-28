import { format } from 'date-fns';
import type { ChainTransfers, DailyVolumeRow } from './types';

export function isCexLabel(label: string | null | undefined): boolean {
  return typeof label === 'string' && label.includes('🏦');
}

export interface DailyFlowRow {
  date: string;
  inflow: number;
  outflow: number;
}

export function buildDailyFlows(data: ChainTransfers[]): DailyFlowRow[] {
  const dayMap: Record<string, { inflow: number; outflow: number }> = {};

  for (const { transfers } of data) {
    for (const tx of transfers) {
      const fromCex = isCexLabel(tx.from_address_label);
      const toCex = isCexLabel(tx.to_address_label);

      // Exchange-to-exchange: neutral, skip
      if (fromCex && toCex) continue;

      const day = format(new Date(tx.block_timestamp), 'yyyy-MM-dd');
      if (!dayMap[day]) dayMap[day] = { inflow: 0, outflow: 0 };

      const usd = tx.transfer_value_usd || 0;
      if (toCex) dayMap[day].inflow += usd;
      else if (fromCex) dayMap[day].outflow += usd;
    }
  }

  return Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { inflow, outflow }]) => ({ date, inflow, outflow }));
}

export function buildDailyVolume(data: ChainTransfers[]): DailyVolumeRow[] {
  const dayMap: Record<string, DailyVolumeRow> = {};

  for (const { chain, transfers } of data) {
    for (const tx of transfers) {
      const day = format(new Date(tx.block_timestamp), 'yyyy-MM-dd');
      if (!dayMap[day]) dayMap[day] = { date: day };
      dayMap[day][chain] = ((dayMap[day][chain] as number) || 0) + (tx.transfer_value_usd || 0);
    }
  }

  return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
}

export function totalByChain(data: ChainTransfers[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const { chain, transfers } of data) {
    totals[chain] = transfers.reduce((sum, tx) => sum + (tx.transfer_value_usd || 0), 0);
  }
  return totals;
}

export function grandTotal(data: ChainTransfers[]): number {
  return data.reduce(
    (sum, { transfers }) => sum + transfers.reduce((s, tx) => s + (tx.transfer_value_usd || 0), 0),
    0
  );
}

export function totalTransferCount(data: ChainTransfers[]): number {
  return data.reduce((sum, { transfers }) => sum + transfers.length, 0);
}

export function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}
