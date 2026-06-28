import React, { useMemo, useState } from 'react';

export interface TrendPoint {
  date: string;
  posts: number;
  users: number;
}

interface Series {
  key: 'posts' | 'users';
  label: string;
  color: string;
}

const SERIES: Series[] = [
  { key: 'posts', label: 'Community Posts', color: '#5b8cff' },
  { key: 'users', label: 'New Users', color: '#34d399' },
];

// Smooth path through points using a monotone-ish cubic (Catmull-Rom -> bezier).
const smoothPath = (pts: Array<{ x: number; y: number }>): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
};

export const TrendChart: React.FC<{ data: TrendPoint[] }> = ({ data }) => {
  const [hover, setHover] = useState<number | null>(null);

  const W = 760;
  const H = 240;
  const pad = { top: 20, right: 16, bottom: 28, left: 32 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const maxY = useMemo(() => {
    const m = Math.max(1, ...data.map((d) => Math.max(d.posts, d.users)));
    return Math.ceil(m / 4) * 4 || 4; // round up to a clean grid
  }, [data]);

  const xFor = (i: number) => pad.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yFor = (v: number) => pad.top + innerH - (v / maxY) * innerH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: pad.top + innerH - f * innerH,
    val: Math.round(maxY * f),
  }));

  return (
    <div className="trend-chart">
      <div className="trend-legend">
        {SERIES.map((s) => (
          <span key={s.key} className="trend-legend-item">
            <span className="trend-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img">
        <defs>
          {SERIES.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* grid */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={pad.left} y1={g.y} x2={W - pad.right} y2={g.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={pad.left - 8} y={g.y + 4} textAnchor="end" fontSize="10" fill="#5b6783">
              {g.val}
            </text>
          </g>
        ))}

        {SERIES.map((s) => {
          const pts = data.map((d, i) => ({ x: xFor(i), y: yFor(d[s.key]) }));
          const line = smoothPath(pts);
          const area = `${line} L ${xFor(data.length - 1)},${pad.top + innerH} L ${xFor(0)},${pad.top + innerH} Z`;
          return (
            <g key={s.key}>
              <path d={area} fill={`url(#grad-${s.key})`} />
              <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}

        {/* hover guideline + dots */}
        {hover !== null && (
          <line
            x1={xFor(hover)}
            y1={pad.top}
            x2={xFor(hover)}
            y2={pad.top + innerH}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}
        {hover !== null &&
          SERIES.map((s) => (
            <circle key={s.key} cx={xFor(hover)} cy={yFor(data[hover][s.key])} r="4" fill={s.color} stroke="#0a0e1a" strokeWidth="2" />
          ))}

        {/* x labels (every other) */}
        {data.map((d, i) =>
          i % 2 === 0 ? (
            <text key={i} x={xFor(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#5b6783">
              {new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </text>
          ) : null
        )}

        {/* hover hit areas */}
        {data.map((_, i) => (
          <rect
            key={i}
            x={xFor(i) - innerW / (data.length * 2)}
            y={pad.top}
            width={innerW / data.length}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {hover !== null && (
        <div className="trend-tooltip">
          <strong>{new Date(data[hover].date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</strong>
          <span><span className="trend-dot" style={{ background: '#5b8cff' }} /> {data[hover].posts} posts</span>
          <span><span className="trend-dot" style={{ background: '#34d399' }} /> {data[hover].users} users</span>
        </div>
      )}
    </div>
  );
};
