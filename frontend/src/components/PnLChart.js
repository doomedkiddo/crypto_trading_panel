import React, { useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Card,
  CardHeader,
  CardContent,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const PnLChart = ({ data = [], isLoading = false }) => {
  const theme = useTheme();

  // Debug logging
  useEffect(() => {
    console.log('PnLChart data:', {
      dataLength: data.length,
      firstPoint: data[0],
      lastPoint: data[data.length - 1],
      isLoading
    });
  }, [data, isLoading]);

  // Calculate total PnL and daily change
  const metrics = useMemo(() => {
    if (!data.length) return { totalPnL: 0, dailyChange: 0 };

    const totalPnL = data[data.length - 1]?.value || 0;
    const dailyChange = data.length > 1
      ? ((data[data.length - 1]?.value - data[data.length - 2]?.value) / Math.abs(data[data.length - 2]?.value || 1)) * 100
      : 0;

    return { totalPnL, dailyChange };
  }, [data]);

  // Format currency
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value) => {
    if (typeof value !== 'number') return '0.00%';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          }}
        >
          <Typography variant="body2">
            {new Date(label).toLocaleString()}
          </Typography>
          <Typography
            variant="body1"
            color={payload[0].value >= 0 ? 'success.main' : 'error.main'}
            sx={{ fontWeight: 'medium' }}
          >
            {formatCurrency(payload[0].value)}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  // No data state
  if (!data.length) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Alert severity="info">No PnL data available</Alert>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Profit & Loss"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'medium' }}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              icon={metrics.totalPnL >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={formatCurrency(metrics.totalPnL)}
              color={metrics.totalPnL >= 0 ? 'success' : 'error'}
              variant="outlined"
            />
            <Chip
              label={formatPercent(metrics.dailyChange)}
              color={metrics.dailyChange >= 0 ? 'success' : 'error'}
              variant="outlined"
              size="small"
            />
          </Box>
        }
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      />
      <CardContent
        sx={{
          p: 2,
          flexGrow: 1,
          display: 'flex',
          minHeight: 300
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={metrics.totalPnL >= 0 ? theme.palette.success.main : theme.palette.error.main}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={metrics.totalPnL >= 0 ? theme.palette.success.main : theme.palette.error.main}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={metrics.totalPnL >= 0 ? theme.palette.success.main : theme.palette.error.main}
              fill="url(#pnlGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PnLChart;