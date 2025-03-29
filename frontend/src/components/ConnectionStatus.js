import React from 'react';
import { Chip } from '@mui/material';
import SignalWifiStatusbar4BarIcon from '@mui/icons-material/SignalWifiStatusbar4Bar';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import SignalWifiConnectingIcon from '@mui/icons-material/SignalWifi4Bar';
import ErrorIcon from '@mui/icons-material/Error';

const ConnectionStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Connected':
        return {
          color: 'success',
          icon: <SignalWifiStatusbar4BarIcon />,
          label: 'Connected'
        };
      case 'Connecting':
        return {
          color: 'warning',
          icon: <SignalWifiConnectingIcon className="pulse" />,
          label: 'Connecting...'
        };
      case 'Error':
        return {
          color: 'error',
          icon: <ErrorIcon />,
          label: 'Error'
        };
      case 'Disconnected':
      default:
        return {
          color: 'error',
          icon: <SignalWifiOffIcon />,
          label: 'Disconnected'
        };
    }
  };

  const { color, icon, label } = getStatusConfig();

  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      variant="outlined"
      size="small"
      sx={{
        fontWeight: 'medium',
        '& .pulse': {
          animation: 'pulse 1.5s infinite ease-in-out'
        },
        '@keyframes pulse': {
          '0%': {
            opacity: 0.6,
          },
          '50%': {
            opacity: 1,
          },
          '100%': {
            opacity: 0.6,
          }
        }
      }}
    />
  );
};

export default ConnectionStatus; 