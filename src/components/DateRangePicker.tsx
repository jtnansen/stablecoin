'use client';

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function DateRangePicker({ from, to, onChange, disabled }: Props) {
  const activePreset = PRESETS.find((p) => {
    const expected = daysAgo(p.days);
    return from === expected && to === today();
  });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            disabled={disabled}
            onClick={() => onChange(daysAgo(p.days), today())}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${activePreset?.label === p.label
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }
              disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <span className="text-zinc-600 text-xs hidden sm:block">or</span>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={from}
          max={to}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value, to)}
          className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-300
                     focus:outline-none focus:border-blue-500 disabled:opacity-40"
        />
        <span className="text-zinc-500 text-xs">→</span>
        <input
          type="date"
          value={to}
          min={from}
          max={today()}
          disabled={disabled}
          onChange={(e) => onChange(from, e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-300
                     focus:outline-none focus:border-blue-500 disabled:opacity-40"
        />
      </div>
    </div>
  );
}
