"use client";

import {
  AreaData,
  AreaSeries,
  CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeries,
  UTCTimestamp,
} from "lightweight-charts";
import React, { useCallback, useEffect, useRef } from "react";
import { OHLCV } from "@/lib/birdeye";

export type ChartStyle = "candles" | "line" | "area";

interface TradingChartProps {
  data: OHLCV[];
  chartStyle?: ChartStyle;
  showGrid?: boolean;
  fitSignal?: number;
}

export function TradingChart({ data, chartStyle = "candles", showGrid = true, fitSignal = 0 }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const getCandlestickData = useCallback(() => {
    return data
      .filter((d) =>
        d.unixTime !== undefined &&
        d.o !== undefined &&
        d.h !== undefined &&
        d.l !== undefined &&
        d.c !== undefined
      )
      .map((d) => ({
        time: d.unixTime as UTCTimestamp,
        open: d.o,
        high: d.h,
        low: d.l,
        close: d.c,
      } satisfies CandlestickData<UTCTimestamp>))
      .sort((a, b) => a.time - b.time)
      .filter((d, index, self) => index === 0 || d.time !== self[index - 1].time);
  }, [data]);

  const getLineData = useCallback(() => {
    return getCandlestickData().map((d) => ({
      time: d.time,
      value: d.close,
    } satisfies LineData<UTCTimestamp>));
  }, [getCandlestickData]);

  const getAreaData = useCallback(() => {
    return getCandlestickData().map((d) => ({
      time: d.time,
      value: d.close,
    } satisfies AreaData<UTCTimestamp>));
  }, [getCandlestickData]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#d4d4d8",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      width: container.clientWidth || 600,
      height: container.clientHeight || 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      autoSize: true,
    });
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      areaSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (candleSeriesRef.current) {
      chart.removeSeries(candleSeriesRef.current);
      candleSeriesRef.current = null;
    }
    if (lineSeriesRef.current) {
      chart.removeSeries(lineSeriesRef.current);
      lineSeriesRef.current = null;
    }
    if (areaSeriesRef.current) {
      chart.removeSeries(areaSeriesRef.current);
      areaSeriesRef.current = null;
    }

    if (chartStyle === "line") {
      lineSeriesRef.current = chart.addSeries(LineSeries, {
        color: "#8b8ff8",
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: true,
      });
      return;
    }

    if (chartStyle === "area") {
      areaSeriesRef.current = chart.addSeries(AreaSeries, {
        lineColor: "#8b8ff8",
        topColor: "rgba(107,111,245,0.35)",
        bottomColor: "rgba(107,111,245,0)",
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: true,
      });
      return;
    }

    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      lastValueVisible: true,
      priceLineVisible: true,
    });
  }, [chartStyle]);

  useEffect(() => {
    if (!chartRef.current) return;
    const candleData = getCandlestickData();

    candleSeriesRef.current?.setData(candleData);
    lineSeriesRef.current?.setData(getLineData());
    areaSeriesRef.current?.setData(getAreaData());

    if (candleData.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  }, [chartStyle, data, getCandlestickData, getLineData, getAreaData]);

  useEffect(() => {
    chartRef.current?.applyOptions({
      grid: {
        vertLines: { color: showGrid ? "rgba(255, 255, 255, 0.05)" : "transparent" },
        horzLines: { color: showGrid ? "rgba(255, 255, 255, 0.05)" : "transparent" },
      },
    });
  }, [showGrid]);

  useEffect(() => {
    chartRef.current?.timeScale().fitContent();
  }, [fitSignal]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "100%", height: "100%", minHeight: "400px" }}
    />
  );
}
