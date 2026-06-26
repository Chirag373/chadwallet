"use client";

import { useCallback, useEffect, useState } from "react";
import { AreaChart, ChartCandlestick, ChartLine, Grid2X2, Maximize2 } from "lucide-react";
import { TradingChart, type ChartStyle } from "./TradingChart";
import { OHLCV, CHART_INTERVALS } from "@/lib/birdeye";

const INTERVALS = Object.keys(CHART_INTERVALS);
const CHART_STYLES: Array<{ value: ChartStyle; label: string; icon: typeof ChartCandlestick }> = [
  { value: "candles", label: "Candles", icon: ChartCandlestick },
  { value: "line", label: "Line", icon: ChartLine },
  { value: "area", label: "Area", icon: AreaChart },
];

interface ChartSectionProps {
  address: string;
  initialData: OHLCV[];
  initialInterval?: string;
}

export function ChartSection({ address, initialData, initialInterval = "15m" }: ChartSectionProps) {
  const [activeInterval, setActiveInterval] = useState(initialInterval);
  const [chartData, setChartData] = useState<OHLCV[]>(initialData);
  const [chartStyle, setChartStyle] = useState<ChartStyle>("candles");
  const [showGrid, setShowGrid] = useState(true);
  const [fitSignal, setFitSignal] = useState(0);
  const [isLoading, setIsLoading] = useState(initialData.length === 0);

  const loadChartData = useCallback(async (interval: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ address, interval });
      const res = await fetch(`/api/ohlcv?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        setChartData([]);
        return;
      }

      const json = (await res.json()) as { data?: OHLCV[] };
      setChartData(json.data || []);
    } catch (err) {
      console.error("Error loading chart data:", err);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (initialData.length > 0) return;
    let cancelled = false;

    const params = new URLSearchParams({ address, interval: initialInterval });
    fetch(`/api/ohlcv?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json: { data?: OHLCV[] }) => {
        if (!cancelled) setChartData(json.data || []);
      })
      .catch((err) => {
        console.error("Error loading chart data:", err);
        if (!cancelled) setChartData([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, initialData.length, initialInterval]);

  const handleIntervalChange = (interval: string) => {
    if (interval === activeInterval) return;
    setActiveInterval(interval);
    void loadChartData(interval);
  };

  return (
    <div className="flex-1 min-h-[420px] glass-card rounded-[24px] border border-white/5 p-4 overflow-hidden relative shadow-xl flex flex-col" data-chart-section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1">
          {INTERVALS.map((interval) => (
            <button
              key={interval}
              onClick={() => handleIntervalChange(interval)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 ${
                activeInterval === interval
                  ? "bg-accent-primary text-white shadow-[0_0_16px_rgba(107,111,245,0.4)]"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {CHART_INTERVALS[interval].label}
            </button>
          ))}

          {isLoading && (
            <div className="ml-2 w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="flex rounded-xl border border-white/5 bg-black/20 p-1">
            {CHART_STYLES.map((style) => {
              const Icon = style.icon;
              return (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setChartStyle(style.value)}
                  title={`${style.label} chart`}
                  aria-label={`${style.label} chart`}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    chartStyle === style.value
                      ? "bg-accent-primary text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowGrid((value) => !value)}
            title={showGrid ? "Hide grid" : "Show grid"}
            aria-label={showGrid ? "Hide chart grid" : "Show chart grid"}
            aria-pressed={showGrid}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 transition-colors ${
              showGrid ? "bg-white/10 text-white" : "bg-black/20 text-zinc-500 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Grid2X2 className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setFitSignal((value) => value + 1)}
            title="Fit chart"
            aria-label="Fit chart to data"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 relative min-h-0">
        {chartData.length > 0 ? (
          <TradingChart
            key={address}
            data={chartData}
            chartStyle={chartStyle}
            showGrid={showGrid}
            fitSignal={fitSignal}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-medium">
            {isLoading ? "Loading chart..." : "No chart data available for this token."}
          </div>
        )}
      </div>
    </div>
  );
}
