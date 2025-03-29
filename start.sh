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

# Check for required directories
if [ ! -d "$SCRIPT_DIR/backend" ]; then
  echo -e "${RED}Backend directory not found. Make sure you're running this script from the project root.${NC}"
  exit 1
fi

if [ ! -d "$SCRIPT_DIR/frontend" ]; then
  echo -e "${RED}Frontend directory not found. Make sure you're running this script from the project root.${NC}"
  exit 1
fi

# Check for backend requirements
echo -e "${YELLOW}Checking Python dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
if [ -f "requirements.txt" ]; then
  # Install required packages from requirements.txt
  echo -e "${YELLOW}Installing required Python packages...${NC}"
  pip3 install -r requirements.txt
else
  # Check for uvicorn specifically
  if ! python_package_installed uvicorn; then
    echo -e "${YELLOW}Installing uvicorn package...${NC}"
    pip3 install uvicorn fastapi
  fi
fi

# Check for shared memory directory
if [ ! -d "/dev/shm/okx_market_data" ]; then
  echo -e "${YELLOW}Warning: Shared memory directory (/dev/shm/okx_market_data) not found.${NC}"
  echo -e "${YELLOW}Market data may not be available.${NC}"
fi

# Start backend
echo -e "${YELLOW}Starting backend server...${NC}"
cd "$SCRIPT_DIR/backend"
chmod +x run.sh

# Kill any existing backend process
backend_pid=$(pgrep -f "uvicorn main:app")
if [ ! -z "$backend_pid" ]; then
  echo -e "${YELLOW}Stopping existing backend process (PID: $backend_pid)...${NC}"
  kill $backend_pid
fi

# Start backend in background
./run.sh > backend.log 2>&1 &
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

# Kill any existing frontend process
frontend_pid=$(pgrep -f "node.*start")
if [ ! -z "$frontend_pid" ]; then
  echo -e "${YELLOW}Stopping existing frontend process (PID: $frontend_pid)...${NC}"
  kill $frontend_pid
fi

# Start frontend in background
npm start > frontend.log 2>&1 &
frontend_pid=$!
echo -e "${GREEN}Frontend server started (PID: $frontend_pid).${NC}"
echo -e "${GREEN}Frontend logs available at: $SCRIPT_DIR/frontend/frontend.log${NC}"

# Wait a moment for servers to start
sleep 3

# Check if backend is running
if ! ps -p $backend_pid > /dev/null; then
  echo -e "${RED}Backend server failed to start. Check logs at: $SCRIPT_DIR/backend/backend.log${NC}"
  # Don't exit, still let the frontend run
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
echo -e "${YELLOW}Press Ctrl+C to stop the servers.${NC}"

# Save PIDs to a file for later cleanup
echo "$backend_pid $frontend_pid" > "$SCRIPT_DIR/.running_pids"

# Wait for user to press Ctrl+C to stop both servers
cleanup() {
  echo -e "${YELLOW}Stopping servers...${NC}"
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