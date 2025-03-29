import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  LinearProgress,
  Tooltip,
  useTheme
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
  Tooltip as RechartsTooltip
} from 'recharts';

const RiskMetricsPanel = ({ riskMetrics }) => {
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
        <Typography variant="h6" component="div" gutterBottom>
          Risk Metrics
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

  return (
    <Box>
      <Typography variant="h6" component="div" gutterBottom>
        Risk Metrics
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left column - Key risk indicators */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Key Risk Indicators
            </Typography>
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ mb: 3 }}>
              {thresholds.map((threshold) => (
                <Box key={threshold.name} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Tooltip title={threshold.tooltip} arrow>
                      <Typography variant="body2">{threshold.name}</Typography>
                    </Tooltip>
                    <Typography variant="body2" fontWeight="medium">
                      {threshold.format(threshold.value)}
                    </Typography>
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
                        },
                      }}
                    />
                  </Tooltip>
                </Box>
              ))}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Equity</Typography>
                  <Typography variant="h6">${formatNumber(riskMetrics.total_equity)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Daily P&L</Typography>
                  <Typography 
                    variant="h6" 
                    color={riskMetrics.daily_pnl >= 0 ? 'success.main' : 'error.main'}
                  >
                    ${formatNumber(riskMetrics.daily_pnl)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Available Margin</Typography>
                  <Typography variant="h6">${formatNumber(riskMetrics.available_margin)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Value at Risk (95%)</Typography>
                  <Typography variant="h6">${formatNumber(riskMetrics.var_95)}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
        
        {/* Middle column - Margin usage */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" gutterBottom>
              Margin Usage
            </Typography>
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
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
                  >
                    {marginData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MARGIN_COLORS[index % MARGIN_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `$${formatNumber(value)}`} />
                </PieChart>
              </ResponsiveContainer>
              
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Used Margin</Typography>
                    <Typography variant="h6" sx={{ color: MARGIN_COLORS[0] }}>
                      ${formatNumber(riskMetrics.used_margin)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Available</Typography>
                    <Typography variant="h6" sx={{ color: MARGIN_COLORS[1] }}>
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
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" gutterBottom>
              P&L Analysis
            </Typography>
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pnlData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => `$${formatNumber(value)}`} />
                  <Bar 
                    dataKey="value" 
                    fill={theme.palette.primary.main} 
                    barSize={40}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
              
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Max Position</Typography>
                    <Typography variant="h6">
                      ${formatNumber(riskMetrics.max_position_size)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Drawdown</Typography>
                    <Typography variant="h6" color="error.main">
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

export default RiskMetricsPanel; 