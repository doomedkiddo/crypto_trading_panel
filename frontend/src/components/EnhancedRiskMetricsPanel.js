import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  LinearProgress,
  Tooltip,
  useTheme,
  alpha,
  Card,
  CardContent
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
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';

const EnhancedRiskMetricsPanel = ({ riskMetrics }) => {
  const theme = useTheme();

  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPercent = (num) => {
    if (num === undefined || num === null) return '-';
    return `${(num * 100).toFixed(2)}%`;
  };

  if (!riskMetrics) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography 
          variant="h5" 
          component="div" 
          gutterBottom
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Risk Intelligence Center
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Loading risk metrics...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Prepare data for the margin usage pie chart
  const marginData = [
    { name: 'Used Margin', value: riskMetrics.used_margin },
    { name: 'Available Margin', value: riskMetrics.available_margin }
  ];
  
  const MARGIN_COLORS = [theme.palette.warning.main, theme.palette.primary.main];
  
  // Prepare data for the PnL bar chart
  const pnlData = [
    { name: 'Unrealized', value: riskMetrics.daily_pnl || 0 },
    { name: 'Realized', value: 2500 },  // Sample data
    { name: 'Total', value: (riskMetrics.daily_pnl || 0) + 2500 }
  ];

  // Risk threshold visualization data
  const thresholds = [
    { 
      name: 'Margin Ratio',
      value: riskMetrics.margin_ratio * 100,
      warningThreshold: 40,
      dangerThreshold: 70,
      format: (val) => `${val.toFixed(1)}%`,
      tooltip: 'Margin usage as a percentage of total equity'
    },
    { 
      name: 'Drawdown',
      value: riskMetrics.drawdown * 100,
      warningThreshold: 10,
      dangerThreshold: 20,
      format: (val) => `${val.toFixed(1)}%`,
      tooltip: 'Maximum drop from peak equity'
    },
    { 
      name: 'Position Concentration',
      value: riskMetrics.position_concentration * 100,
      warningThreshold: 60,
      dangerThreshold: 80,
      format: (val) => `${val.toFixed(1)}%`,
      tooltip: 'Largest position as a percentage of total positions'
    }
  ];

  // Radial bar chart data
  const riskLevelsData = thresholds.map(item => ({
    name: item.name,
    value: item.value,
    fill: item.value >= item.dangerThreshold 
      ? theme.palette.error.main 
      : item.value >= item.warningThreshold 
        ? theme.palette.warning.main 
        : theme.palette.success.main
  }));

  // Mock time-series data for area chart
  const equityHistoryData = [
    { time: '00:00', equity: riskMetrics.total_equity * 0.90 },
    { time: '04:00', equity: riskMetrics.total_equity * 0.92 },
    { time: '08:00', equity: riskMetrics.total_equity * 0.98 },
    { time: '12:00', equity: riskMetrics.total_equity * 0.95 },
    { time: '16:00', equity: riskMetrics.total_equity * 0.97 },
    { time: '20:00', equity: riskMetrics.total_equity },
  ];

  return (
    <Box>
      <Typography 
        variant="h5" 
        component="div" 
        gutterBottom
        sx={{
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.info.main} 90%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3,
        }}
      >
        Risk Intelligence Center
      </Typography>
      
      <Grid container spacing={3}>
        {/* Top row - Summary cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.6)} 100%)`,
                boxShadow: `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.35)}`,
                borderRadius: 2,
              }}>
                <CardContent>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: alpha(theme.palette.common.white, 0.7),
                      fontWeight: 'bold',
                      letterSpacing: '1px' 
                    }}
                  >
                    Total Equity
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      mt: 1, 
                      color: theme.palette.common.white, 
                      fontWeight: 'bold' 
                    }}
                  >
                    ${formatNumber(riskMetrics.total_equity)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: riskMetrics.daily_pnl >= 0 
                  ? `linear-gradient(135deg, ${alpha(theme.palette.success.dark, 0.8)} 0%, ${alpha(theme.palette.success.main, 0.6)} 100%)`
                  : `linear-gradient(135deg, ${alpha(theme.palette.error.dark, 0.8)} 0%, ${alpha(theme.palette.error.main, 0.6)} 100%)`,
                boxShadow: riskMetrics.daily_pnl >= 0 
                  ? `0 8px 32px -8px ${alpha(theme.palette.success.main, 0.35)}`
                  : `0 8px 32px -8px ${alpha(theme.palette.error.main, 0.35)}`,
                borderRadius: 2,
              }}>
                <CardContent>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: alpha(theme.palette.common.white, 0.7),
                      fontWeight: 'bold',
                      letterSpacing: '1px' 
                    }}
                  >
                    Daily P&L
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      mt: 1, 
                      color: theme.palette.common.white, 
                      fontWeight: 'bold' 
                    }}
                  >
                    ${formatNumber(riskMetrics.daily_pnl)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.dark, 0.8)} 0%, ${alpha(theme.palette.info.main, 0.6)} 100%)`,
                boxShadow: `0 8px 32px -8px ${alpha(theme.palette.info.main, 0.35)}`,
                borderRadius: 2,
              }}>
                <CardContent>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: alpha(theme.palette.common.white, 0.7),
                      fontWeight: 'bold',
                      letterSpacing: '1px' 
                    }}
                  >
                    Available Margin
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      mt: 1, 
                      color: theme.palette.common.white, 
                      fontWeight: 'bold' 
                    }}
                  >
                    ${formatNumber(riskMetrics.available_margin)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.dark, 0.8)} 0%, ${alpha(theme.palette.warning.main, 0.6)} 100%)`,
                boxShadow: `0 8px 32px -8px ${alpha(theme.palette.warning.main, 0.35)}`,
                borderRadius: 2,
              }}>
                <CardContent>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: alpha(theme.palette.common.white, 0.7),
                      fontWeight: 'bold',
                      letterSpacing: '1px' 
                    }}
                  >
                    Value at Risk (95%)
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      mt: 1, 
                      color: theme.palette.common.white, 
                      fontWeight: 'bold' 
                    }}
                  >
                    ${formatNumber(riskMetrics.var_95)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Left column - Key risk indicators */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            height: '100%', 
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            boxShadow: `0 10px 40px -10px ${alpha(theme.palette.common.black, 0.2)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}>
            <Typography 
              variant="subtitle1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                fontSize: '1.1rem',
                color: theme.palette.primary.light
              }}
            >
              Key Risk Indicators
            </Typography>
            <Divider sx={{ my: 2, borderColor: alpha(theme.palette.primary.main, 0.1) }} />
            
            <Box sx={{ mb: 4 }}>
              {thresholds.map((threshold) => (
                <Box key={threshold.name} sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Tooltip title={threshold.tooltip} arrow>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: 'medium',
                          color: alpha(theme.palette.text.primary, 0.85)
                        }}
                      >
                        {threshold.name}
                      </Typography>
                    </Tooltip>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      sx={{
                        color: 
                          threshold.value >= threshold.dangerThreshold
                            ? theme.palette.error.main
                            : threshold.value >= threshold.warningThreshold
                              ? theme.palette.warning.main
                              : theme.palette.success.main,
                      }}
                    >
                      {threshold.format(threshold.value)}
                    </Typography>
                  </Box>
                  <Tooltip 
                    title={`Warning: ${threshold.warningThreshold}%, Danger: ${threshold.dangerThreshold}%`} 
                    arrow
                  >
                    <Box sx={{ position: 'relative' }}>
                      <LinearProgress
                        variant="determinate"
                        value={100} // Background track
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: alpha(theme.palette.divider, 0.2),
                          '& .MuiLinearProgress-bar': {
                            display: 'none',
                          },
                        }}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(threshold.value, 100)}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          bgcolor: 'transparent',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            background: 
                              threshold.value >= threshold.dangerThreshold
                                ? `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${theme.palette.error.main} 100%)`
                                : threshold.value >= threshold.warningThreshold
                                  ? `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.warning.main} 100%)`
                                  : `linear-gradient(90deg, ${theme.palette.info.main} 0%, ${theme.palette.success.main} 100%)`,
                          },
                        }}
                      />
                    </Box>
                  </Tooltip>
                </Box>
              ))}
            </Box>
            
            <Box sx={{ mt: 4 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 2, 
                  color: theme.palette.text.secondary,
                  fontWeight: 'medium'
                }}
              >
                Risk Level Overview
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart 
                  innerRadius="30%" 
                  outerRadius="90%" 
                  data={riskLevelsData} 
                  startAngle={180} 
                  endAngle={0}
                >
                  <RadialBar
                    minAngle={15}
                    background
                    clockWise={true}
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <Legend 
                    iconSize={10} 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{
                      fontSize: '12px',
                      fontWeight: 'medium',
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Middle column - Margin usage */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            boxShadow: `0 10px 40px -10px ${alpha(theme.palette.common.black, 0.2)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}>
            <Typography 
              variant="subtitle1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                fontSize: '1.1rem',
                color: theme.palette.primary.light
              }}
            >
              Margin Allocation
            </Typography>
            <Divider sx={{ my: 2, borderColor: alpha(theme.palette.primary.main, 0.1) }} />
            
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={marginData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: theme.palette.text.secondary, strokeWidth: 1, strokeDasharray: '3 3' }}
                  >
                    {marginData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={MARGIN_COLORS[index]} 
                        stroke={theme.palette.background.paper}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => `$${formatNumber(value)}`}
                    contentStyle={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      borderRadius: 8,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.2)}`
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      Used Margin
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: MARGIN_COLORS[0],
                      fontWeight: 'bold',
                      textShadow: `0 0 15px ${alpha(MARGIN_COLORS[0], 0.2)}`
                    }}>
                      ${formatNumber(riskMetrics.used_margin)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      Available
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: MARGIN_COLORS[1],
                      fontWeight: 'bold',
                      textShadow: `0 0 15px ${alpha(MARGIN_COLORS[1], 0.2)}`
                    }}>
                      ${formatNumber(riskMetrics.available_margin)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Right column - P&L Analysis */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            boxShadow: `0 10px 40px -10px ${alpha(theme.palette.common.black, 0.2)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}>
            <Typography 
              variant="subtitle1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                fontSize: '1.1rem',
                color: theme.palette.primary.light
              }}
            >
              Performance Analysis
            </Typography>
            <Divider sx={{ my: 2, borderColor: alpha(theme.palette.primary.main, 0.1) }} />
            
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                Equity Curve (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={equityHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: alpha(theme.palette.divider, 0.5) }}
                  />
                  <YAxis 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: alpha(theme.palette.divider, 0.5) }}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <RechartsTooltip 
                    formatter={(value) => `$${formatNumber(value)}`}
                    contentStyle={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      borderRadius: 8,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.2)}`
                    }}
                  />
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke={theme.palette.primary.main} 
                    strokeWidth={2}
                    fill="url(#colorEquity)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      Max Position
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.info.main
                    }}>
                      ${formatNumber(riskMetrics.max_position_size)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      Drawdown
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: theme.palette.error.main,
                      fontWeight: 'bold'
                    }}>
                      {formatPercent(riskMetrics.drawdown)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedRiskMetricsPanel; 