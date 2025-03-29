import React, { useState } from 'react';
import { Box, Grid, Typography, AppBar, Toolbar, Container, Paper, Chip, Alert } from '@mui/material';
import useMarketData from '../hooks/useMarketData';

// Components
import OrderBook from '../components/OrderBook';
import TradesPanel from '../components/TradesPanel';
import PositionsPanel from '../components/PositionsPanel';
import RiskMetricsPanel from '../components/RiskMetricsPanel';
import PriceChart from '../components/PriceChart';
import ConnectionStatus from '../components/ConnectionStatus';

const Dashboard = () => {
  const { marketData, connectionStatus } = useMarketData();
  const [selectedInstrument, setSelectedInstrument] = useState('BTC-USDT');
  
  // Filter trades for the selected instrument only
  const selectedInstrumentTrades = Array.isArray(marketData.trades) 
    ? marketData.trades.filter(trade => trade.instrument === selectedInstrument)
    : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Crypto Trading Panel
          </Typography>
          <ConnectionStatus status={connectionStatus} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 2, mb: 2, flexGrow: 1 }}>
        <Grid container spacing={2}>
          {/* Top row */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h5">
                {selectedInstrument}
              </Typography>
              <Box>
                {marketData.positions && Array.isArray(marketData.positions) && marketData.positions.length > 0 ? (
                  marketData.positions.map((position) => (
                    <Chip 
                      key={position.instrument}
                      label={`${position.instrument}: ${position.quantity > 0 ? 'LONG' : position.quantity < 0 ? 'SHORT' : 'FLAT'}`}
                      color={position.quantity > 0 ? 'success' : position.quantity < 0 ? 'error' : 'default'}
                      sx={{ mr: 1 }}
                      onClick={() => setSelectedInstrument(position.instrument)}
                    />
                  ))
                ) : (
                  <Chip 
                    label={`${selectedInstrument}: FLAT`}
                    color="default"
                    sx={{ mr: 1 }}
                  />
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Chart row */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '400px' }}>
              <PriceChart 
                data={selectedInstrumentTrades} 
                instrument={selectedInstrument} 
              />
            </Paper>
          </Grid>

          {/* Order book row */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '400px', overflow: 'hidden' }}>
              <OrderBook depth={marketData.depth} />
            </Paper>
          </Grid>

          {/* Trades and positions row */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '350px', overflow: 'auto' }}>
              <TradesPanel trades={selectedInstrumentTrades} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '350px', overflow: 'auto' }}>
              <Box sx={{ mb: 2 }}>
                <Alert severity="info">
                  Position data requires exchange API keys. Currently showing mock data.
                </Alert>
              </Box>
              <PositionsPanel positions={marketData.positions || []} />
            </Paper>
          </Grid>

          {/* Risk metrics row */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Alert severity="info">
                  Risk metrics require exchange API keys. Currently showing mock data.
                </Alert>
              </Box>
              <RiskMetricsPanel riskMetrics={marketData.riskMetrics} />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Box component="footer" sx={{ p: 2, bgcolor: 'background.paper', mt: 'auto' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Last update: {marketData.lastUpdate ? marketData.lastUpdate.toLocaleTimeString() : 'No data'}
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard; 