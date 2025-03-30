import React from 'react';
import { 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton,
  Breadcrumbs,
  Link,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import useMarketData from '../hooks/useMarketData';
import RiskMetricsPanel from '../components/RiskMetricsPanel';
import { useNavigate } from 'react-router-dom';

// Error boundary component
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
          <Typography color="error" variant="h6">
            Something went wrong.
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
            {this.state.error?.toString() || "Unknown error"}
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

const RiskMetricsPage = () => {
  const { marketData = {} } = useMarketData() || {};
  const riskMetrics = marketData?.riskMetrics || {};
  const lastUpdate = marketData?.lastUpdate || null;
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden'
    }}>
      <AppBar position="static" elevation={0} sx={{ 
        backgroundColor: 'background.paper', 
        borderBottom: '1px solid', 
        borderColor: 'divider',
      }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Risk Metrics Dashboard
            </Typography>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
              <Link color="inherit" onClick={handleBack} sx={{ cursor: 'pointer' }}>
                Dashboard
              </Link>
              <Typography color="text.primary">Risk Metrics</Typography>
            </Breadcrumbs>
          </Box>
          {lastUpdate && (
            <Typography variant="body2" color="text.secondary">
              Last update: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 3,
        backgroundColor: 'background.default' 
      }}>
        <Paper elevation={0} sx={{ p: 3, height: '100%' }}>
          <ErrorBoundary>
            <RiskMetricsPanel riskMetrics={riskMetrics} />
          </ErrorBoundary>
        </Paper>
      </Box>
    </Box>
  );
};

export default RiskMetricsPage; 