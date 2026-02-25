import { useEffect, useRef } from 'react'
import { init, dispose } from 'klinecharts'

interface ChatsProps {
  data?: {
    prices?: [number, number][];
    total_volumes?: [number, number][];
  };
  symbol?: string;
  timeRange?: string;
  height?: string | number;
  width?: string | number;
}

export const Chats = ({ data, symbol = 'BTC/USD', timeRange = '1', height = '100%', width = '100%' }: ChatsProps) => {
  const chartIdRef = useRef<string>(`chart-${Math.random().toString(36).substr(2, 9)}`);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    const chartId = chartIdRef.current;
    const containerElement = document.getElementById(chartId);

    if (!containerElement) return;

    // Dispose existing chart if it exists
    if (chartInstanceRef.current) {
      dispose(chartId);
      chartInstanceRef.current = null;
    }

    const chart = init(chartId);
    chartInstanceRef.current = chart;

    // Handle resize to ensure chart covers full width
    const handleResize = () => {
      if (chartInstanceRef.current && containerElement) {
        const rect = containerElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          chartInstanceRef.current.resize();
        }
      }
    };

    // Add resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerElement);

    // Also listen to window resize
    window.addEventListener('resize', handleResize);

    // Initial resize after a short delay to ensure container is rendered
    const resizeTimeout = setTimeout(handleResize, 100);

    if (chart) {
      // Configure chart styles to match Figma dark theme design
      chart.setStyles({
        grid: {
          show: true,
          horizontal: {
            show: true,
            size: 1,
            color: 'rgba(53, 53, 62, 0.5)',
            style: 'dashed',
            dashedValue: [3, 3],
          },
          vertical: {
            show: true,
            size: 1,
            color: 'rgba(53, 53, 62, 0.5)',
            style: 'dashed',
            dashedValue: [3, 3],
          },
        },
        candle: {
          type: 'candle_solid',
          bar: {
            upColor: '#13B562',
            downColor: '#FF6B6B',
            noChangeColor: '#888888',
            upBorderColor: '#13B562',
            downBorderColor: '#FF6B6B',
            noChangeBorderColor: '#888888',
            upWickColor: '#13B562',
            downWickColor: '#FF6B6B',
            noChangeWickColor: '#888888',
          },
          priceMark: {
            show: true,
            high: {
              show: false,
            },
            low: {
              show: false,
            },
            last: {
              show: true,
              upColor: '#13B562',
              downColor: '#FF6B6B',
              noChangeColor: '#888888',
              line: {
                show: true,
                style: 'dashed',
                dashedValue: [4, 4],
                size: 1,
              },
              text: {
                show: true,
                size: 11,
                paddingLeft: 4,
                paddingTop: 2,
                paddingRight: 4,
                paddingBottom: 2,
                borderRadius: 2,
                color: '#FFFFFF',
              },
            },
          },
          tooltip: {
            showRule: 'follow_cross',
            showType: 'standard',
            labels: ['O: ', 'H: ', 'L: ', 'C: '],
            text: {
              size: 12,
              color: '#D1D4DC',
              marginLeft: 8,
              marginTop: 6,
              marginRight: 8,
              marginBottom: 0,
            },
          },
        },
        xAxis: {
          show: true,
          size: 'auto',
          axisLine: {
            show: true,
            color: '#35353E',
            size: 1,
          },
          tickLine: {
            show: false,
          },
          tickText: {
            show: true,
            color: '#788099',
            size: 11,
            marginStart: 4,
            marginEnd: 4,
          },
        },
        yAxis: {
          show: true,
          size: 'auto',
          axisLine: {
            show: true,
            color: '#35353E',
            size: 1,
          },
          tickLine: {
            show: false,
          },
          tickText: {
            show: true,
            color: '#788099',
            size: 11,
            marginStart: 4,
            marginEnd: 4,
          },
        },
        crosshair: {
          show: true,
          horizontal: {
            show: true,
            line: {
              show: true,
              style: 'dashed',
              dashedValue: [4, 4],
              color: '#788099',
              size: 1,
            },
            text: {
              show: true,
              color: '#FFFFFF',
              size: 11,
              paddingLeft: 4,
              paddingRight: 4,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 2,
              backgroundColor: '#505058',
            },
          },
          vertical: {
            show: true,
            line: {
              show: true,
              style: 'dashed',
              dashedValue: [4, 4],
              color: '#788099',
              size: 1,
            },
            text: {
              show: true,
              color: '#FFFFFF',
              size: 11,
              paddingLeft: 4,
              paddingRight: 4,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 2,
              backgroundColor: '#505058',
            },
          },
        },
        indicator: {
          lastValueMark: {
            show: false,
          },
          tooltip: {
            showRule: 'follow_cross',
            showType: 'standard',
          },
        },
        separator: {
          size: 1,
          color: '#35353E',
        },
      } as any);

      // klinecharts v10: use setDataLoader instead of applyNewData (removed in v10)
      const days = Number(timeRange) || 1;
      const span = 1;
      const periodType = days <= 1 ? 'hour' : 'day';

      chart.setSymbol({ ticker: symbol });
      chart.setPeriod({ span, type: periodType });

      chart.setDataLoader({
        getBars: ({ callback }: { callback: (data: any[]) => void }) => {
          if (!data?.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
            callback([]);
            return;
          }

          const volumeMap = new Map<number, number>();
          if (data.total_volumes && Array.isArray(data.total_volumes)) {
            data.total_volumes.forEach(([ts, vol]: [number, number]) => {
              volumeMap.set(ts, vol);
            });
          }

          let intervalMs: number;
          if (days === 1) {
            intervalMs = 60 * 60 * 1000;
          } else if (days <= 7) {
            intervalMs = 4 * 60 * 60 * 1000;
          } else if (days <= 30) {
            intervalMs = 24 * 60 * 60 * 1000;
          } else {
            intervalMs = 7 * 24 * 60 * 60 * 1000;
          }

          const groupedData = new Map<number, number[]>();
          data.prices.forEach(([timestamp, price]: [number, number]) => {
            const intervalTimestamp = Math.floor(timestamp / intervalMs) * intervalMs;
            if (!groupedData.has(intervalTimestamp)) {
              groupedData.set(intervalTimestamp, []);
            }
            groupedData.get(intervalTimestamp)!.push(price);
          });

          const ohlcvData: Array<{
            timestamp: number;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
          }> = [];

          Array.from(groupedData.entries())
            .sort(([a], [b]) => a - b)
            .forEach(([timestamp, groupPrices]) => {
              if (groupPrices.length > 0) {
                const open = groupPrices[0];
                const close = groupPrices[groupPrices.length - 1];
                const high = Math.max(...groupPrices);
                const low = Math.min(...groupPrices);
                const volume = volumeMap.get(timestamp) || 0;
                ohlcvData.push({ timestamp, open, high, low, close, volume });
              }
            });

          callback(ohlcvData);
        },
      });
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      if (containerElement) {
        resizeObserver.unobserve(containerElement);
      }
      if (chartInstanceRef.current) {
        dispose(chartId);
        chartInstanceRef.current = null;
      }
    };
  }, [data, symbol, timeRange]);

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <div
        id={chartIdRef.current}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          minWidth: 0,
          minHeight: 0,
        }}
      />
    </div>
  );
}