"use client";

import { useId, useState } from "react";
import { formatPeriod, type KpiMetric } from "@/lib/kpi";

export type ChartPoint = { period: string; value: number | null };

const W = 320;
const H = 140;
const PAD = { top: 14, right: 16, bottom: 22, left: 8 };

/**
 * One metric, one series, one y-axis. Five small charts side by side rather
 * than one chart with five scales: two measures on two y-scales invent a
 * correlation that is not in the data.
 *
 * Hand-drawn SVG rather than a charting library — twelve points a year does not
 * justify half a megabyte of JavaScript on a hub that has to stay maintainable
 * by one person.
 */
export function KpiChart({
  metric,
  points,
  currency,
}: {
  metric: KpiMetric;
  points: ChartPoint[];
  currency: string;
}) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const known = points.filter((p) => p.value !== null) as {
    period: string;
    value: number;
  }[];

  if (known.length === 0) {
    return (
      <div className="border-line text-muted flex h-[140px] items-center justify-center border border-dashed text-xs">
        No numbers yet
      </div>
    );
  }

  const values = known.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  // A flat series would divide by zero; give it a band so the line sits mid-height.
  const span = max - min || Math.abs(max) || 1;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left + (known.length === 1 ? plotW / 2 : (i / (known.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - ((v - min) / span) * plotH;

  const line = known.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(known.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`;

  const last = known[known.length - 1];
  const active = hover !== null ? known[hover] : null;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${metric.label} by month`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Solid hairline grid, one shade off the surface — never dashed. */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + plotH * t}
            y2={PAD.top + plotH * t}
            stroke="var(--color-line)"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {known.map((p, i) => (
          <circle
            key={p.period}
            cx={x(i)}
            cy={y(p.value)}
            r={hover === i ? 5 : 3.5}
            fill="var(--color-accent)"
            stroke="var(--color-surface)"
            strokeWidth="2"
          />
        ))}

        {/* Only the last point is labelled; a number on every point goes unread. */}
        {hover === null ? (
          <text
            x={x(known.length - 1)}
            y={Math.max(y(last.value) - 10, 12)}
            textAnchor="end"
            className="fill-ink text-[11px] font-bold"
          >
            {metric.format(last.value, currency)}
          </text>
        ) : null}

        {known.map((p, i) => (
          <text
            key={`label-${p.period}`}
            x={x(i)}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === known.length - 1 ? "end" : "middle"}
            className="fill-muted text-[10px]"
          >
            {known.length > 6 && i % 2 === 1 ? "" : formatPeriod(p.period).split(" ")[0]}
          </text>
        ))}

        {/* Hit targets wider than the marks. */}
        {known.map((p, i) => (
          <rect
            key={`hit-${p.period}`}
            x={x(i) - plotW / Math.max(known.length * 2, 2)}
            y={0}
            width={Math.max(plotW / Math.max(known.length, 1), 24)}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {active ? (
          <>
            <line
              x1={x(hover!)}
              x2={x(hover!)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--color-muted)"
              strokeWidth="1"
            />
            <text
              x={hover! > known.length / 2 ? x(hover!) - 8 : x(hover!) + 8}
              y={16}
              textAnchor={hover! > known.length / 2 ? "end" : "start"}
              className="fill-ink text-[11px] font-bold"
            >
              {metric.format(active.value, currency)}
              <tspan className="fill-muted font-normal">
                {" "}
                · {formatPeriod(active.period)}
              </tspan>
            </text>
          </>
        ) : null}
      </svg>
    </figure>
  );
}
