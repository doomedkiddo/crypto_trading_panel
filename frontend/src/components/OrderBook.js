import React, { useMemo, useState, useEffect } from 'react';
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
  useTheme
} from '@mui/material';

const OrderBook = ({ depth = { bids: [], asks: [] } }) => {
  const theme = useTheme();
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [error, setError] = useState(null);
  
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

  // Sort asks in descending order and bids in descending order
  const sortedAsks = useMemo(() => {
    try {
      if (!depth || !depth.asks || !Array.isArray(depth.asks)) return [];
      return [...depth.asks]
        .map(ask => ({
          ...ask,
          price: parseFloat(ask.price) || 0,
          quantity: parseFloat(ask.quantity) || 0
        }))
        .sort((a, b) => b.price - a.price);
    } catch (err) {
      console.error("Error sorting asks:", err);
      return [];
    }
  }, [depth]);
  
  const sortedBids = useMemo(() => {
    try {
      if (!depth || !depth.bids || !Array.isArray(depth.bids)) return [];
      return [...depth.bids]
        .map(bid => ({
          ...bid,
          price: parseFloat(bid.price) || 0,
          quantity: parseFloat(bid.quantity) || 0
        }))
        .sort((a, b) => b.price - a.price);
    } catch (err) {
      console.error("Error sorting bids:", err);
      return [];
    }
  }, [depth]);

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
    <Box className="flex-fix" sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
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
            mb: 1
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
                      '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' }
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
                        zIndex: 0
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
            mt: 1
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
                      '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.08)' }
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
                        zIndex: 0
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