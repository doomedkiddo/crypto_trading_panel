import React from 'react';
import { 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton,
  Breadcrumbs,
  Link,
  Paper,
  alpha,
  useTheme,
  Container
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import useMarketData from '../hooks/useMarketData';
import EnhancedRiskMetricsPanel from '../components/EnhancedRiskMetricsPanel';
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

const EnhancedRiskMetricsPage = () => {
  const theme = useTheme();
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
      overflow: 'hidden',
      background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.dark, 0.3)} 100%)`,
    }}>
      <AppBar position="static" elevation={3} sx={{ 
        background: `linear-gradient(90deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.dark, 0.6)} 100%)`, 
        borderBottom: '1px solid', 
        borderColor: alpha(theme.palette.primary.main, 0.3),
      }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={handleBack}
            sx={{ 
              mr: 2,
              color: theme.palette.primary.light,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.info.light} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px'
              }}
            >
              Risk Intelligence Dashboard
            </Typography>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
              <Link color="inherit" onClick={handleBack} sx={{ cursor: 'pointer', color: theme.palette.primary.light }}>
                Dashboard
              </Link>
              <Typography sx={{ color: alpha(theme.palette.primary.light, 0.7) }}>Risk Metrics</Typography>
            </Breadcrumbs>
          </Box>
          {lastUpdate && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: alpha(theme.palette.primary.light, 0.7),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: '4px',
                padding: '4px 8px',
                backgroundColor: alpha(theme.palette.background.paper, 0.6)
              }}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 3,
        background: `radial-gradient(circle at 80% 20%, ${alpha(theme.palette.primary.dark, 0.15)} 0%, transparent 50%)`,
      }}>
        <Container maxWidth="xl">
          <Paper 
            elevation={6} 
            sx={{ 
              p: 3,
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: `0 10px 30px -5px ${alpha(theme.palette.common.black, 0.3)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '5px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }
            }}
          >
            <ErrorBoundary>
              <EnhancedRiskMetricsPanel riskMetrics={riskMetrics} />
            </ErrorBoundary>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default EnhancedRiskMetricsPage; 