#!/bin/bash
echo "Starting crypto trading panel with shared memory integration..."

# Start backend WebSocket server in the background
echo "Starting WebSocket server..."
cd backend
python websocket_server.py &
WEBSOCKET_PID=$!
cd ..

# Wait a moment for the WebSocket server to start
sleep 2

# Start frontend application
echo "Starting frontend application on port 3001..."
cd frontend
npm start

# When frontend process ends, also kill the WebSocket server
kill $WEBSOCKET_PID

echo "All processes stopped." 