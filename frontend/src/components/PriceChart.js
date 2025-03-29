import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart } from 'lightweight-charts';
import { Box, Typography, CircularProgress } from '@mui/material';

// This component shows price charts based on the data passed
const PriceChart = ({ data = [], instrument = 'BTC-USDT' }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const candleSeries = useRef(null);
  const volumeSeries = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastPrice, setLastPrice] = useState(null);
  const [error, setError] = useState(null);

  // Format the instrument name for display
  const formattedInstrument = instrument || 'No Data';

  // Extract trade data from props
  const tradeData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.slice(0, 50); // Limit to 50 most recent trades for performance
  }, [data]);

  // Update chart when trade data changes
  useEffect(() => {
    try {
      setIsLoading(false);
      
      // Only proceed if we have trades
      if (tradeData.length > 0) {
        // Update last price from most recent trade
        if (tradeData[0]?.price) {
          setLastPrice(tradeData[0].price);
        }
        
        // Update chart with new trade data if chart exists
        if (candleSeries.current && chartRef.current) {
          const processedData = tradeData.map(trade => ({
            time: trade.timestamp ? Math.floor(trade.timestamp / 1000) : Math.floor(Date.now() / 1000),
            value: parseFloat(trade.price) || 0,
          })).filter(item => !isNaN(item.time) && !isNaN(item.value));
          
          if (processedData.length > 0) {
            try {
              candleSeries.current.setData(processedData);
            } catch (chartErr) {
              console.error('Error updating candlestick data:', chartErr);
            }
          }
        }
        
        // Update volume series if it exists
        if (volumeSeries.current && chartRef.current) {
          const volumeData = tradeData.map(trade => ({
            time: trade.timestamp ? Math.floor(trade.timestamp / 1000) : Math.floor(Date.now() / 1000),
            value: parseFloat(trade.quantity) || 0,
            color: trade.is_buyer_maker ? 'rgba(244, 67, 54, 0.5)' : 'rgba(76, 175, 80, 0.5)',
          })).filter(item => !isNaN(item.time) && !isNaN(item.value));
          
          if (volumeData.length > 0) {
            try {
              volumeSeries.current.setData(volumeData);
            } catch (volumeErr) {
              console.error('Error updating volume data:', volumeErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error processing trade data:', err);
      setError('Failed to process trade data');
    }
  }, [tradeData]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    try {
      // Initialize chart if it doesn't exist yet
      if (!chartRef.current) {
        // Create the chart
        const container = chartContainerRef.current;
        chartRef.current = createChart(container, {
          width: container.clientWidth || 600,
          height: container.clientHeight || 400,
          layout: {
            background: { type: 'solid', color: '#1e1e1e' },
            textColor: '#d1d4dc',
          },
          grid: {
            vertLines: { color: '#2e2e2e' },
            horzLines: { color: '#2e2e2e' },
          },
          crosshair: {
            mode: 1, // CrosshairMode.Normal
            vertLine: {
              width: 1,
              color: '#5c5c5c',
              style: 2, // LineStyle.Dashed
            },
            horzLine: {
              width: 1,
              color: '#5c5c5c',
              style: 2, // LineStyle.Dashed
            },
          },
          timeScale: {
            borderColor: '#3c3c3c',
            timeVisible: true,
            secondsVisible: true,
          },
          rightPriceScale: {
            borderColor: '#3c3c3c',
            scaleMargins: {
              top: 0.1,
              bottom: 0.2,
            },
          }
        });

        // Add a line series for price
        candleSeries.current = chartRef.current.addLineSeries({
          color: '#1976d2',
          lineWidth: 2,
          priceLineVisible: true,
          priceLineWidth: 1,
          priceLineColor: '#1976d2',
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        });

        // Add a histogram series for volume
        volumeSeries.current = chartRef.current.addHistogramSeries({
          color: 'rgba(76, 175, 80, 0.5)',
          priceFormat: { type: 'volume' },
          priceScaleId: '',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
      }

      // Set up a resize observer to handle window resizing
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !chartRef.current) return;
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          try {
            chartRef.current.applyOptions({ width, height });
            chartRef.current.timeScale().fitContent();
          } catch (resizeErr) {
            console.error('Error resizing chart:', resizeErr);
          }
        }
      });
      
      resizeObserver.observe(chartContainerRef.current);

      // Clean up
      return () => {
        resizeObserver.disconnect();
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (removeErr) {
            console.error('Error removing chart:', removeErr);
          } finally {
            chartRef.current = null;
            candleSeries.current = null;
            volumeSeries.current = null;
          }
        }
      };
    } catch (err) {
      console.error('Error initializing chart:', err);
      setError('Failed to initialize chart');
    }
  }, []);

  // Safely render with error handling
  const renderChart = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }
    
    if (!Array.isArray(tradeData) || tradeData.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography>No trade data available</Typography>
        </Box>
      );
    }
    
    return (
      <Box 
        ref={chartContainerRef}
        sx={{ 
          height: '100%',
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
          '.tv-lightweight-charts': {
            width: '100% !important'
          }
        }}
      />
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with instrument name and price */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 2 }}>
        <Typography variant="h6" component="div">
          {formattedInstrument}
        </Typography>
        {lastPrice && (
          <Typography 
            variant="body1" 
            color={
              tradeData.length > 1 && tradeData[0]?.price > tradeData[1]?.price 
                ? 'success.main' 
                : tradeData.length > 1 && tradeData[0]?.price < tradeData[1]?.price
                  ? 'error.main'
                  : 'text.secondary'
            }
            sx={{ 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ${parseFloat(lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {tradeData.length > 1 && tradeData[0] && tradeData[1] && (
              <Box component="span" sx={{ ml: 1, fontSize: '0.8rem' }}>
                {parseFloat(tradeData[0].price) > parseFloat(tradeData[1].price) ? '↑' : parseFloat(tradeData[0].price) < parseFloat(tradeData[1].price) ? '↓' : ''}
              </Box>
            )}
          </Typography>
        )}
      </Box>
      
      {/* Chart area */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderChart()}
      </Box>
    </Box>
  );
};

export default PriceChart; 