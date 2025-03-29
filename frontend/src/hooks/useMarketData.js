import { useState, useEffect, useCallback } from 'react';
import useWebSocket from 'react-use-websocket';

const WS_URL = 'ws://localhost:8000/ws';

// Default empty state to prevent null errors
const defaultMarketData = {
  depth: { bids: [], asks: [] },
  trades: [],
  positions: [],
  riskMetrics: {},
  lastUpdate: null,
};

export default function useMarketData() {
  const [marketData, setMarketData] = useState(defaultMarketData);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');

  // Use try-catch for websocket connection
  const { lastMessage, sendMessage } = useWebSocket(WS_URL, {
    onOpen: () => setConnectionStatus('Connected'),
    onClose: () => setConnectionStatus('Disconnected'),
    onError: () => {
      console.error('WebSocket connection error');
      setConnectionStatus('Error');
    },
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    // Add a catch handler for websocket errors
    share: false,
    retryOnError: true,
  });

  // Update market data when new messages arrive
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        if (data && data.type === 'market_update') {
          // Safely parse data with defaults to prevent null/undefined errors
          setMarketData({
            depth: data.depth || { bids: [], asks: [] },
            trades: Array.isArray(data.trades) ? data.trades.map(trade => ({
              ...trade,
              price: parseFloat(trade.price),
              quantity: parseFloat(trade.quantity)
            })) : [],
            positions: Array.isArray(data.positions) ? data.positions.map(position => ({
              ...position,
              quantity: parseFloat(position.quantity),
              entry_price: parseFloat(position.entry_price),
              current_price: parseFloat(position.current_price),
              unrealized_pnl: parseFloat(position.unrealized_pnl),
            })) : [],
            riskMetrics: data.risk_metrics || {},
            lastUpdate: new Date(),
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        // Don't update state on error to preserve previous valid state
      }
    }
  }, [lastMessage]);

  // Request specific data (currently not needed as server pushes all data)
  const requestData = useCallback((type) => {
    try {
      sendMessage(JSON.stringify({ action: 'request', type }));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [sendMessage]);

  // Function to handle data fetching errors
  const handleError = useCallback((error) => {
    console.error('Market data error:', error);
    setConnectionStatus('Error');
  }, []);

  return {
    marketData,
    connectionStatus,
    requestData,
    handleError,
  };
} 