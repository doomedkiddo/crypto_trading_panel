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
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Collapse,
  Grid,
  Divider,
  LinearProgress,
  useMediaQuery,
  Menu,
  MenuItem,
  Fade
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
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
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TimelineIcon from '@mui/icons-material/Timeline';
import { format } from 'date-fns';

const PositionsPanel = ({ positions = [], isLoading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedView, setSelectedView] = useState('list');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

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

  const formatPercent = (num) => {
    if (num === undefined || num === null) return '-';
    return `${(num * 100).toFixed(2)}%`;
  };

  // Calculate position statistics
  const positionStats = useMemo(() => {
    if (!positions.length) return null;

    const totalValue = positions.reduce((sum, pos) => sum + Math.abs(pos.notional), 0);
    const totalPnL = positions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0);
    const longValue = positions
      .filter(pos => pos.quantity > 0)
      .reduce((sum, pos) => sum + pos.notional, 0);
    const shortValue = positions
      .filter(pos => pos.quantity < 0)
      .reduce((sum, pos) => sum + Math.abs(pos.notional), 0);

    return {
      totalPositions: positions.length,
      totalValue,
      totalPnL,
      longValue,
      shortValue,
      longCount: positions.filter(pos => pos.quantity > 0).length,
      shortCount: positions.filter(pos => pos.quantity < 0).length
    };
  }, [positions]);

  // Risk exposure data
  const riskExposure = useMemo(() => {
    if (!positions.length) return [];

    const exposureByInstrument = positions.map(pos => ({
      name: pos.instrument,
      value: Math.abs(pos.notional),
      side: pos.quantity > 0 ? 'long' : 'short'
    }));

    return exposureByInstrument.sort((a, b) => b.value - a.value);
  }, [positions]);

  // PnL distribution data
  const pnlDistribution = useMemo(() => {
    if (!positions.length) return [];

    return positions.map(pos => ({
      instrument: pos.instrument,
      pnl: pos.unrealizedPnl || 0,
      pnlPercent: (pos.unrealizedPnl || 0) / pos.notional
    })).sort((a, b) => b.pnl - a.pnl);
  }, [positions]);

  // Handle position actions
  const handlePositionAction = (action, position) => {
    console.log(`${action} position:`, position);
    setAnchorEl(null);
  };

  // Risk level indicator
  const getRiskLevel = (position) => {
    const pnlPercent = (position.unrealizedPnl || 0) / position.notional;
    if (pnlPercent < -0.1) return 'error';
    if (pnlPercent < -0.05) return 'warning';
    if (pnlPercent > 0.1) return 'success';
    return 'info';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!positions.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          No open positions. Your portfolio is currently flat.
        </Alert>
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
          Positions
        </Typography>
        <ButtonGroup size="small">
          <Button
            variant={selectedView === 'list' ? 'contained' : 'outlined'}
            onClick={() => setSelectedView('list')}
          >
            List
          </Button>
          <Button
            variant={selectedView === 'analysis' ? 'contained' : 'outlined'}
            onClick={() => setSelectedView('analysis')}
          >
            Analysis
          </Button>
          <Button
            variant={selectedView === 'risk' ? 'contained' : 'outlined'}
            onClick={() => setSelectedView('risk')}
          >
            Risk
          </Button>
        </ButtonGroup>
      </Box>

      <Divider />

      {/* Position Statistics */}
      <Collapse in={showAnalytics}>
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Total Value</Typography>
              <Typography variant="h6">{formatCurrency(positionStats?.totalValue)}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Unrealized P&L</Typography>
              <Typography
                variant="h6"
                color={positionStats?.totalPnL >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(positionStats?.totalPnL)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Long/Short Ratio</Typography>
              <Typography variant="h6">
                {positionStats ? `${positionStats.longCount}:${positionStats.shortCount}` : '-'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Total Positions</Typography>
              <Typography variant="h6">{positionStats?.totalPositions || 0}</Typography>
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
                  <TableCell>Instrument</TableCell>
                  <TableCell align="right">Side</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="right">Entry Price</TableCell>
                  <TableCell align="right">Mark Price</TableCell>
                  <TableCell align="right">Unrealized P&L</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((position) => (
                  <TableRow
                    key={position.instrument}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      animation: 'fadeIn 0.5s ease-in-out',
                      '@keyframes fadeIn': {
                        '0%': { opacity: 0, transform: 'translateY(-10px)' },
                        '100%': { opacity: 1, transform: 'translateY(0)' }
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {position.instrument}
                        <Chip
                          size="small"
                          label={getRiskLevel(position)}
                          color={getRiskLevel(position)}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={position.quantity > 0 ? 'LONG' : 'SHORT'}
                        color={position.quantity > 0 ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{formatNumber(Math.abs(position.quantity))}</TableCell>
                    <TableCell align="right">{formatCurrency(position.entryPrice)}</TableCell>
                    <TableCell align="right">{formatCurrency(position.markPrice)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: position.unrealizedPnl >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'medium'
                      }}
                    >
                      {formatCurrency(position.unrealizedPnl)}
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ ml: 1, color: 'text.secondary' }}
                      >
                        ({formatPercent(position.unrealizedPnl / position.notional)})
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          setSelectedPosition(position);
                          setAnchorEl(event.currentTarget);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {selectedView === 'analysis' && (
          <Box sx={{ p: 2, height: '100%' }}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
              {/* PnL Distribution */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    P&L Distribution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pnlDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="instrument" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar
                          dataKey="pnl"
                          fill={theme.palette.primary.main}
                          name="Unrealized P&L"
                        >
                          {pnlDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.pnl >= 0 ? theme.palette.success.main : theme.palette.error.main}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>

              {/* Risk Exposure */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Risk Exposure
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskExposure}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {riskExposure.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.side === 'long' ? theme.palette.success.main : theme.palette.error.main}
                            />
                          ))}
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

        {selectedView === 'risk' && (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {positions.map((position) => (
                <Grid item xs={12} key={position.instrument}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">{position.instrument}</Typography>
                      <Chip
                        size="small"
                        label={getRiskLevel(position)}
                        color={getRiskLevel(position)}
                      />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Liquidation Price
                        </Typography>
                        <Typography variant="body1">
                          {formatCurrency(position.liquidationPrice)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(
                            ((position.markPrice - position.liquidationPrice) / position.markPrice) * 100,
                            100
                          )}
                          sx={{ mt: 1 }}
                          color={getRiskLevel(position)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Margin Ratio
                        </Typography>
                        <Typography variant="body1">
                          {formatPercent(position.marginRatio)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Notional Value
                        </Typography>
                        <Typography variant="body1">
                          {formatCurrency(position.notional)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>

      {/* Position Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={() => handlePositionAction('close', selectedPosition)}>
          <CloseIcon sx={{ mr: 1 }} /> Close Position
        </MenuItem>
        <MenuItem onClick={() => handlePositionAction('edit', selectedPosition)}>
          <EditIcon sx={{ mr: 1 }} /> Edit Stop/Take Profit
        </MenuItem>
        <MenuItem onClick={() => handlePositionAction('analyze', selectedPosition)}>
          <TimelineIcon sx={{ mr: 1 }} /> Analyze Position
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PositionsPanel;