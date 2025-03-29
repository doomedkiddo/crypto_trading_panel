import React, { useMemo } from 'react';
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
  Divider,
  useTheme
} from '@mui/material';

const OrderBook = ({ depth }) => {
  const theme = useTheme();

  const formattedData = useMemo(() => {
    if (!depth || !depth.bids || !depth.asks) return { bids: [], asks: [] };

    // Find the maximum quantity to scale the depth visualization
    const allQuantities = [...depth.bids, ...depth.asks].map(level => level.quantity);
    const maxQuantity = Math.max(...allQuantities, 1);
    
    // Format and add visualization data
    return {
      bids: depth.bids.map(bid => ({
        ...bid,
        total: bid.price * bid.quantity,
        percentOfMax: (bid.quantity / maxQuantity) * 100
      })),
      asks: depth.asks.map(ask => ({
        ...ask,
        total: ask.price * ask.quantity,
        percentOfMax: (ask.quantity / maxQuantity) * 100
      }))
    };
  }, [depth]);

  const midPrice = useMemo(() => {
    if (!depth || !depth.bids || !depth.asks || depth.bids.length === 0 || depth.asks.length === 0) return null;
    const bestBid = depth.bids[0].price;
    const bestAsk = depth.asks[0].price;
    return (bestBid + bestAsk) / 2;
  }, [depth]);

  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  if (!depth) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Loading order book...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" component="div" gutterBottom>
        Order Book
      </Typography>
      
      {midPrice && (
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h5" component="div" color="text.primary">
            {formatNumber(midPrice, 2)}
          </Typography>
        </Box>
      )}
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'flex', height: 'calc(100% - 80px)' }}>
        {/* Asks (Sell orders) - displayed in reverse order (highest to lowest) */}
        <TableContainer component={Paper} elevation={0} sx={{ flex: 1, maxHeight: '100%', bgcolor: 'transparent' }}>
          <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Size</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formattedData.asks.map((ask, index) => (
                <TableRow key={`ask-${index}`} sx={{ position: 'relative' }}>
                  <TableCell 
                    align="right" 
                    sx={{ color: theme.palette.error.main }}
                  >
                    {formatNumber(ask.price, 2)}
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(ask.quantity, 4)}
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(ask.total, 2)}
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: `${ask.percentOfMax}%`,
                        backgroundColor: theme.palette.error.main + '33', // Add transparency
                        zIndex: -1,
                      }} 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Bids (Buy orders) */}
        <TableContainer component={Paper} elevation={0} sx={{ flex: 1, maxHeight: '100%', bgcolor: 'transparent', ml: 1 }}>
          <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Size</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formattedData.bids.map((bid, index) => (
                <TableRow key={`bid-${index}`} sx={{ position: 'relative' }}>
                  <TableCell 
                    align="right" 
                    sx={{ color: theme.palette.success.main }}
                  >
                    {formatNumber(bid.price, 2)}
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(bid.quantity, 4)}
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(bid.total, 2)}
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: `${bid.percentOfMax}%`,
                        backgroundColor: theme.palette.success.main + '33', // Add transparency
                        zIndex: -1,
                      }} 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default OrderBook; 