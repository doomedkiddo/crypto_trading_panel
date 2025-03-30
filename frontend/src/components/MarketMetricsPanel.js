import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  Collapse,
  useMediaQuery,
  Fade
} from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';

const MarketMetricsPanel = ({
  marketData = {},
  isLoading = false,
  timeRange = '1D',
  onTimeRangeChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expandedSection, setExpandedSection] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('price');

  // Format helpers
  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatPercent = (num) => {
    if (num === undefined || num === null) return '-';
    return `${(num * 100).toFixed(2)}%`;
  };

  const formatCurrency = (num) => {
    if (num === undefined || num === null) return '-';
    return `$${formatNumber(num)}`;
  };

  // Sample historical data (replace with actual data)
  const historicalData = useMemo(() => [
    { timestamp: '09:00', price: 45000, volume: 100, volatility: 0.02 },
    { timestamp: '10:00', price: 45500, volume: 150, volatility: 0.025 },
    { timestamp: '11:00', price: 45300, volume: 120, volatility: 0.015 },
    { timestamp: '12:00', price: 45800, volume: 200, volatility: 0.03 },
    { timestamp: '13:00', price: 46000, volume: 180, volatility: 0.022 }
  ], []);

  // Market metrics
  const metrics = useMemo(() => [
    {
      name: 'Price',
      value: marketData.price || 45000,
      change: 2.5,
      format: formatCurrency,
      color: 'primary',
      icon: <ShowChartIcon />,
      key: 'price'
    },
    {
      name: '24h Volume',
      value: marketData.volume || 1500000,
      change: 15,
      format: formatCurrency,
      color: 'secondary',
      icon: <BarChartIcon />,
      key: 'volume'
    },
    {
      name: 'Volatility',
      value: marketData.volatility || 0.025,
      change: -10,
      format: formatPercent,
      color: 'warning',
      icon: <TimelineIcon />,
      key: 'volatility'
    }
  ], [marketData]);

  // Market depth data
  const depthData = useMemo(() => ({
    bids: [
      { price: 44900, quantity: 2.5 },
      { price: 44800, quantity: 3.8 },
      { price: 44700, quantity: 5.2 }
    ],
    asks: [
      { price: 45100, quantity: 1.8 },
      { price: 45200, quantity: 4.2 },
      { price: 45300, quantity: 3.5 }
    ]
  }), []);

  // Trend indicator component
  const TrendIndicator = ({ value, threshold = 0 }) => {
    const color = value >= threshold ? 'success.main' : 'error.main';
    const Icon = value >= threshold ? TrendingUpIcon : TrendingDownIcon;

    return (
      <Box component="span" sx={{ color, display: 'inline-flex', alignItems: 'center', ml: 1 }}>
        <Icon fontSize="small" />
        <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
          {formatPercent(Math.abs(value))}
        </Typography>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 400
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with time range selector */}
      <Box sx={{
        mb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}></Box>
        <Typography variant="h6" component="div">
          Market Metrics
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={timeRange}
          exclusive
          onChange={(e, value) => value && onTimeRangeChange?.(value)}
          aria-label="time range"
        ></ToggleButtonGroup>
          {['1H', '1D', '1W', '1M'].map((range) => (
            <ToggleButton key={range} value={range}>
              {range}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {/* Key metrics cards */}
        {metrics.map((metric) => (
          <Grid item xs={12} md={4} key={metric.key}>
            <Paper
              sx={{
                p: 2,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4]
                },
                bgcolor: selectedMetric === metric.key ?
                  `${theme.palette[metric.color].main}15` :
                  'background.paper'
              }}
              onClick={() => setSelectedMetric(metric.key)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{
                  mr: 1,
                  color: `${metric.color}.main`,
                  display: 'flex'
                }}></Box>
                  {metric.icon}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {metric.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h5" component="div"></Typography>
                  {metric.format(metric.value)}
                </Typography>
                <TrendIndicator value={metric.change / 100} />
              </Box>
            </Paper>
          </Grid>
        ))}

        {/* Chart section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}></Paper>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">
                {metrics.find(m => m.key === selectedMetric)?.name} Chart
              </Typography>
              <Tooltip title="Historical data visualization" arrow>
                <IconButton size="small">
                  <InfoOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={theme.palette.primary.main}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={theme.palette.primary.main}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={theme.palette.primary.main}
                    fillOpacity={1}
                    fill="url(#colorMetric)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Market Depth */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Market Depth
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[...depthData.bids, ...depthData.asks]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="price" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="quantity"
                    stroke={theme.palette.success.main}
                    fill={theme.palette.success.main}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Volume Profile */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Volume Profile
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%"></ResponsiveContainer>
                <BarChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar
                    dataKey="volume"
                    fill={theme.palette.secondary.main}
                    fillOpacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Additional Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              '& > *': { flexGrow: 1 }
            }}>
              <Chip
                label={`Bid/Ask Spread: ${formatCurrency(100)}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`24h High: ${formatCurrency(46500)}`}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`24h Low: ${formatCurrency(44500)}`}
                color="error"
                variant="outlined"
              />
              <Chip
                label={`Market Cap: ${formatCurrency(850000000000)}`}
                color="secondary"
                variant="outlined"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MarketMetricsPanel;