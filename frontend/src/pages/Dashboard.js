import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
  Chip, 
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Button,
  CssBaseline,
  Stack
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

import useMarketData from '../hooks/useMarketData';

// Components
import OrderBook from '../components/OrderBook';
import TradesPanel from '../components/TradesPanel';
import PositionsPanel from '../components/PositionsPanel';
import RiskMetricsPanel from '../components/RiskMetricsPanel';
import PriceChart from '../components/PriceChart';
import ConnectionStatus from '../components/ConnectionStatus';

// Error boundary class component to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Something went wrong with this component.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {this.state.error?.toString() || "Unknown error"}
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

const Dashboard = () => {
  // Ensure marketData has a default structure with all required fields
  const { marketData = {}, connectionStatus = 'Disconnected' } = useMarketData() || {};
  const [selectedInstrument, setSelectedInstrument] = useState('BTC-USDT');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Safely handle potentially undefined marketData
  const trades = marketData?.trades || [];
  const positions = marketData?.positions || [];
  const depth = marketData?.depth || { bids: [], asks: [] };
  const riskMetrics = marketData?.riskMetrics || {};
  const lastUpdate = marketData?.lastUpdate || null;
  
  // Filter trades for the selected instrument only
  const selectedInstrumentTrades = Array.isArray(trades) 
    ? trades.filter(trade => trade.instrument === selectedInstrument)
    : [];

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleRefresh = () => {
    // Refresh could trigger data reload or other refresh actions
    window.location.reload();
  };
  
  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const drawerWidth = 220;
  const orderBookWidth = '25%'; // Use percentage instead of fixed width
  
  const drawerContent = (
    <Box sx={{ width: drawerWidth }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Crypto Trading
        </Typography>
      </Box>
      <Divider />
      <List>
        {[
          { text: 'Dashboard', icon: <DashboardIcon /> },
          { text: 'Portfolio', icon: <AccountBalanceWalletIcon /> },
          { text: 'Trades', icon: <SwapHorizIcon /> },
          { text: 'Settings', icon: <SettingsIcon /> }
        ].map((item, index) => (
          <ListItem
            button
            key={item.text}
            selected={index === 0}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'background.lighter',
                borderRight: '3px solid',
                borderColor: 'primary.main'
              },
              '&:hover': {
                backgroundColor: 'background.lighter',
              }
            }}
          >
            <ListItemIcon sx={{ color: index === 0 ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // Calculate heights for vertically stacked components
  const topSectionHeight = 64; // AppBar height

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      width: '100vw', 
      overflow: 'hidden',
      flexDirection: 'column'
    }}>
      <CssBaseline />
      <AppBar position="static" elevation={0} sx={{ 
        backgroundColor: 'background.paper', 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}>
        <Toolbar variant="dense">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2, display: { sm: 'flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, fontWeight: 'bold' }}>
            <Box 
              component="span" 
              sx={{ 
                mr: 1, 
                display: 'inline-block', 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
              }} 
            />
            Crypto Trading Panel
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {positions && Array.isArray(positions) && positions.length > 0 ? (
                positions.map((position) => (
                  <Chip 
                    key={position.instrument}
                    label={`${position.instrument}: ${position.quantity > 0 ? 'LONG' : position.quantity < 0 ? 'SHORT' : 'FLAT'}`}
                    color={position.quantity > 0 ? 'success' : position.quantity < 0 ? 'error' : 'default'}
                    variant={position.instrument === selectedInstrument ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ 
                      borderRadius: '16px',
                      fontWeight: 'medium',
                    }}
                    onClick={() => setSelectedInstrument(position.instrument)}
                  />
                ))
              ) : (
                <Chip 
                  label={`${selectedInstrument}: FLAT`}
                  color="default"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderRadius: '16px',
                    fontWeight: 'medium',
                  }}
                />
              )}
            </Box>
            
            <ConnectionStatus status={connectionStatus} />

            <IconButton 
              color="inherit" 
              aria-label="full screen"
              title="Full Screen"
              sx={{ ml: 1 }}
              onClick={handleFullScreen}
            >
              <FullscreenIcon />
            </IconButton>
            
            <IconButton 
              color="inherit" 
              aria-label="menu" 
              edge="end" 
              onClick={handleMenuClick}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              TransitionComponent={Fade}
            >
              <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
              <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        overflow: 'hidden',
        height: `calc(100% - ${topSectionHeight}px)`
      }}>
        {/* Sidebar for desktop */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                border: 'none',
                backgroundColor: 'background.paper',
                position: 'relative',
                height: '100%'
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        )}

        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              backgroundColor: 'background.paper',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Flexible layout with main panels and orderbook */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isLargeScreen ? 'row' : 'column',
          flexGrow: 1,
          height: '100%',
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          overflow: 'hidden'
        }}>
          {/* Main content area */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            width: isLargeScreen ? '75%' : '100%',
            height: isLargeScreen ? '100%' : '70%',
            p: 2,
            boxSizing: 'border-box',
            overflow: 'auto'
          }}>
            {/* Top row - Selected Instrument */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {selectedInstrument}
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<RefreshIcon />}
                sx={{ borderRadius: '20px' }}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </Box>

            {/* Chart section */}
            <Card 
              sx={{ 
                flexGrow: 1,
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '300px'
              }} 
              elevation={0}
            >
              <CardHeader 
                title="Price Chart" 
                titleTypographyProps={{ variant: 'h6', fontWeight: 'medium' }}
                sx={{ 
                  px: 3, 
                  py: 1, 
                  borderBottom: '1px solid', 
                  borderColor: 'divider' 
                }}
              />
              <CardContent sx={{ 
                p: 0, 
                flexGrow: 1,
                overflow: 'hidden',
                display: 'flex'
              }}>
                <ErrorBoundary>
                  <PriceChart 
                    data={selectedInstrumentTrades} 
                    instrument={selectedInstrument} 
                  />
                </ErrorBoundary>
              </CardContent>
            </Card>

            {/* Bottom panels in a row */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ 
                mb: 2,
                minHeight: '300px',
                flexGrow: 0,
                flexShrink: 0
              }}
            >
              {/* Trades panel */}
              <Card 
                sx={{ 
                  width: { xs: '100%', sm: '50%' },
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '300px'
                }} 
                elevation={0}
              >
                <CardHeader 
                  title="Recent Trades" 
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'medium' }}
                  sx={{ 
                    px: 3, 
                    py: 1, 
                    borderBottom: '1px solid', 
                    borderColor: 'divider' 
                  }}
                />
                <CardContent sx={{ 
                  p: 0, 
                  flexGrow: 1,
                  overflow: 'auto',
                  display: 'flex'
                }}>
                  <ErrorBoundary>
                    <TradesPanel trades={selectedInstrumentTrades} />
                  </ErrorBoundary>
                </CardContent>
              </Card>

              {/* Positions panel */}
              <Card 
                sx={{ 
                  width: { xs: '100%', sm: '50%' },
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '300px'
                }} 
                elevation={0}
              >
                <CardHeader 
                  title="Positions" 
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'medium' }}
                  sx={{ 
                    px: 3, 
                    py: 1, 
                    borderBottom: '1px solid', 
                    borderColor: 'divider' 
                  }}
                />
                <CardContent sx={{ 
                  p: 0, 
                  flexGrow: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <Box sx={{ p: 2, pb: 0 }}>
                    <Alert severity="info" variant="outlined" sx={{ mb: 1 }}>
                      Position data requires exchange API keys. Currently showing mock data.
                    </Alert>
                  </Box>
                  <Box sx={{ 
                    flexGrow: 1, 
                    overflow: 'auto',
                    display: 'flex'
                  }}>
                    <ErrorBoundary>
                      <PositionsPanel positions={positions} />
                    </ErrorBoundary>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Box>

          {/* Order Book panel - flexible width instead of fixed */}
          <Box 
            sx={{ 
              width: isLargeScreen ? orderBookWidth : '100%',
              height: isLargeScreen ? '100%' : '30%',
              borderLeft: isLargeScreen ? '1px solid' : 'none',
              borderTop: !isLargeScreen ? '1px solid' : 'none',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              overflow: 'auto',
              p: 2,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 2 }}>
              Order Book
            </Typography>
            
            <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex' }}>
              <ErrorBoundary>
                <OrderBook depth={depth} />
              </ErrorBoundary>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Risk metrics footer - collapsible */}
      <Box 
        sx={{ 
          borderTop: '1px solid', 
          borderColor: 'divider',
          p: 1, 
          backgroundColor: 'background.paper',
          height: '15%',
          minHeight: '100px',
          maxHeight: '150px',
          overflow: 'auto'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: 2,
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            Risk Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'No data'}
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 1, height: 'calc(100% - 40px)', overflow: 'auto' }}>
          <ErrorBoundary>
            <RiskMetricsPanel riskMetrics={riskMetrics} />
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard; 