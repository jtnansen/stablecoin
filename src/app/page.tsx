'use client';

import { useEffect, useState, useCallback } from 'react';
import { UsdcFlowsChart } from '@/components/UsdcFlowsChart';
import { FlowsChart } from '@/components/FlowsChart';
import { StatCard } from '@/components/StatCard';
import { DateRangePicker } from '@/components/DateRangePicker';
import { buildDailyVolume, buildDailyFlows, grandTotal, totalByChain, totalTransferCount, formatUsd } from '@/lib/transforms';
import { USDC_CHAINS } from '@/lib/chains';
import type { ChainTransfers, DailyVolumeRow } from '@/lib/types';
import type { DailyFlowRow } from '@/lib/transforms';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

type Status = 'idle' | 'loading' | 'error' | 'done';

export default function Dashboard() {
  const [from, setFrom] = useState(() => daysAgo(7));
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState<Status>('idle');
  const [chainData, setChainData] = useState<ChainTransfers[]>([]);
  const [dailyVolume, setDailyVolume] = useState<DailyVolumeRow[]>([]);
  const [dailyFlows, setDailyFlows] = useState<DailyFlowRow[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = useCallback(async (fromDate: string, toDate: string) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/usdc-flows?from=${fromDate}&to=${toDate}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      const data: ChainTransfers[] = await res.json();
      setChainData(data);
      setDailyVolume(buildDailyVolume(data));
      setDailyFlows(buildDailyFlows(data));
      setStatus('done');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Unknown error');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchData(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDateChange(newFrom: string, newTo: string) {
    setFrom(newFrom);
    setTo(newTo);
    fetchData(newFrom, newTo);
  }

  const isLoading = status === 'loading';
  const totals = totalByChain(chainData);
  const total = grandTotal(chainData);
  const txCount = totalTransferCount(chainData);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Stablecoin Dashboard</h1>
            <p className="text-zinc-500 text-xs mt-0.5">USDC · CEX flows · all chains</p>
          </div>
          <DateRangePicker from={from} to={to} onChange={handleDateChange} disabled={isLoading} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error banner */}
        {status === 'error' && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
            Failed to load data: {errorMsg}
          </div>
        )}

        {/* Summary stat cards */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="col-span-2 sm:col-span-1 lg:col-span-1">
              <StatCard
                label="Total CEX Volume"
                value={isLoading ? '—' : formatUsd(total)}
                sub={isLoading ? 'loading…' : `${txCount.toLocaleString()} transfers`}
              />
            </div>
            {USDC_CHAINS.slice(0, 8).map(({ chain, label, color, shortLabel }) => (
              <StatCard
                key={chain}
                label={shortLabel}
                value={isLoading ? '—' : formatUsd(totals[chain] ?? 0)}
                sub={
                  isLoading
                    ? ''
                    : `${chainData.find((c) => c.chain === chain)?.transfers.length ?? 0} txs`
                }
                color={color}
              />
            ))}
          </div>
        </section>

        {/* Main chart */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">USDC CEX Flows by Chain</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Daily transfer volume (USD) · CEX only</p>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <span className="w-3 h-3 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
                Fetching {USDC_CHAINS.length} chains…
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="h-[380px] flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin mx-auto" />
                <p className="text-zinc-500 text-sm">Loading transfer data…</p>
              </div>
            </div>
          ) : (
            <UsdcFlowsChart data={dailyVolume} chains={chainData} />
          )}
        </section>

        {/* Inflow / Outflow chart */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">USDC CEX Inflow vs Outflow</h2>
              <p className="text-zinc-500 text-xs mt-0.5">
                <span className="text-emerald-500">Inflow</span> = wallet → exchange &nbsp;·&nbsp;
                <span className="text-red-500">Outflow</span> = exchange → wallet &nbsp;·&nbsp;
                exchange↔exchange excluded
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="h-[380px] flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin mx-auto" />
                <p className="text-zinc-500 text-sm">Loading flow data…</p>
              </div>
            </div>
          ) : (
            <FlowsChart data={dailyFlows} />
          )}
        </section>

        {/* Per-chain breakdown table */}
        {status === 'done' && chainData.length > 0 && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold">Chain Breakdown</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs uppercase tracking-wide border-b border-zinc-800">
                  <th className="text-left px-6 py-3">Chain</th>
                  <th className="text-right px-6 py-3">Transfers</th>
                  <th className="text-right px-6 py-3">Volume (USD)</th>
                  <th className="text-right px-6 py-3">Avg Size</th>
                  <th className="text-right px-6 py-3">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {chainData
                  .slice()
                  .sort((a, b) => (totals[b.chain] ?? 0) - (totals[a.chain] ?? 0))
                  .map(({ chain, label, color, transfers, error }) => {
                    const vol = totals[chain] ?? 0;
                    const pct = total > 0 ? (vol / total) * 100 : 0;
                    const avg = transfers.length > 0 ? vol / transfers.length : 0;
                    return (
                      <tr key={chain} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                            <span className="text-white">{label}</span>
                            {error && (
                              <span
                                className="text-xs text-red-400 bg-red-950 border border-red-800 rounded px-1.5 py-0.5 font-mono truncate max-w-[260px]"
                                title={error}
                              >
                                {error.slice(0, 60)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right text-zinc-300 font-mono">
                          {transfers.length.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right text-white font-mono font-medium">
                          {formatUsd(vol)}
                        </td>
                        <td className="px-6 py-3 text-right text-zinc-400 font-mono">
                          {formatUsd(avg)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: color }}
                              />
                            </div>
                            <span className="text-zinc-400 font-mono text-xs w-10 text-right">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
