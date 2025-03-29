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
  LinearProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import { format } from 'date-fns';

const PositionsPanel = ({ positions = [] }) => {
  const theme = useTheme();

  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPercent = (num) => {
    if (num === undefined || num === null) return '-';
    return `${(num * 100).toFixed(2)}%`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return format(date, 'HH:mm:ss');
  };

  // Calculate margin ratio risk level
  const getMarginRiskLevel = (marginRatio) => {
    if (marginRatio >= 0.5) return 'high';
    if (marginRatio >= 0.3) return 'medium';
    return 'low';
  };

  // Calculate PnL risk level
  const getPnlRiskLevel = (unrealizedPnl, entryPrice, quantity) => {
    const notional = Math.abs(entryPrice * quantity);
    if (!notional) return 'none';
    
    const pnlPercent = unrealizedPnl / notional;
    if (pnlPercent <= -0.05) return 'high';
    if (pnlPercent <= -0.02) return 'medium';
    return 'low';
  };

  if (!positions || positions.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="div" gutterBottom>
          Positions
        </Typography>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No positions available
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" component="div" gutterBottom>
        Positions
      </Typography>
      
      <TableContainer component={Paper} elevation={0} sx={{ flex: 1, maxHeight: 'calc(100% - 40px)', bgcolor: 'transparent' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Instrument</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell align="right">Entry</TableCell>
              <TableCell align="right">Current</TableCell>
              <TableCell align="right">Unrealized P&L</TableCell>
              <TableCell align="right">Margin Ratio</TableCell>
              <TableCell align="right">Last Update</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.map((position) => {
              const marginRiskLevel = getMarginRiskLevel(position.margin_ratio);
              const pnlRiskLevel = getPnlRiskLevel(position.unrealized_pnl, position.entry_price, position.quantity);
              const pnlColor = position.unrealized_pnl > 0 ? theme.palette.success.main : theme.palette.error.main;
              
              return (
                <TableRow key={position.instrument}>
                  <TableCell component="th" scope="row">
                    {position.instrument}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: position.quantity > 0 
                        ? theme.palette.success.main 
                        : position.quantity < 0 
                          ? theme.palette.error.main 
                          : 'inherit'
                    }}
                  >
                    {formatNumber(position.quantity, 4)}
                  </TableCell>
                  <TableCell align="right">{formatNumber(position.entry_price, 2)}</TableCell>
                  <TableCell align="right">{formatNumber(position.current_price, 2)}</TableCell>
                  <TableCell align="right" sx={{ color: pnlColor }}>
                    {formatNumber(position.unrealized_pnl, 2)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={`Margin ratio: ${formatPercent(position.margin_ratio)}`} arrow>
                      <Box sx={{ width: '100%', mr: 1, display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(position.margin_ratio * 100, 100)}
                            sx={{
                              height: 8,
                              borderRadius: 5,
                              bgcolor: theme.palette.grey[800],
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                backgroundColor: marginRiskLevel === 'high'
                                  ? theme.palette.error.main
                                  : marginRiskLevel === 'medium'
                                    ? theme.palette.warning.main
                                    : theme.palette.success.main,
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatPercent(position.margin_ratio)}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">{formatTimestamp(position.last_update)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PositionsPanel; 