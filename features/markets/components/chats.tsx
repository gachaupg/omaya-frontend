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
      chart.setSymbol({ ticker: symbol });
      
      // Configure chart styles to prevent text overlap and ensure full width
      chart.setStyles({
        grid: {
          show: true,
          horizontal: {
            show: true,
            size: 1,
            color: '#35353E',
            style: 'dashed',
            dashedValue: [4, 4],
          },
          vertical: {
            show: false,
          },
        },
        candle: {
          priceMark: {
            show: true,
            high: {
              show: true,
              color: '#788099',
            },
            low: {
              show: true,
              color: '#788099',
            },
          },
          tooltip: {
            showRule: 'always',
            showType: 'standard',
          },
        },
        xAxis: {
          show: true,
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
          },
        },
        yAxis: {
          show: true,
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
              color: '#788099',
              size: 11,
              paddingLeft: 4,
              paddingRight: 4,
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
              color: '#788099',
              size: 11,
              paddingTop: 4,
              paddingBottom: 4,
            },
          },
        },
      });
      
      // Determine period based on timeRange
      const days = Number(timeRange);
      let periodType: 'minute' | 'hour' | 'day' = 'day';
      let span = 1;
      
      if (days === 1) {
        periodType = 'hour';
        span = 1;
      } else if (days <= 7) {
        periodType = 'hour';
        span = 4;
      } else if (days <= 30) {
        periodType = 'day';
        span = 1;
      } else {
        periodType = 'day';
        span = days <= 90 ? 1 : 7;
      }
      
      chart.setPeriod({ span, type: periodType });

      chart.setDataLoader({
        getBars: ({ callback }) => {
          if (!data?.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
            callback([]);
            return;
          }

          // Convert price data to OHLCV format
          const ohlcvData: Array<{
            timestamp: number;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
          }> = [];

          // Create a map for volumes if available
          const volumeMap = new Map<number, number>();
          if (data.total_volumes && Array.isArray(data.total_volumes)) {
            data.total_volumes.forEach(([timestamp, volume]) => {
              volumeMap.set(timestamp, volume);
            });
          }

          // Group prices into candles
          // For simplicity, we'll create candles based on time intervals
          const prices = data.prices;
          
          // Determine interval based on timeRange
          let intervalMs: number;
          if (days === 1) {
            intervalMs = 60 * 60 * 1000; // 1 hour
          } else if (days <= 7) {
            intervalMs = 4 * 60 * 60 * 1000; // 4 hours
          } else if (days <= 30) {
            intervalMs = 24 * 60 * 60 * 1000; // 1 day
          } else {
            intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 week
          }

          // Group prices into intervals
          const groupedData = new Map<number, number[]>();
          
          prices.forEach(([timestamp, price]) => {
            // Round timestamp to nearest interval
            const intervalTimestamp = Math.floor(timestamp / intervalMs) * intervalMs;
            if (!groupedData.has(intervalTimestamp)) {
              groupedData.set(intervalTimestamp, []);
            }
            groupedData.get(intervalTimestamp)!.push(price);
          });

          // Convert grouped data to OHLCV
          Array.from(groupedData.entries())
            .sort(([a], [b]) => a - b)
            .forEach(([timestamp, prices]) => {
              if (prices.length > 0) {
                const open = prices[0];
                const close = prices[prices.length - 1];
                const high = Math.max(...prices);
                const low = Math.min(...prices);
                const volume = volumeMap.get(timestamp) || 0;

                ohlcvData.push({
                  timestamp,
                  open,
                  high,
                  low,
                  close,
                  volume,
                });
              }
            });

          callback(ohlcvData);
        }
      });
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver && containerElement) {
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