"use client";

import {
  Area,
  AreaChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  label: string;
  unit?: string;
  values: number[];
  /** Index range [start, end] where the anomaly band is drawn. */
  anomalyBand?: [number, number];
  /** Color tone — "neutral" or "ember". Only the spiking metric uses ember. */
  tone?: "neutral" | "ember";
  /** Show a small "p95" or "peak" callout pill with the max value. */
  peakCallout?: boolean;
}

/**
 * TelemetryChart — heavily restyled Recharts AreaChart.
 * No axis labels, no gridlines on the chart body, just a hairline floor
 * and a ReferenceArea band for the anomaly region. The line is drawn as
 * an Area with a 1-stop gradient that fades from ember to transparent
 * (only when the spiking metric, otherwise oyster).
 */
export function TelemetryChart({
  label,
  unit,
  values,
  anomalyBand,
  tone = "neutral",
  peakCallout = false,
}: Props) {
  const reduced = useReducedMotion();
  const data = values.map((v, i) => ({ i, v }));
  const peak = Math.max(...values);
  const isEmber = tone === "ember";
  const strokeColor = isEmber ? "var(--ember-400)" : "var(--oyster)";
  const fillId = `tc-${label.replace(/\s/g, "-")}`;

  return (
    <div className="relative">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--slate)]">
          {label}
        </span>
        {peakCallout && (
          <span className="font-mono text-[11px] num text-[color:var(--ember-400)]">
            peak · {peak}
            {unit ? unit : ""}
          </span>
        )}
      </div>
      <div className="h-[88px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isEmber ? "var(--ember-400)" : "var(--oyster)"}
                  stopOpacity={isEmber ? 0.34 : 0.18}
                />
                <stop offset="100%" stopColor="var(--ink-surface)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis hide domain={["dataMin", "dataMax"]} />
            {anomalyBand && (
              <ReferenceArea
                x1={anomalyBand[0]}
                x2={anomalyBand[1]}
                strokeOpacity={0}
                fill="var(--ember-edge)"
                fillOpacity={0.13}
              />
            )}
            <Area
              type="monotone"
              dataKey="v"
              stroke={strokeColor}
              strokeWidth={1.25}
              fill={`url(#${fillId})`}
              isAnimationActive={!reduced}
              animationDuration={1200}
              animationEasing="ease-out"
              dot={false}
            />
            <Tooltip
              cursor={{ stroke: "var(--ember-400)", strokeWidth: 0.5, strokeDasharray: "2 2" }}
              contentStyle={{
                background: "var(--ink-elevated)",
                border: "1px solid var(--hairline-mid)",
                borderRadius: 3,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
              labelStyle={{ color: "var(--slate)" }}
              itemStyle={{ color: "var(--bone)" }}
              formatter={(value: number) => [
                `${value}${unit ?? ""}`,
                label,
              ]}
              labelFormatter={() => ""}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
