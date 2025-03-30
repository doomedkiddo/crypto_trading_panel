import React, { useState, useMemo } from 'react';
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
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Fade,
  CircularProgress,
  Collapse,
  ButtonGroup,
  Button,
  Divider,
  useMediaQuery,
  Grid
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FilterListIcon from '@mui/icons-material/FilterList';
import TimelineIcon from '@mui/icons-material/Timeline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { format } from 'date-fns';

const TradesPanel = ({ trades = [], isLoading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showStats, setShowStats] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  const [selectedView, setSelectedView] = useState('list');

  // Format helpers
  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatCurrency = (num) => {
    if (num === undefined || num === null) return '-';
    return `$${formatNumber(num)}`;
  };

  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm:ss');
    } catch (err) {
      return '-';
    }
  };

  // Calculate trade statistics
  const tradeStats = useMemo(() => {
    if (!trades.length) return null;

    const buyTrades = trades.filter(t => t.side === 'buy');
    const sellTrades = trades.filter(t => t.side === 'sell');

    const totalVolume = trades.reduce((sum, t) => sum + (t.price * t.quantity), 0);
    const avgPrice = trades.reduce((sum, t) => sum + t.price, 0) / trades.length;

    return {
      totalTrades: trades.length,
      buyCount: buyTrades.length,
      sellCount: sellTrades.length,
      totalVolume,
      avgPrice,
      maxTrade: Math.max(...trades.map(t => t.price * t.quantity)),
      minTrade: Math.min(...trades.map(t => t.price * t.quantity))
    };
  }, [trades]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!trades.length) return [];

    // Group trades by time intervals
    const timeGroups = trades.reduce((acc, trade) => {
      const time = format(new Date(trade.timestamp), 'HH:mm');
      if (!acc[time]) {
        acc[time] = {
          time,
          volume: 0,
          buyVolume: 0,
          sellVolume: 0,
          count: 0
        };
      }
      const tradeVolume = trade.price * trade.quantity;
      acc[time].volume += tradeVolume;
      if (trade.side === 'buy') {
        acc[time].buyVolume += tradeVolume;
      } else {
        acc[time].sellVolume += tradeVolume;
      }
      acc[time].count += 1;
      return acc;
    }, {});

    return Object.values(timeGroups);
  }, [trades]);

  // Size distribution data
  const sizeDistribution = useMemo(() => {
    if (!trades.length) return [];

    const sizes = trades.map(t => t.quantity);
    const max = Math.max(...sizes);
    const min = Math.min(...sizes);
    const range = max - min;
    const bucketSize = range / 5;

    const distribution = Array(5).fill(0).map((_, i) => ({
      range: `${formatNumber(min + i * bucketSize)} - ${formatNumber(min + (i + 1) * bucketSize)}`,
      count: sizes.filter(s => s >= min + i * bucketSize && s < min + (i + 1) * bucketSize).length
    }));

    return distribution;
  }, [trades]);

  // Trade direction distribution
  const directionData = useMemo(() => {
    if (!trades.length) return [];

    const buyCount = trades.filter(t => t.side === 'buy').length;
    return [
      { name: 'Buy', value: buyCount },
      { name: 'Sell', value: trades.length - buyCount }
    ];
  }, [trades]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with controls */}
      <Box sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h6" component="div">
          Recent Trades
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ButtonGroup size="small">
            <Button
              variant={selectedView === 'list' ? 'contained' : 'outlined'}
              onClick={() => setSelectedView('list')}
            >
              List
            </Button>
            <Button
              variant={selectedView === 'chart' ? 'contained' : 'outlined'}
              onClick={() => setSelectedView('chart')}
            >
              Chart
            </Button>
            <Button
              variant={selectedView === 'stats' ? 'contained' : 'outlined'}
              onClick={() => setSelectedView('stats')}
            >
              Stats
            </Button>
          </ButtonGroup>
          <ButtonGroup size="small">
            {['5M', '15M', '1H', '4H'].map((tf) => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? 'contained' : 'outlined'}
                onClick={() => setSelectedTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Box>

      <Divider />

      {/* Trade Statistics */}
      <Collapse in={showStats}>
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Total Trades</Typography>
              <Typography variant="h6">{tradeStats?.totalTrades || 0}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Total Volume</Typography>
              <Typography variant="h6">{formatCurrency(tradeStats?.totalVolume)}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Buy/Sell Ratio</Typography>
              <Typography variant="h6">
                {tradeStats ? `${(tradeStats.buyCount / tradeStats.totalTrades * 100).toFixed(1)}%` : '-'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Avg Trade Size</Typography>
              <Typography variant="h6">
                {tradeStats ? formatCurrency(tradeStats.totalVolume / tradeStats.totalTrades) : '-'}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        <Divider />
      </Collapse>

      {/* Main content area */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {selectedView === 'list' && (
          <TableContainer component={Paper} elevation={0} sx={{ height: '100%' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trades.map((trade, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      animation: 'fadeIn 0.5s ease-in-out',
                      '@keyframes fadeIn': {
                        '0%': { opacity: 0, transform: 'translateY(-10px)' },
                        '100%': { opacity: 1, transform: 'translateY(0)' }
                      }
                    }}
                  >
                    <TableCell>{formatTime(trade.timestamp)}</TableCell>
                    <TableCell sx={{ color: trade.side === 'buy' ? 'success.main' : 'error.main' }}>
                      {formatCurrency(trade.price)}
                    </TableCell>
                    <TableCell align="right">{formatNumber(trade.quantity)}</TableCell>
                    <TableCell align="right">{formatCurrency(trade.price * trade.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {selectedView === 'chart' && (
          <Box sx={{ p: 2, height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar
                  dataKey="buyVolume"
                  stackId="volume"
                  fill={theme.palette.success.main}
                  name="Buy Volume"
                />
                <Bar
                  dataKey="sellVolume"
                  stackId="volume"
                  fill={theme.palette.error.main}
                  name="Sell Volume"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}

        {selectedView === 'stats' && (
          <Box sx={{ p: 2, height: '100%' }}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
              {/* Trade Size Distribution */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Trade Size Distribution
                  </Typography>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sizeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar
                          dataKey="count"
                          fill={theme.palette.primary.main}
                          name="Trade Count"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>

              {/* Trade Direction Distribution */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Trade Direction
                  </Typography>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={directionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill={theme.palette.success.main} />
                          <Cell fill={theme.palette.error.main} />
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TradesPanel;