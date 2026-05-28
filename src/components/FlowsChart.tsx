'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import type { DailyFlowRow } from '@/lib/transforms';
import { formatUsd } from '@/lib/transforms';

interface Props {
  data: DailyFlowRow[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const inflow = payload.find((p: any) => p.dataKey === 'inflow')?.value ?? 0;
  const outflowRaw = payload.find((p: any) => p.dataKey === 'outflowNeg')?.value ?? 0;
  const outflow = Math.abs(outflowRaw);
  const net = inflow - outflow;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl min-w-[180px]">
      <p className="text-zinc-400 text-xs mb-2">{label}</p>
      <div className="flex items-center justify-between gap-4 text-xs mb-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />
          <span className="text-zinc-300">Inflow</span>
        </span>
        <span className="text-emerald-400 font-mono">{formatUsd(inflow)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs mb-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />
          <span className="text-zinc-300">Outflow</span>
        </span>
        <span className="text-red-400 font-mono">{formatUsd(outflow)}</span>
      </div>
      <div className="border-t border-zinc-700 mt-2 pt-2 flex justify-between text-xs">
        <span className="text-zinc-400">Net</span>
        <span className={`font-mono font-semibold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {net >= 0 ? '+' : ''}{formatUsd(net)}
        </span>
      </div>
    </div>
  );
}

export function FlowsChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
        No flow data for this period
      </div>
    );
  }

  const chartData = data.map((row) => ({
    date: format(new Date(row.date), 'MMM d'),
    inflow: row.inflow,
    outflowNeg: -row.outflow,
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <ReferenceLine y={0} stroke="#52525b" strokeWidth={1.5} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatUsd(Math.abs(v))}
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="inflow" name="Inflow" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={40} />
        <Bar dataKey="outflowNeg" name="Outflow" fill="#ef4444" radius={[0, 0, 3, 3]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
