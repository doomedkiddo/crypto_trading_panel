#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR"

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Function to check if a Python package is installed
python_package_installed() {
  python3 -c "import $1" 2>/dev/null
  return $?
}

# Function to check if port is in use and kill the process
kill_process_on_port() {
  local port=$1
  local process_name=$2
  
  # Find PID using the port
  local pid=$(lsof -t -i:$port)
  
  if [ ! -z "$pid" ]; then
    echo -e "${YELLOW}Port $port is in use by PID $pid. Killing process...${NC}"
    kill -9 $pid
    sleep 1
    echo -e "${GREEN}Process on port $port has been terminated.${NC}"
  else
    echo -e "${GREEN}Port $port is available.${NC}"
  fi
}

# Check dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"

# Check for python
if ! command_exists python3; then
  echo -e "${RED}Python 3 is not installed. Please install Python 3 and try again.${NC}"
  exit 1
fi

# Check for pip
if ! command_exists pip3; then
  echo -e "${RED}pip3 is not installed. Please install pip3 and try again.${NC}"
  exit 1
fi

# Check for npm
if ! command_exists npm; then
  echo -e "${RED}NPM is not installed. Please install Node.js and NPM, then try again.${NC}"
  exit 1
fi

# Check for lsof
if ! command_exists lsof; then
  echo -e "${YELLOW}Installing lsof for port checking...${NC}"
  apt-get update && apt-get install -y lsof || yum install -y lsof || zypper install -y lsof
  
  if ! command_exists lsof; then
    echo -e "${RED}Failed to install lsof. Please install it manually and try again.${NC}"
    exit 1
  fi
fi

# Check for required directories
if [ ! -d "$SCRIPT_DIR/backend" ]; then
  echo -e "${RED}Backend directory not found. Make sure you're running this script from the project root.${NC}"
  exit 1
fi

if [ ! -d "$SCRIPT_DIR/frontend" ]; then
  echo -e "${RED}Frontend directory not found. Make sure you're running this script from the project root.${NC}"
  exit 1
fi

# Check for shared memory directory
if [ ! -d "/dev/shm/okx_market_data" ]; then
  echo -e "${YELLOW}Warning: Shared memory directory (/dev/shm/okx_market_data) not found.${NC}"
  echo -e "${YELLOW}Market data may not be available.${NC}"
fi

# Kill processes on required ports
echo -e "${YELLOW}Checking for processes using required ports...${NC}"
kill_process_on_port 8765 "WebSocket"
kill_process_on_port 8000 "Backend"
kill_process_on_port 3000 "Frontend"
kill_process_on_port 3001 "Frontend"

# Check for backend requirements
echo -e "${YELLOW}Checking Python dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
if [ -f "requirements.txt" ]; then
  # Install required packages from requirements.txt
  echo -e "${YELLOW}Installing required Python packages...${NC}"
  pip3 install -r requirements.txt
else
  # Check for required packages
  if ! python_package_installed uvicorn; then
    echo -e "${YELLOW}Installing uvicorn package...${NC}"
    pip3 install uvicorn fastapi
  fi
  
  if ! python_package_installed websockets; then
    echo -e "${YELLOW}Installing websockets package...${NC}"
    pip3 install websockets
  fi
fi

# Start WebSocket server
echo -e "${YELLOW}Starting WebSocket server...${NC}"
cd "$SCRIPT_DIR/backend"
python3 websocket_server.py > websocket.log 2>&1 &
websocket_pid=$!
echo -e "${GREEN}WebSocket server started (PID: $websocket_pid).${NC}"
echo -e "${GREEN}WebSocket logs available at: $SCRIPT_DIR/backend/websocket.log${NC}"

# Wait a moment for WebSocket server to start
sleep 2

# Start backend server
echo -e "${YELLOW}Starting backend server...${NC}"
cd "$SCRIPT_DIR/backend"
if [ -f "run.sh" ]; then
  chmod +x run.sh
  ./run.sh > backend.log 2>&1 &
else
  python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
fi
backend_pid=$!
echo -e "${GREEN}Backend server started (PID: $backend_pid).${NC}"
echo -e "${GREEN}Backend logs available at: $SCRIPT_DIR/backend/backend.log${NC}"

# Start frontend
echo -e "${YELLOW}Starting frontend server...${NC}"
cd "$SCRIPT_DIR/frontend"

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies...${NC}"
  npm install
fi

# Start frontend in background
npm start > frontend.log 2>&1 &
frontend_pid=$!
echo -e "${GREEN}Frontend server started (PID: $frontend_pid).${NC}"
echo -e "${GREEN}Frontend logs available at: $SCRIPT_DIR/frontend/frontend.log${NC}"

# Save PIDs to a file for later cleanup
echo "$websocket_pid $backend_pid $frontend_pid" > "$SCRIPT_DIR/.running_pids"

# Wait a moment for servers to start
sleep 3

# Check if WebSocket server is running
if ! ps -p $websocket_pid > /dev/null; then
  echo -e "${RED}WebSocket server failed to start. Check logs at: $SCRIPT_DIR/backend/websocket.log${NC}"
else
  echo -e "${GREEN}WebSocket server running at: ws://localhost:8765${NC}"
fi

# Check if backend is running
if ! ps -p $backend_pid > /dev/null; then
  echo -e "${RED}Backend server failed to start. Check logs at: $SCRIPT_DIR/backend/backend.log${NC}"
else
  echo -e "${GREEN}Backend server running at: http://localhost:8000${NC}"
fi

# Check if frontend is running
if ! ps -p $frontend_pid > /dev/null; then
  echo -e "${RED}Frontend server failed to start. Check logs at: $SCRIPT_DIR/frontend/frontend.log${NC}"
else
  echo -e "${GREEN}Frontend server running at: http://localhost:3000${NC}"
fi

echo -e "${GREEN}Crypto Trading Panel is now starting.${NC}"
echo -e "${YELLOW}The application should open in your default browser shortly.${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers.${NC}"

# Setup cleanup function for Ctrl+C
cleanup() {
  echo -e "${YELLOW}Stopping servers...${NC}"
  
  # Kill WebSocket server
  if ps -p $websocket_pid > /dev/null; then
    kill $websocket_pid
    echo -e "${GREEN}WebSocket server stopped.${NC}"
  fi
  
  # Kill backend
  if ps -p $backend_pid > /dev/null; then
    kill $backend_pid
    echo -e "${GREEN}Backend server stopped.${NC}"
  fi
  
  # Kill frontend
  if ps -p $frontend_pid > /dev/null; then
    kill $frontend_pid
    echo -e "${GREEN}Frontend server stopped.${NC}"
  fi
  
  # Remove PID file
  rm -f "$SCRIPT_DIR/.running_pids"
  
  echo -e "${GREEN}Crypto Trading Panel stopped.${NC}"
  exit 0
}

trap cleanup INT

# Keep script running until user presses Ctrl+C
while true; do
  sleep 1
done 