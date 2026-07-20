// Server-rendered daily-count sparkbars for the admin overview. One metric
// per tile: the title carries identity, so every tile shares the brand hue
// (validated 3:1+ against the light surface). Native <title> tooltips ride
// full-height hit slots, wider than the 4px marks.
export type TrendBin = { date: string; count: number };

const SLOT = 6;
const BAR = 4;
const HEIGHT = 44;
const PLOT = 38;

export function TrendSparkline({
  title,
  bins,
  recentLabel,
  recentCount,
}: {
  title: string;
  bins: TrendBin[];
  recentLabel: string;
  recentCount: number;
}) {
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  const max = Math.max(1, ...bins.map((bin) => bin.count));
  const width = bins.length * SLOT - (SLOT - BAR);

  return (
    <div className="rounded-2xl bg-surface-sub p-4">
      <p className="text-2xl font-extrabold tracking-tight">{total}</p>
      <p className="mt-1 text-xs font-semibold text-ink-soft">{title}</p>
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`${title}: ${total}`}
        preserveAspectRatio="none"
        className="mt-3 h-11 w-full text-primary"
      >
        {bins.map((bin, index) => {
          const barHeight =
            bin.count > 0 ? Math.max(2, (bin.count / max) * PLOT) : 0;
          return (
            <g key={bin.date}>
              <rect
                x={index * SLOT}
                y={0}
                width={SLOT}
                height={HEIGHT}
                fill="transparent"
              >
                <title>{`${bin.date} · ${bin.count}`}</title>
              </rect>
              {barHeight > 0 && (
                <rect
                  x={index * SLOT}
                  y={HEIGHT - 1 - barHeight}
                  width={BAR}
                  height={barHeight}
                  rx={1.5}
                  fill="currentColor"
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}
        <rect
          x={0}
          y={HEIGHT - 1}
          width={width}
          height={1}
          fill="currentColor"
          opacity={0.18}
        />
      </svg>
      <p className="mt-2 text-[11px] font-bold text-ink-faint">
        {recentLabel} <span className="text-ink-soft">{recentCount}</span>
      </p>
    </div>
  );
}
