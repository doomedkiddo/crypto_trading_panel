import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart } from 'lightweight-charts';
import { Box, Typography, CircularProgress, Grid, Divider } from '@mui/material';

const PriceChart = ({ instrument = 'BTC-USDT' }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const candleSeries = useRef(null);
  const volumeSeries = useRef(null);
  const wsRef = useRef(null);
  
  const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [] });
  const [tradeData, setTradeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPrice, setLastPrice] = useState(null);
  const [error, setError] = useState(null);

  // Format the instrument name for display
  const formattedInstrument = instrument || 'No Data';

  // Connect to WebSocket and handle market data
  useEffect(() => {
    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Initialize WebSocket
    const ws = new WebSocket('ws://localhost:8765');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Request data for specific instrument
      ws.send(JSON.stringify({ instrument }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          return;
        }
        
        setIsLoading(false);
        
        // Update order book data
        if (data.depth) {
          setOrderBookData({
            bids: data.depth.bids || [],
            asks: data.depth.asks || []
          });
        }
        
        // Update trade data and chart
        if (data.trades && data.trades.length > 0) {
          setTradeData(data.trades);
          
          // Update last price
          if (data.trades[0]?.price) {
            setLastPrice(data.trades[0].price);
          }
          
          // Update chart with new trade data
          if (candleSeries.current) {
            const processedData = data.trades.map(trade => ({
              time: trade.timestamp ? trade.timestamp / 1000 : Date.now() / 1000,
              value: trade.price || 0,
            }));
            
            candleSeries.current.setData(processedData);
          }
          
          // Update volume series
          if (volumeSeries.current) {
            const volumeData = data.trades.map(trade => ({
              time: trade.timestamp ? trade.timestamp / 1000 : Date.now() / 1000,
              value: trade.quantity || 0,
              color: trade.is_buyer_maker ? 'rgba(244, 67, 54, 0.5)' : 'rgba(76, 175, 80, 0.5)',
            }));
            
            volumeSeries.current.setData(volumeData);
          }
        }
        
        // Request next update
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ instrument }));
          }
        }, 100);
      } catch (error) {
        console.error('Error processing market data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to market data server');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [instrument]);

  // Initialize chart
  useEffect(() => {
    // Initialize chart if it doesn't exist yet
    if (!chartRef.current && chartContainerRef.current) {
      // Create the chart
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
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

      // Set up a resize observer to handle window resizing
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !chartRef.current) return;
        const { width, height } = entries[0].contentRect;
        chartRef.current.applyOptions({ width, height });
        chartRef.current.timeScale().fitContent();
      });
      
      resizeObserver.observe(chartContainerRef.current);

      // Clean up
      return () => {
        resizeObserver.disconnect();
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          candleSeries.current = null;
          volumeSeries.current = null;
        }
      };
    }
  }, []);

  // Calculate max quantity for visualization scaling
  const maxQuantity = useMemo(() => {
    const allQuantities = [
      ...orderBookData.bids.map(level => level.quantity),
      ...orderBookData.asks.map(level => level.quantity)
    ];
    
    return Math.max(...allQuantities, 1);
  }, [orderBookData]);

  // Calculate the midpoint price
  const midPrice = useMemo(() => {
    if (orderBookData.asks.length > 0 && orderBookData.bids.length > 0) {
      return (orderBookData.asks[0].price + orderBookData.bids[0].price) / 2;
    }
    return lastPrice || 0;
  }, [orderBookData, lastPrice]);

  // Render order book with heatmap-style visualization
  const renderOrderBook = () => {
    return (
      <Box sx={{ 
        height: '100%', 
        overflow: 'auto', 
        px: 1,
        backgroundColor: '#111',
        borderRadius: 1,
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, mt: 1 }}>
          <Typography variant="subtitle1">Order Book</Typography>
          <Typography variant="body2" color="text.secondary">
            Max Qty: {maxQuantity.toFixed(2)}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Price</Typography>
          <Typography variant="caption" color="text.secondary">Quantity</Typography>
        </Box>
        
        {/* Asks (Sell orders) - displayed in reverse order */}
        <Box sx={{ mb: 1 }}>
          {orderBookData.asks.slice().reverse().map((level, idx) => {
            const percentOfMax = (level.quantity / maxQuantity) * 100;
            const distanceFromMid = Math.abs(((level.price / midPrice) - 1) * 100);
            const intensity = Math.min(distanceFromMid * 3, 100);
            
            return (
              <Box 
                key={`ask-${idx}`} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  position: 'relative',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  height: 28
                }}
              >
                {/* Background heatmap bar */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    bgcolor: `rgba(244, 67, 54, ${0.1 + (percentOfMax * 0.3 / 100)})`,
                    width: `${Math.min(percentOfMax, 100)}%`,
                    zIndex: 0
                  }}
                />
                
                {/* Vertical price heatmap strip */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    bgcolor: `rgba(244, 67, 54, ${0.5 + (intensity * 0.5 / 100)})`,
                    zIndex: 1
                  }}
                />
                
                {/* Price and quantity text */}
                <Typography 
                  variant="body2" 
                  color="error.main"
                  sx={{ position: 'relative', zIndex: 1, ml: 1.5, fontFamily: 'monospace' }}
                >
                  {level.price.toFixed(2)}
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ position: 'relative', zIndex: 1, fontFamily: 'monospace' }}
                >
                  {level.quantity.toFixed(4)}
                </Typography>
              </Box>
            );
          })}
        </Box>
        
        {/* Spread */}
        {orderBookData.asks.length > 0 && orderBookData.bids.length > 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            my: 1, 
            py: 0.7, 
            bgcolor: 'rgba(25,118,210,0.1)',
            border: '1px solid rgba(25,118,210,0.2)', 
            borderRadius: 1
          }}>
            <Typography variant="body2" color="primary">
              Mid: {midPrice.toFixed(2)} | Spread: {(orderBookData.asks[0]?.price - orderBookData.bids[0]?.price).toFixed(2)} 
              ({((orderBookData.asks[0]?.price / orderBookData.bids[0]?.price - 1) * 100).toFixed(3)}%)
            </Typography>
          </Box>
        )}
        
        {/* Bids (Buy orders) */}
        <Box>
          {orderBookData.bids.map((level, idx) => {
            const percentOfMax = (level.quantity / maxQuantity) * 100;
            const distanceFromMid = Math.abs(((level.price / midPrice) - 1) * 100);
            const intensity = Math.min(distanceFromMid * 3, 100);
            
            return (
              <Box 
                key={`bid-${idx}`} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  position: 'relative',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  height: 28
                }}
              >
                {/* Background heatmap bar */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    bgcolor: `rgba(76, 175, 80, ${0.1 + (percentOfMax * 0.3 / 100)})`,
                    width: `${Math.min(percentOfMax, 100)}%`,
                    zIndex: 0
                  }}
                />
                
                {/* Vertical price heatmap strip */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    bgcolor: `rgba(76, 175, 80, ${0.5 + (intensity * 0.5 / 100)})`,
                    zIndex: 1
                  }}
                />
                
                {/* Price and quantity text */}
                <Typography 
                  variant="body2" 
                  color="success.main"
                  sx={{ position: 'relative', zIndex: 1, ml: 1.5, fontFamily: 'monospace' }}
                >
                  {level.price.toFixed(2)}
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ position: 'relative', zIndex: 1, fontFamily: 'monospace' }}
                >
                  {level.quantity.toFixed(4)}
                </Typography>
              </Box>
            );
          })}
        </Box>
        
        {/* Recent Trades */}
        {tradeData.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Recent Trades</Typography>
            <Divider sx={{ mb: 1 }} />
            
            {tradeData.slice(0, 5).map((trade, idx) => (
              <Box 
                key={`trade-${idx}`}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  py: 0.5,
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <Typography 
                  variant="body2" 
                  color={trade.is_buyer_maker ? 'error.main' : 'success.main'}
                  sx={{ fontFamily: 'monospace' }}
                >
                  {trade.price.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {trade.quantity.toFixed(4)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with instrument name and price */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" component="div">
          {formattedInstrument}
        </Typography>
        {lastPrice && (
          <Typography 
            variant="body1" 
            color={
              tradeData.length > 1 && tradeData[0].price > tradeData[1].price 
                ? 'success.main' 
                : tradeData.length > 1 && tradeData[0].price < tradeData[1].price
                  ? 'error.main'
                  : 'text.secondary'
            }
            sx={{ 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {tradeData.length > 1 && (
              <Box component="span" sx={{ ml: 1, fontSize: '0.8rem' }}>
                {tradeData[0].price > tradeData[1].price ? '↑' : tradeData[0].price < tradeData[1].price ? '↓' : ''}
              </Box>
            )}
          </Typography>
        )}
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ flex: 1 }}>
          {/* Price Chart */}
          <Grid item xs={8}>
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
          </Grid>
          
          {/* Order Book */}
          <Grid item xs={4} sx={{ height: '100%' }}>
            {renderOrderBook()}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default PriceChart; 