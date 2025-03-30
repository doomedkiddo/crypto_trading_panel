import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  IconButton,
  Tooltip,
  Fade,
  ButtonGroup,
  Button,
  Zoom
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const OrderBook = ({ depth = { bids: [], asks: [] } }) => {
  const theme = useTheme();
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [error, setError] = useState(null);
  const [priceGrouping, setPriceGrouping] = useState(1); // Default price grouping
  const [showDepthChart, setShowDepthChart] = useState(true);
  const [inverted, setInverted] = useState(false);

  // Price grouping options based on price range
  const getPriceGroupingOptions = useCallback((price) => {
    if (price >= 10000) return [1, 5, 10, 50, 100];
    if (price >= 1000) return [0.5, 1, 5, 10, 50];
    if (price >= 100) return [0.1, 0.5, 1, 5, 10];
    if (price >= 10) return [0.01, 0.05, 0.1, 0.5, 1];
    return [0.001, 0.005, 0.01, 0.05, 0.1];
  }, []);

  // Calculate max quantity for visualization
  useEffect(() => {
    try {
      if (!depth) return;

      const bids = Array.isArray(depth.bids) ? depth.bids : [];
      const asks = Array.isArray(depth.asks) ? depth.asks : [];

      if (bids.length === 0 && asks.length === 0) {
        setMaxQuantity(0);
        return;
      }

      const allQuantities = [
        ...bids.map(b => parseFloat(b.quantity) || 0),
        ...asks.map(a => parseFloat(a.quantity) || 0)
      ];

      const max = Math.max(...allQuantities.filter(q => !isNaN(q)), 1);
      setMaxQuantity(max);
    } catch (err) {
      console.error("Error processing order book data:", err);
      setError("Failed to process order book data");
    }
  }, [depth]);

  // Format price precisely
  const formatPrice = (price) => {
    try {
      const numPrice = parseFloat(price);
      return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
    } catch (err) {
      return '0.00';
    }
  };

  // Format quantity with compact notation for large numbers
  const formatQuantity = (quantity) => {
    try {
      const numQuantity = parseFloat(quantity);
      if (isNaN(numQuantity)) return '0.00';

      if (numQuantity >= 1000000) {
        return `${(numQuantity / 1000000).toFixed(2)}M`;
      } else if (numQuantity >= 1000) {
        return `${(numQuantity / 1000).toFixed(2)}K`;
      } else {
        return numQuantity.toFixed(4);
      }
    } catch (err) {
      return '0.00';
    }
  };

  // Calculate percent of max quantity for visualization
  const getPercentOfMax = (quantity) => {
    if (!maxQuantity) return 0;
    try {
      const numQuantity = parseFloat(quantity);
      if (isNaN(numQuantity)) return 0;
      return (numQuantity / maxQuantity) * 100;
    } catch (err) {
      return 0;
    }
  };

  // Group orders by price level
  const groupOrders = useCallback((orders, groupSize) => {
    const grouped = orders.reduce((acc, order) => {
      const groupPrice = Math.floor(order.price / groupSize) * groupSize;
      if (!acc[groupPrice]) {
        acc[groupPrice] = { price: groupPrice, quantity: 0 };
      }
      acc[groupPrice].quantity += order.quantity;
      return acc;
    }, {});
    return Object.values(grouped);
  }, []);

  // Sort and process orders
  const { sortedAsks, sortedBids, depthChartData } = useMemo(() => {
    try {
      if (!depth || !depth.asks || !depth.bids || !Array.isArray(depth.asks) || !Array.isArray(depth.bids)) {
        return { sortedAsks: [], sortedBids: [], depthChartData: [] };
      }

      const processedAsks = depth.asks
        .map(ask => ({
          ...ask,
          price: parseFloat(ask.price) || 0,
          quantity: parseFloat(ask.quantity) || 0
        }))
        .filter(ask => ask.price > 0 && ask.quantity > 0);

      const processedBids = depth.bids
        .map(bid => ({
          ...bid,
          price: parseFloat(bid.price) || 0,
          quantity: parseFloat(bid.quantity) || 0
        }))
        .filter(bid => bid.price > 0 && bid.quantity > 0);

      // Group orders if price grouping is active
      const groupedAsks = priceGrouping > 1 ? groupOrders(processedAsks, priceGrouping) : processedAsks;
      const groupedBids = priceGrouping > 1 ? groupOrders(processedBids, priceGrouping) : processedBids;

      // Sort asks descending and bids descending
      const sortedAsks = [...groupedAsks].sort((a, b) => b.price - a.price);
      const sortedBids = [...groupedBids].sort((a, b) => b.price - a.price);

      // Calculate cumulative quantities for depth chart
      let askSum = 0;
      let bidSum = 0;
      const depthChartData = [];

      sortedBids.forEach(bid => {
        bidSum += bid.quantity;
        depthChartData.push({
          price: bid.price,
          bids: bidSum,
          asks: 0
        });
      });

      sortedAsks.reverse().forEach(ask => {
        askSum += ask.quantity;
        depthChartData.push({
          price: ask.price,
          bids: 0,
          asks: askSum
        });
      });

      depthChartData.sort((a, b) => a.price - b.price);

      return { sortedAsks, sortedBids, depthChartData };
    } catch (err) {
      console.error("Error processing orders:", err);
      return { sortedAsks: [], sortedBids: [], depthChartData: [] };
    }
  }, [depth, priceGrouping, groupOrders]);

  // Calculate spread
  const spreadData = useMemo(() => {
    if (sortedAsks.length === 0 || sortedBids.length === 0) return null;

    const lowestAsk = sortedAsks[sortedAsks.length - 1].price;
    const highestBid = sortedBids[0].price;
    const spread = lowestAsk - highestBid;
    const percentSpread = ((lowestAsk / highestBid) - 1) * 100;

    return {
      spread: spread,
      percentSpread: percentSpread
    };
  }, [sortedAsks, sortedBids]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'd') setShowDepthChart(prev => !prev);
      if (e.key === 'g') {
        const currentIndex = getPriceGroupingOptions(sortedBids[0]?.price || 0).indexOf(priceGrouping);
        const nextIndex = (currentIndex + 1) % getPriceGroupingOptions(sortedBids[0]?.price || 0).length;
        setPriceGrouping(getPriceGroupingOptions(sortedBids[0]?.price || 0)[nextIndex]);
      }
      if (e.key === 'i') setInverted(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [priceGrouping, sortedBids, getPriceGroupingOptions]);

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!sortedAsks.length && !sortedBids.length) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>No order book data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <ButtonGroup size="small" aria-label="price grouping">
          {getPriceGroupingOptions(sortedBids[0]?.price || 0).map((value) => (
            <Button
              key={value}
              variant={priceGrouping === value ? 'contained' : 'outlined'}
              onClick={() => setPriceGrouping(value)}
            >
              {value}
            </Button>
          ))}
        </ButtonGroup>

        <Box>
          <Tooltip title="Toggle Depth Chart (D)" arrow>
            <IconButton
              size="small"
              onClick={() => setShowDepthChart(prev => !prev)}
              color={showDepthChart ? 'primary' : 'default'}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Invert Order Book (I)" arrow>
            <IconButton
              size="small"
              onClick={() => setInverted(prev => !prev)}
              color={inverted ? 'primary' : 'default'}
            >
              <SwapVertIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Depth Chart */}
      <Zoom in={showDepthChart} unmountOnExit>
        <Box sx={{ height: '120px', width: '100%', p: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={depthChartData}>
              <XAxis
                dataKey="price"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => formatPrice(value)}
              />
              <YAxis />
              <Area
                type="monotone"
                dataKey="bids"
                stackId="1"
                stroke={theme.palette.success.main}
                fill={theme.palette.success.main}
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="asks"
                stackId="1"
                stroke={theme.palette.error.main}
                fill={theme.palette.error.main}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Zoom>

      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        {/* Asks container - top section */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            flex: '1 1 auto',
            minHeight: 0,
            maxHeight: '45%',
            overflow: 'auto',
            bgcolor: 'transparent',
            mb: 1,
            display: inverted ? 'none' : 'block'
          }}
        >
          <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell width="40%" align="right" sx={{ padding: '4px 8px', fontSize: '0.75rem' }}>Price</TableCell>
                <TableCell width="30%" align="right" sx={{ padding: '4px 8px', fontSize: '0.75rem' }}>Qty</TableCell>
                <TableCell width="30%" align="right" sx={{ padding: '4px 8px', fontSize: '0.75rem' }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAsks.map((level, idx) => {
                const percentOfMax = getPercentOfMax(level.quantity);

                return (
                  <TableRow
                    key={`ask-${idx}`}
                    sx={{
                      position: 'relative',
                      height: '28px',
                      padding: 0,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(244, 67, 54, 0.08)',
                        '& .hover-info': { opacity: 1 }
                      }
                    }}
                  >
                    {/* Background bar for visualization */}
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        bgcolor: 'rgba(244, 67, 54, 0.15)',
                        width: `${Math.min(percentOfMax, 100)}%`,
                        zIndex: 0,
                        transition: 'width 0.3s ease-in-out'
                      }}
                    />

                    <TableCell
                      align="right"
                      sx={{
                        color: 'error.main',
                        fontWeight: 'medium',
                        position: 'relative',
                        zIndex: 1,
                        padding: '2px 8px'
                      }}
                    >
                      {formatPrice(level.price)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        fontFamily: 'monospace',
                        padding: '2px 8px'
                      }}
                    >
                      {formatQuantity(level.quantity)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        color: 'text.secondary',
                        fontFamily: 'monospace',
                        padding: '2px 8px'
                      }}
                    >
                      {formatPrice(level.price * level.quantity)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Spread information */}
        {spreadData && (
          <Fade in>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                p: 1,
                borderTop: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'rgba(25, 118, 210, 0.05)'
              }}
            >
              <Typography variant="body2" color="primary">
                Spread: {formatPrice(spreadData.spread)} ({spreadData.percentSpread.toFixed(2)}%)
              </Typography>
            </Box>
          </Fade>
        )}

        {/* Bids container - bottom section */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            flex: '1 1 auto',
            minHeight: 0,
            maxHeight: '45%',
            overflow: 'auto',
            bgcolor: 'transparent',
            mt: 1,
            display: inverted ? 'block' : 'none'
          }}
        >
          <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell width="40%" align="right" sx={{ padding: '4px 8px', fontSize: '0.75rem' }}>Price</TableCell>
                <TableCell width="30%" align="right" sx={{ padding: '4px 8px', fontSize: '0.75rem' }}>Qty</TableCell>
                <TableCell width="30%" align="right" sx={{ padding: '4px 8px', fontSize: '0.75rem' }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedBids.map((level, idx) => {
                const percentOfMax = getPercentOfMax(level.quantity);

                return (
                  <TableRow
                    key={`bid-${idx}`}
                    sx={{
                      position: 'relative',
                      height: '28px',
                      padding: 0,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                        '& .hover-info': { opacity: 1 }
                      }
                    }}
                  >
                    {/* Background bar for visualization */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        bgcolor: 'rgba(76, 175, 80, 0.15)',
                        width: `${Math.min(percentOfMax, 100)}%`,
                        zIndex: 0,
                        transition: 'width 0.3s ease-in-out'
                      }}
                    />

                    <TableCell
                      align="right"
                      sx={{
                        color: 'success.main',
                        fontWeight: 'medium',
                        position: 'relative',
                        zIndex: 1,
                        padding: '2px 8px'
                      }}
                    >
                      {formatPrice(level.price)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        fontFamily: 'monospace',
                        padding: '2px 8px'
                      }}
                    >
                      {formatQuantity(level.quantity)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        color: 'text.secondary',
                        fontFamily: 'monospace',
                        padding: '2px 8px'
                      }}
                    >
                      {formatPrice(level.price * level.quantity)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default OrderBook;