import { useState, useEffect, useCallback, useRef } from 'react';

const useMarketData = () => {
  const [marketData, setMarketData] = useState({
    trades: [],
    positions: [],
    depth: { bids: [], asks: [] },
    pnlData: [],
    lastUpdate: null
  });
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);

      // Check if there's an error in the response
      if (data.error) {
        console.error('Server error:', data.error);
        return;
      }

      // Update market data with the received data
      setMarketData(prevData => ({
        trades: data.trades || prevData.trades,
        positions: data.positions || prevData.positions,
        depth: data.depth || prevData.depth,
        pnlData: data.pnlData || prevData.pnlData,
        lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : new Date()
      }));

    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, []);

  // Handle WebSocket connection status changes
  const handleConnectionChange = useCallback((status) => {
    setConnectionStatus(status);
  }, []);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    try {
      // Clear any existing reconnection timeout
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }

      // Create new WebSocket connection
      ws.current = new WebSocket('ws://localhost:8765');

      ws.current.onopen = () => {
        handleConnectionChange('Connected');
        console.log('WebSocket connected');
      };

      ws.current.onclose = () => {
        handleConnectionChange('Disconnected');
        console.log('WebSocket disconnected');

        // Attempt to reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 5000);
      };

      ws.current.onerror = (error) => {
        handleConnectionChange('Error');
        console.error('WebSocket error:', error);
      };

      ws.current.onmessage = handleMessage;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      handleConnectionChange('Error');
    }
  }, [handleMessage, handleConnectionChange]);

  // Initialize WebSocket connection
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  // Subscribe to specific data channels
  const subscribe = useCallback((channels) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'subscribe',
        channels: channels
      }));
    }
  }, []);

  // Unsubscribe from specific data channels
  const unsubscribe = useCallback((channels) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'unsubscribe',
        channels: channels
      }));
    }
  }, []);

  // Subscribe to all channels when connection is established
  useEffect(() => {
    if (connectionStatus === 'Connected') {
      subscribe(['trades', 'positions', 'depth', 'pnl']);
    }
  }, [connectionStatus, subscribe]);

  // Debug logging for market data updates
  useEffect(() => {
    console.log('Market data updated:', {
      tradesCount: marketData.trades.length,
      positionsCount: marketData.positions.length,
      pnlDataCount: marketData.pnlData.length,
      lastUpdate: marketData.lastUpdate
    });
  }, [marketData]);

  return {
    marketData,
    connectionStatus,
    subscribe,
    unsubscribe
  };
};

export default useMarketData;