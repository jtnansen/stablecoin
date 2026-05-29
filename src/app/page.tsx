import type { StaticData, DailyVolumeRow } from '@/lib/types';
import type { DailyFlowRow } from '@/lib/transforms';
import { StatCard } from '@/components/StatCard';
import { UsdcFlowsChart } from '@/components/UsdcFlowsChart';
import { FlowsChart } from '@/components/FlowsChart';
import { formatUsd } from '@/lib/transforms';
import rawData from '@/data/usdc-flows.json';

const data = rawData as StaticData;

function buildDailyVolume(chains: StaticData['chains']): DailyVolumeRow[] {
  const map: Record<string, DailyVolumeRow> = {};
  for (const c of chains) {
    for (const d of c.days) {
      if (!map[d.date]) map[d.date] = { date: d.date };
      map[d.date][c.chain] = d.volume;
    }
  }
  return Object.values(map).sort((a, b) => (a.date as string).localeCompare(b.date as string));
}

function buildDailyFlows(chains: StaticData['chains']): DailyFlowRow[] {
  const map: Record<string, { inflow: number; outflow: number }> = {};
  for (const c of chains) {
    for (const d of c.days) {
      if (!map[d.date]) map[d.date] = { inflow: 0, outflow: 0 };
      map[d.date].inflow += d.inflow;
      map[d.date].outflow += d.outflow;
    }
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { inflow, outflow }]) => ({ date, inflow, outflow }));
}

export default function Page() {
  const { chains, from, to, fetchedAt } = data;

  const dailyVolume = buildDailyVolume(chains);
  const dailyFlows = buildDailyFlows(chains);

  const total = chains.reduce((s, c) => s + c.totalVolume, 0);
  const txCount = chains.reduce((s, c) => s + c.totalCount, 0);

  const updatedLabel = fetchedAt
    ? new Date(fetchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Stablecoin Dashboard</h1>
            <p className="text-zinc-500 text-xs mt-0.5">USDC · CEX flows · all chains</p>
          </div>
          {from && to && (
            <div className="text-right">
              <p className="text-zinc-400 text-xs font-mono">{from} → {to}</p>
              {updatedLabel && (
                <p className="text-zinc-600 text-xs mt-0.5">Updated {updatedLabel}</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="col-span-2 sm:col-span-1 lg:col-span-1">
              <StatCard
                label="Total CEX Volume"
                value={total > 0 ? formatUsd(total) : '—'}
                sub={total > 0 ? `${txCount.toLocaleString()} transfers` : 'Run fetch-data script'}
              />
            </div>
            {chains.map(({ chain, label, color, shortLabel, totalVolume, totalCount }) => (
              <StatCard
                key={chain}
                label={shortLabel}
                value={formatUsd(totalVolume)}
                sub={`${totalCount.toLocaleString()} txs`}
                color={color}
              />
            ))}
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-white">USDC CEX Flows by Chain</h2>
            <p className="text-zinc-500 text-xs mt-0.5">Daily transfer volume (USD) · CEX only</p>
          </div>
          <UsdcFlowsChart data={dailyVolume} chains={chains} />
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-white">USDC CEX Inflow vs Outflow</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              <span className="text-emerald-500">Inflow</span> = wallet → exchange &nbsp;·&nbsp;
              <span className="text-red-500">Outflow</span> = exchange → wallet &nbsp;·&nbsp;
              exchange↔exchange excluded
            </p>
          </div>
          <FlowsChart data={dailyFlows} />
        </section>

        {chains.length > 0 && (
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
                {chains
                  .slice()
                  .sort((a, b) => b.totalVolume - a.totalVolume)
                  .map(({ chain, label, color, totalCount, totalVolume, error }) => {
                    const pct = total > 0 ? (totalVolume / total) * 100 : 0;
                    const avg = totalCount > 0 ? totalVolume / totalCount : 0;
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
                          {totalCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right text-white font-mono font-medium">
                          {formatUsd(totalVolume)}
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
