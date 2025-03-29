import React from 'react';
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
import { format } from 'date-fns';

const TradesPanel = ({ trades = [] }) => {
  const theme = useTheme();

  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return format(date, 'HH:mm:ss.SSS');
  };

  if (!trades || trades.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="div" gutterBottom>
          Recent Trades
        </Typography>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No trades available
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" component="div" gutterBottom>
        Recent Trades
      </Typography>
      
      <TableContainer component={Paper} elevation={0} sx={{ flex: 1, maxHeight: 'calc(100% - 40px)', bgcolor: 'transparent' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell align="right">Side</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map((trade, index) => (
              <TableRow key={trade.trade_id || index}>
                <TableCell component="th" scope="row">
                  {formatTimestamp(trade.timestamp)}
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    color: trade.is_buyer_maker ? theme.palette.error.main : theme.palette.success.main
                  }}
                >
                  {formatNumber(trade.price, 2)}
                </TableCell>
                <TableCell align="right">{formatNumber(trade.quantity, 4)}</TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    color: trade.is_buyer_maker ? theme.palette.error.main : theme.palette.success.main
                  }}
                >
                  {trade.is_buyer_maker ? 'SELL' : 'BUY'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TradesPanel; 