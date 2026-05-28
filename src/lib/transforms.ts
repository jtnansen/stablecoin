import { format } from 'date-fns';
import type { ChainTransfers, DailyVolumeRow } from './types';

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
