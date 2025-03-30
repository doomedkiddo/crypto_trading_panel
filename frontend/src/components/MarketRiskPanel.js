import React, { useMemo, useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  LinearProgress, 
  useTheme,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  alpha
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  AreaChart, 
  Area,
  CartesianGrid,
  ReferenceLine,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

// Custom theme palette for risk visualization
const riskColors = {
  safe: "#5465FF",      // Blue
  lowRisk: "#788BFF",   // Light blue
  moderate: "#788BFF",  // Light blue
  elevated: "#E2B0FF",  // Light purple
  high: "#9381FF",      // Purple
  extreme: "#6930C3",   // Dark purple
  background: "#F8F7FF" // Light background
};

const MarketRiskPanel = ({ depth = { bids: [], asks: [] }, trades = [] }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState("1h");
  const [volatilityHistory, setVolatilityHistory] = useState([]);
  
  // Calculate market volatility (based on recent trades)
  const volatility = useMemo(() => {
    if (!Array.isArray(trades) || trades.length < 5) return 0;
    
    try {
      const prices = trades.slice(0, Math.min(50, trades.length))
        .map(t => parseFloat(t.price))
        .filter(price => !isNaN(price));
      
      if (prices.length < 2) return 0;

      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
      
      return Math.sqrt(variance) / mean;
    } catch (err) {
      console.error("Volatility calculation error:", err);
      return 0;
    }
  }, [trades]);

  // Calculate current spread between best bid and ask
  const spread = useMemo(() => {
    if (!depth?.bids?.length || !depth?.asks?.length) return 0;
    
    try {
      const bestBid = parseFloat(depth.bids[0][0]);
      const bestAsk = parseFloat(depth.asks[0][0]);
      
      if (isNaN(bestBid) || isNaN(bestAsk) || bestAsk <= 0) return 0;
      
      return (bestAsk - bestBid) / bestAsk * 100;
    } catch (err) {
      console.error("Spread calculation error:", err);
      return 0;
    }
  }, [depth]);

  // Calculate market depth resilience
  const marketDepthResilience = useMemo(() => {
    if (!depth?.bids?.length || !depth?.asks?.length) return 0;
    
    try {
      // Calculate total volume in first 5 price levels vs next 5 levels
      // Higher ratio = more resilient market
      const bidVolume1 = depth.bids.slice(0, 5).reduce((sum, [_, qty]) => sum + parseFloat(qty), 0);
      const bidVolume2 = depth.bids.slice(5, 10).reduce((sum, [_, qty]) => sum + parseFloat(qty), 0);
      
      const askVolume1 = depth.asks.slice(0, 5).reduce((sum, [_, qty]) => sum + parseFloat(qty), 0);
      const askVolume2 = depth.asks.slice(5, 10).reduce((sum, [_, qty]) => sum + parseFloat(qty), 0);
      
      // Calculate depth ratio (higher is better)
      const bidRatio = bidVolume2 / (bidVolume1 || 1);
      const askRatio = askVolume2 / (askVolume1 || 1);
      
      // Average of both sides, normalized to 0-1 scale
      return Math.min(1, (bidRatio + askRatio) / 4);
    } catch (err) {
      console.error("Market resilience calculation error:", err);
      return 0;
    }
  }, [depth]);

  // Calculate order flow imbalance
  const orderFlowImbalance = useMemo(() => {
    if (!depth?.bids?.length || !depth?.asks?.length) return 0;
    
    try {
      const totalBid = depth.bids.reduce((sum, [_, qty]) => sum + parseFloat(qty), 0);
      const totalAsk = depth.asks.reduce((sum, [_, qty]) => sum + parseFloat(qty), 0);
      
      if (totalBid === 0 && totalAsk === 0) return 0;
      return (totalBid - totalAsk) / (totalBid + totalAsk);
    } catch (err) {
      console.error("Order flow imbalance calculation error:", err);
      return 0;
    }
  }, [depth]);

  // Calculate market liquidity score
  const liquidityScore = useMemo(() => {
    if (!depth?.bids?.length || !depth?.asks?.length) return 0;
    
    try {
      // Get average volume in first 3 levels
      const bidVolume = depth.bids.slice(0, 3).reduce((sum, [_, qty]) => sum + parseFloat(qty), 0) / 3;
      const askVolume = depth.asks.slice(0, 3).reduce((sum, [_, qty]) => sum + parseFloat(qty), 0) / 3;
      
      // Low spread + high volume = better liquidity
      return Math.min(1, (bidVolume + askVolume) / 100) * (1 - Math.min(spread / 5, 0.5));
    } catch (err) {
      console.error("Liquidity score calculation error:", err);
      return 0;
    }
  }, [depth, spread]);

  // Calculate RSI (Relative Strength Index)
  const rsi = useMemo(() => {
    if (!Array.isArray(trades) || trades.length < 15) return null;
    
    try {
      const prices = trades
        .slice(0, Math.min(100, trades.length))
        .map(t => parseFloat(t.price))
        .filter(price => !isNaN(price))
        .reverse();
        
      if (prices.length < 14) return null;
      
      // Calculate price changes
      const changes = [];
      for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i-1]);
      }
      
      // Calculate average gains and losses
      let gain = 0;
      let loss = 0;
      
      for (let i = 0; i < 14; i++) {
        if (changes[i] >= 0) {
          gain += changes[i];
        } else {
          loss -= changes[i];
        }
      }
      
      let avgGain = gain / 14;
      let avgLoss = loss / 14;
      
      // Calculate RSI for latest period
      for (let i = 14; i < changes.length; i++) {
        const change = changes[i];
        let currentGain = 0;
        let currentLoss = 0;
        
        if (change >= 0) {
          currentGain = change;
        } else {
          currentLoss = -change;
        }
        
        avgGain = (avgGain * 13 + currentGain) / 14;
        avgLoss = (avgLoss * 13 + currentLoss) / 14;
      }
      
      if (avgLoss === 0) return 100;
      
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    } catch (err) {
      console.error("RSI calculation error:", err);
      return null;
    }
  }, [trades]);

  // Prepare radar chart data for risk assessment
  const riskRadarData = useMemo(() => {
    return [
      {
        metric: "Market Risk Profile",
        volatility: volatility * 100 * 10, // Scale for visibility
        spread: Math.min(spread * 5, 100),
        rsi: rsi ? Math.abs(50 - rsi) * 2 : 0, // Distance from neutral (50)
        liquidityRisk: (1 - liquidityScore) * 100,
        imbalance: Math.abs(orderFlowImbalance) * 100,
        resilience: (1 - marketDepthResilience) * 100
      }
    ];
  }, [volatility, spread, rsi, liquidityScore, orderFlowImbalance, marketDepthResilience]);

  // Determine volatility risk level color
  const getVolatilityColor = (vol) => {
    if (vol > 0.02) return riskColors.extreme;
    if (vol > 0.015) return riskColors.high;
    if (vol > 0.01) return riskColors.elevated;
    if (vol > 0.005) return riskColors.moderate;
    return riskColors.safe;
  };
  
  // Determine RSI risk level
  const getRsiRiskLevel = (rsiValue) => {
    if (rsiValue === null) return { color: riskColors.moderate, text: "Unknown" };
    if (rsiValue > 80 || rsiValue < 20) return { color: riskColors.extreme, text: "Extreme" };
    if (rsiValue > 70 || rsiValue < 30) return { color: riskColors.high, text: "High" };
    if (rsiValue > 65 || rsiValue < 35) return { color: riskColors.elevated, text: "Elevated" };
    if (rsiValue > 60 || rsiValue < 40) return { color: riskColors.moderate, text: "Moderate" };
    return { color: riskColors.safe, text: "Low" };
  };
  
  // Update volatility history
  useEffect(() => {
    if (volatility > 0) {
      setVolatilityHistory(prev => {
        const now = Date.now();
        // Keep only recent data based on time range
        const timeRangeMs = 
          timeRange === "4h" ? 4 * 60 * 60 * 1000 : 
          timeRange === "1h" ? 60 * 60 * 1000 : 
          15 * 60 * 1000;
          
        const newHistory = [
          ...prev.filter(item => now - item.time < timeRangeMs), 
          {
            time: now,
            value: volatility * 100,
            displayTime: new Date().toLocaleTimeString().substring(0, 5)
          }
        ];
        
        // Limit to 50 data points
        return newHistory.slice(-50);
      });
    }
  }, [volatility, timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (_, newTimeRange) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  // Calculate overall market risk score (0-100)
  const marketRiskScore = useMemo(() => {
    let score = 0;
    
    // Volatility contribution (0-30)
    score += Math.min(volatility * 3000, 30);
    
    // Spread contribution (0-15)
    score += Math.min(spread * 3, 15);
    
    // RSI contribution (0-20)
    if (rsi !== null) {
      score += Math.min(Math.abs(50 - rsi) * 0.4, 20);
    } else {
      score += 10; // Neutral if no RSI
    }
    
    // Liquidity contribution (0-15)
    score += Math.min((1 - liquidityScore) * 15, 15);
    
    // Order imbalance contribution (0-10)
    score += Math.min(Math.abs(orderFlowImbalance) * 10, 10);
    
    // Market depth resilience contribution (0-10)
    score += Math.min((1 - marketDepthResilience) * 10, 10);
    
    return Math.min(Math.round(score), 100);
  }, [volatility, spread, rsi, liquidityScore, orderFlowImbalance, marketDepthResilience]);
  
  // Get risk level based on score
  const getRiskLevel = (score) => {
    if (score >= 80) return { level: "Extreme", color: riskColors.extreme };
    if (score >= 65) return { level: "High", color: riskColors.high };
    if (score >= 50) return { level: "Elevated", color: riskColors.elevated };
    if (score >= 35) return { level: "Moderate", color: riskColors.moderate };
    if (score >= 20) return { level: "Low", color: riskColors.lowRisk };
    return { level: "Minimal", color: riskColors.safe };
  };
  
  const riskLevel = getRiskLevel(marketRiskScore);
  const rsiRisk = getRsiRiskLevel(rsi);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      p: 2,
      bgcolor: riskColors.background
    }}>
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" component="div">
          Market Risk Metrics
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
        >
          <ToggleButton value="15m">15min</ToggleButton>
          <ToggleButton value="1h">1hr</ToggleButton>
          <ToggleButton value="4h">4hr</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* Risk Score Overview */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 2, 
          borderLeft: `4px solid ${riskLevel.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            Overall Market Risk
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: riskLevel.color }}>
            {marketRiskScore}
            <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 1 }}>
              / 100
            </Typography>
          </Typography>
          <Typography variant="body2" sx={{ color: riskLevel.color, fontWeight: 'medium' }}>
            {riskLevel.level} Risk Level
          </Typography>
        </Box>
        
        <Box sx={{ width: '60%' }}>
          <Tooltip 
            title={`Risk Level: ${riskLevel.level} (${marketRiskScore}/100)`}
            arrow
          >
            <LinearProgress
              variant="determinate"
              value={marketRiskScore}
              sx={{
                height: 10,
                borderRadius: 5,
                mb: 1,
                bgcolor: alpha(riskColors.safe, 0.2),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: `linear-gradient(90deg, 
                    ${riskColors.safe} 0%, 
                    ${riskColors.lowRisk} 20%, 
                    ${riskColors.moderate} 40%, 
                    ${riskColors.elevated} 60%, 
                    ${riskColors.high} 80%, 
                    ${riskColors.extreme} 100%)`
                }
              }}
            />
          </Tooltip>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color={riskColors.safe}>Minimal</Typography>
            <Typography variant="caption" color={riskColors.moderate}>Moderate</Typography>
            <Typography variant="caption" color={riskColors.extreme}>Extreme</Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Main Metrics Grid */}
      <Grid container spacing={2} sx={{ flex: 1, mb: 2 }}>
        {/* Risk Radar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Risk Factor Analysis
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="80%" data={riskRadarData}>
                  <PolarGrid stroke={alpha('#000', 0.1)} />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                    tickFormatter={() => ''}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                    tickCount={5}
                  />
                  <Radar 
                    name="Volatility" 
                    dataKey="volatility" 
                    stroke={riskColors.high} 
                    fill={riskColors.high} 
                    fillOpacity={0.5} 
                  />
                  <Radar 
                    name="Spread" 
                    dataKey="spread" 
                    stroke={riskColors.moderate} 
                    fill={riskColors.moderate} 
                    fillOpacity={0.5} 
                  />
                  <Radar 
                    name="RSI Extremity" 
                    dataKey="rsi" 
                    stroke={riskColors.elevated} 
                    fill={riskColors.elevated} 
                    fillOpacity={0.5} 
                  />
                  <Radar 
                    name="Liquidity Risk" 
                    dataKey="liquidityRisk" 
                    stroke={riskColors.extreme} 
                    fill={riskColors.extreme} 
                    fillOpacity={0.5} 
                  />
                  <Radar 
                    name="Order Imbalance" 
                    dataKey="imbalance" 
                    stroke={riskColors.lowRisk} 
                    fill={riskColors.lowRisk} 
                    fillOpacity={0.5} 
                  />
                  <Radar 
                    name="Depth Risk" 
                    dataKey="resilience" 
                    stroke={riskColors.safe} 
                    fill={riskColors.safe} 
                    fillOpacity={0.5} 
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <Tooltip title="Market volatility reflects price fluctuation risk" arrow>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Volatility Risk</Typography>
                    <Typography variant="body1" sx={{ color: getVolatilityColor(volatility), fontWeight: 'medium' }}>
                      {(volatility * 100).toFixed(2)}%
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={4}>
                <Tooltip title="Spread between best bid and ask prices" arrow>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Spread Risk</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {spread.toFixed(2)}%
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={4}>
                <Tooltip title="Liquidity affects ability to enter/exit positions" arrow>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Liquidity Risk</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {((1 - liquidityScore) * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Volatility History Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Volatility Trends
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (Last {timeRange === "4h" ? "4 hours" : timeRange === "1h" ? "hour" : "15 minutes"})
              </Typography>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={volatilityHistory}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="volatilityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={riskColors.high} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={riskColors.high} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="displayTime" 
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    label={{ 
                      value: 'Volatility (%)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: 11 }
                    }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(2)}%`, 'Volatility']}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <ReferenceLine 
                    y={1.0} 
                    stroke={riskColors.moderate} 
                    strokeDasharray="3 3" 
                    label={{ 
                      value: "Moderate", 
                      position: "insideBottomRight",
                      fontSize: 10,
                      fill: riskColors.moderate
                    }} 
                  />
                  <ReferenceLine 
                    y={2.0} 
                    stroke={riskColors.high} 
                    strokeDasharray="3 3" 
                    label={{ 
                      value: "High", 
                      position: "insideTopRight",
                      fontSize: 10,
                      fill: riskColors.high
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={riskColors.high}
                    fillOpacity={1}
                    fill="url(#volatilityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <Tooltip title="Order book imbalance can predict price movements" arrow>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Order Imbalance</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {(orderFlowImbalance * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={4}>
                <Tooltip title="RSI indicates overbought or oversold conditions" arrow>
                  <Box>
                    <Typography variant="caption" color="text.secondary">RSI Risk</Typography>
                    <Typography variant="body1" sx={{ color: rsiRisk.color, fontWeight: 'medium' }}>
                      {rsiRisk.text} ({rsi ? rsi.toFixed(1) : "N/A"})
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={4}>
                <Tooltip title="Market depth resilience against large orders" arrow>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Depth Resilience</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {(marketDepthResilience * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MarketRiskPanel; 