import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  LinearProgress,
  Tooltip,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
  Fade,
  IconButton,
  Collapse,
  useMediaQuery,
  Alert
} from '@mui/material';
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const RiskMetricsPanel = ({ riskMetrics, isLoading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [timeRange, setTimeRange] = useState('1D');
  const [expandedSection, setExpandedSection] = useState('all');

  const handleExpandSection = (section) => {
    setExpandedSection(expandedSection === section ? 'all' : section);
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPercent = (num) => {
    if (num === undefined || num === null) return '-';
    return `${(num * 100).toFixed(2)}%`;
  };

  // Trend indicator component
  const TrendIndicator = ({ value, threshold = 0, reversed = false }) => {
    const getTrendIcon = () => {
      if (Math.abs(value) < threshold) return <TrendingFlatIcon />;
      if ((!reversed && value > threshold) || (reversed && value < -threshold)) {
        return <TrendingUpIcon color="success" />;
      }
      return <TrendingDownIcon color="error" />;
    };

    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
        {getTrendIcon()}
      </Box>
    );
  };

  // Loading skeleton component
  const MetricSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="rectangular" height={20} sx={{ mt: 1 }} />
    </Box>
  );

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <MetricSkeleton />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!riskMetrics) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          No risk metrics data available. Please check your connection.
        </Alert>
      </Box>
    );
  }

  // Prepare data for the margin usage pie chart
  const marginData = [
    { name: 'Used Margin', value: riskMetrics.used_margin },
    { name: 'Available Margin', value: riskMetrics.available_margin }
  ];

  const MARGIN_COLORS = [theme.palette.warning.main, theme.palette.primary.main];

  // Sample historical data (replace with actual data)
  const historicalData = [
    { date: '2024-01-01', equity: 10000, pnl: 500, drawdown: -0.05 },
    { date: '2024-01-02', equity: 10500, pnl: 200, drawdown: -0.03 },
    { date: '2024-01-03', equity: 10300, pnl: -300, drawdown: -0.06 },
    { date: '2024-01-04', equity: 10800, pnl: 400, drawdown: -0.02 },
    { date: '2024-01-05', equity: 11000, pnl: 300, drawdown: -0.01 }
  ];

  // Risk threshold visualization data
  const thresholds = [
    {
      name: 'Margin Ratio',
      value: riskMetrics.margin_ratio * 100,
      warningThreshold: 40,
      dangerThreshold: 70,
      format: (val) => `${val.toFixed(1)}%`,
      tooltip: 'Margin usage as a percentage of total equity',
      trend: 5 // Sample trend value
    },
    {
      name: 'Drawdown',
      value: riskMetrics.drawdown * 100,
      warningThreshold: 10,
      dangerThreshold: 20,
      format: (val) => `${val.toFixed(1)}%`,
      tooltip: 'Maximum drop from peak equity',
      trend: -2 // Sample trend value
    },
    {
      name: 'Position Concentration',
      value: riskMetrics.position_concentration * 100,
      warningThreshold: 60,
      dangerThreshold: 80,
      format: (val) => `${val.toFixed(1)}%`,
      tooltip: 'Largest position as a percentage of total positions',
      trend: 0 // Sample trend value
    }
  ];

  return (
    <Box>
      {/* Time range selector */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Risk Metrics
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={timeRange}
          exclusive
          onChange={(e, value) => value && setTimeRange(value)}
          aria-label="time range"
        >
          {['1H', '1D', '1W', '1M'].map((range) => (
            <ToggleButton key={range} value={range}>
              {range}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {/* Left column - Key risk indicators */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
              onClick={() => handleExpandSection('indicators')}
            >
              <Typography variant="subtitle1">Key Risk Indicators</Typography>
              <IconButton size="small">
                <ExpandMoreIcon
                  sx={{
                    transform: expandedSection === 'indicators' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s'
                  }}
                />
              </IconButton>
            </Box>
            <Divider sx={{ my: 1 }} />

            <Collapse in={expandedSection === 'indicators' || expandedSection === 'all'}>
              <Box sx={{ mb: 3 }}>
                {thresholds.map((threshold) => (
                  <Box key={threshold.name} sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title={threshold.tooltip} arrow>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            {threshold.name}
                            <InfoOutlinedIcon sx={{ ml: 0.5, fontSize: '1rem' }} />
                          </Typography>
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {threshold.format(threshold.value)}
                        </Typography>
                        <TrendIndicator
                          value={threshold.trend}
                          threshold={0.5}
                          reversed={threshold.name === 'Drawdown'}
                        />
                      </Box>
                    </Box>
                    <Tooltip
                      title={`Warning: ${threshold.warningThreshold}%, Danger: ${threshold.dangerThreshold}%`}
                      arrow
                    >
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(threshold.value, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 5,
                          bgcolor: theme.palette.background.paper,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor:
                              threshold.value >= threshold.dangerThreshold
                                ? theme.palette.error.main
                                : threshold.value >= threshold.warningThreshold
                                  ? theme.palette.warning.main
                                  : theme.palette.success.main,
                            transition: 'transform 0.5s ease-in-out'
                          },
                        }}
                      />
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            </Collapse>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Equity</Typography>
                  <Typography variant="h6">
                    ${formatNumber(riskMetrics.total_equity)}
                    <TrendIndicator value={5} threshold={1} />
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Daily P&L</Typography>
                  <Typography
                    variant="h6"
                    color={riskMetrics.daily_pnl >= 0 ? 'success.main' : 'error.main'}
                  >
                    ${formatNumber(riskMetrics.daily_pnl)}
                    <TrendIndicator value={riskMetrics.daily_pnl} threshold={100} />
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Middle column - Margin usage */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
              onClick={() => handleExpandSection('margin')}
            >
              <Typography variant="subtitle1">Margin Usage</Typography>
              <IconButton size="small">
                <ExpandMoreIcon
                  sx={{
                    transform: expandedSection === 'margin' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s'
                  }}
                />
              </IconButton>
            </Box>
            <Divider sx={{ my: 1 }} />

            <Collapse in={expandedSection === 'margin' || expandedSection === 'all'}>
              <Box sx={{ height: 220, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={marginData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      animationBegin={200}
                      animationDuration={1500}
                    >
                      {marginData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={MARGIN_COLORS[index % MARGIN_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `$${formatNumber(value)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Collapse>

            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Used Margin</Typography>
                  <Typography variant="h6" sx={{ color: MARGIN_COLORS[0] }}>
                    ${formatNumber(riskMetrics.used_margin)}
                    <TrendIndicator value={3} threshold={1} reversed={true} />
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Available</Typography>
                  <Typography variant="h6" sx={{ color: MARGIN_COLORS[1] }}>
                    ${formatNumber(riskMetrics.available_margin)}
                    <TrendIndicator value={2} threshold={1} />
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Right column - Historical Analysis */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
              onClick={() => handleExpandSection('historical')}
            >
              <Typography variant="subtitle1">Historical Analysis</Typography>
              <IconButton size="small">
                <ExpandMoreIcon
                  sx={{
                    transform: expandedSection === 'historical' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s'
                  }}
                />
              </IconButton>
            </Box>
            <Divider sx={{ my: 1 }} />

            <Collapse in={expandedSection === 'historical' || expandedSection === 'all'}>
              <Box sx={{ height: 220, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke={theme.palette.primary.main}
                      fill={theme.palette.primary.main}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Collapse>

            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Max Position</Typography>
                  <Typography variant="h6">
                    ${formatNumber(riskMetrics.max_position_size)}
                    <TrendIndicator value={1} threshold={1} />
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Drawdown</Typography>
                  <Typography variant="h6" color="error.main">
                    {formatPercent(riskMetrics.drawdown)}
                    <TrendIndicator value={-riskMetrics.drawdown} threshold={0.01} reversed={true} />
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiskMetricsPanel;