'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import type { DailyVolumeRow } from '@/lib/types';
import { formatUsd } from '@/lib/transforms';

interface ChainMeta {
  chain: string;
  label: string;
  color: string;
}

interface Props {
  data: DailyVolumeRow[];
  chains: ChainMeta[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl min-w-[180px]">
      <p className="text-zinc-400 text-xs mb-2">{label}</p>
      {payload
        .slice()
        .reverse()
        .map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm inline-block" style={{ background: entry.fill }} />
              <span className="text-zinc-300">{entry.name}</span>
            </span>
            <span className="text-white font-mono">{formatUsd(entry.value)}</span>
          </div>
        ))}
      <div className="border-t border-zinc-700 mt-2 pt-2 flex justify-between text-xs">
        <span className="text-zinc-400">Total</span>
        <span className="text-white font-mono font-semibold">{formatUsd(total)}</span>
      </div>
    </div>
  );
}

export function UsdcFlowsChart({ data, chains }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
        No transfer data for this period
      </div>
    );
  }

  const formattedData = data.map((row) => ({
    ...row,
    date: format(new Date(row.date), 'MMM d'),
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={formattedData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatUsd(v)}
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
          formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
        />
        {chains.map(({ chain, label, color }) => (
          <Bar key={chain} dataKey={chain} name={label} stackId="volume" fill={color} radius={0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
