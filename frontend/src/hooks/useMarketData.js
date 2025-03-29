import { useState, useEffect, useCallback } from 'react';
import useWebSocket from 'react-use-websocket';

const WS_URL = 'ws://localhost:8000/ws';

export default function useMarketData() {
  const [marketData, setMarketData] = useState({
    depth: null,
    trades: [],
    positions: [],
    riskMetrics: null,
    lastUpdate: null,
  });

  const [connectionStatus, setConnectionStatus] = useState('Connecting');

  const { lastMessage, sendMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => setConnectionStatus('Connected'),
    onClose: () => setConnectionStatus('Disconnected'),
    onError: () => setConnectionStatus('Error'),
    shouldReconnect: () => true,
    reconnectInterval: 3000,
  });

  // Update market data when new messages arrive
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        if (data.type === 'market_update') {
          setMarketData({
            depth: data.depth,
            trades: data.trades || [],
            positions: data.positions || [],
            riskMetrics: data.risk_metrics,
            lastUpdate: new Date(),
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  // Request specific data (currently not needed as server pushes all data)
  const requestData = useCallback((type) => {
    sendMessage(JSON.stringify({ action: 'request', type }));
  }, [sendMessage]);

  return {
    marketData,
    connectionStatus,
    requestData,
  };
} 