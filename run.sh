#!/bin/bash

# Crypto Trading Panel Startup Script
# 
# This script starts all components of the Crypto Trading Panel application.
# It handles port management, process cleanup, and dependency checks.
#
# Usage: ./run.sh [OPTIONS]
#
# Options:
#   --deep-cleanup            Perform a deep cleanup of all related processes
#   --kill-ports              Only kill processes on required ports and exit
#   --websocket-port PORT     Set custom WebSocket server port (default: 8765)
#   --backend-port PORT       Set custom backend server port (default: 8000)
#   --frontend-port PORT      Set custom frontend server port (default: 3000)
#
# Examples:
#   ./run.sh                               # Start with default settings
#   ./run.sh --deep-cleanup                # Clean up all related processes before starting
#   ./run.sh --kill-ports                  # Only kill processes on ports and exit
#   ./run.sh --frontend-port 3002          # Use port 3002 for frontend

# Default ports
WEBSOCKET_PORT=8765
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Default flags
DEEP_CLEANUP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --deep-cleanup)
      DEEP_CLEANUP=true
      shift
      ;;
    --websocket-port)
      WEBSOCKET_PORT="$2"
      shift 2
      ;;
    --backend-port)
      BACKEND_PORT="$2"
      shift 2
      ;;
    --frontend-port)
      FRONTEND_PORT="$2"
      shift 2
      ;;
    --kill-ports)
      KILL_PORTS=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown argument: $1${NC}"
      echo -e "Usage: $0 [--deep-cleanup] [--websocket-port PORT] [--backend-port PORT] [--frontend-port PORT] [--kill-ports]"
      exit 1
      ;;
  esac
done

# Function to kill all existing application processes
kill_all_existing_app_processes() {
  echo -e "${YELLOW}Checking for existing application processes...${NC}"
  
  # Check if we have stored PIDs from previous run
  if [ -f "$SCRIPT_DIR/.running_pids" ]; then
    echo -e "${YELLOW}Found previously stored PIDs. Cleaning up...${NC}"
    
    # Read PIDs from file
    local pids=$(cat "$SCRIPT_DIR/.running_pids")
    
    for pid in $pids; do
      if ps -p $pid > /dev/null 2>&1; then
        echo -e "${YELLOW}Killing process with PID $pid...${NC}"
        kill -9 $pid 2>/dev/null
        
        if ! ps -p $pid > /dev/null 2>&1; then
          echo -e "${GREEN}Process $pid terminated successfully.${NC}"
        else
          echo -e "${RED}Failed to terminate process $pid.${NC}"
        fi
      else
        echo -e "${GREEN}Process $pid is not running.${NC}"
      fi
    done
    
    # Remove PID file
    rm -f "$SCRIPT_DIR/.running_pids"
    echo -e "${GREEN}Cleanup of previously stored PIDs completed.${NC}"
  fi
  
  # If deep cleanup is enabled, search for any related processes by name
  if [ "$DEEP_CLEANUP" = true ]; then
    echo -e "${YELLOW}Performing deep cleanup of all related processes...${NC}"
    
    # Look for Python processes that might be related to our application
    echo -e "${YELLOW}Looking for Python processes related to our application...${NC}"
    local py_pids=$(ps aux | grep python | grep -E "websocket_server|uvicorn|main\.py|fastapi" | grep -v grep | awk '{print $2}')
    
    if [ ! -z "$py_pids" ]; then
      for pid in $py_pids; do
        echo -e "${YELLOW}Killing Python process with PID $pid...${NC}"
        kill -9 $pid 2>/dev/null
      done
      echo -e "${GREEN}Python processes cleanup completed.${NC}"
    else
      echo -e "${GREEN}No related Python processes found.${NC}"
    fi
    
    # Look for Node processes that might be related to our application
    echo -e "${YELLOW}Looking for Node processes related to our application...${NC}"
    local node_pids=$(ps aux | grep -E "node|npm" | grep -E "react-scripts|start" | grep -v grep | awk '{print $2}')
    
    if [ ! -z "$node_pids" ]; then
      for pid in $node_pids; do
        echo -e "${YELLOW}Killing Node process with PID $pid...${NC}"
        kill -9 $pid 2>/dev/null
      done
      echo -e "${GREEN}Node processes cleanup completed.${NC}"
    else
      echo -e "${GREEN}No related Node processes found.${NC}"
    fi
    
    # Look for any processes using our configured ports
    echo -e "${YELLOW}Checking for processes using our configured ports...${NC}"
    kill_process_on_port $WEBSOCKET_PORT "WebSocket"
    kill_process_on_port $BACKEND_PORT "Backend"
    kill_process_on_port $FRONTEND_PORT "Frontend"
  fi
}

# Function to find an available port
find_available_port() {
  local start_port=$1
  local port=$start_port
  
  while [ $(lsof -t -i:$port 2>/dev/null | wc -l) -gt 0 ]; do
    port=$((port + 1))
    echo -e "${YELLOW}Port $start_port is not available, trying port $port...${NC}"
  done
  
  echo $port
}

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
  
  # Find PIDs using the port
  local pids=$(lsof -t -i:$port)
  
  if [ ! -z "$pids" ]; then
    echo -e "${YELLOW}Port $port is in use by the following processes:${NC}"
    
    for pid in $pids; do
      # Get process details
      local process_info=$(ps -p $pid -o comm= 2>/dev/null || echo "Unknown process")
      local user_info=$(ps -p $pid -o user= 2>/dev/null || echo "Unknown user")
      local cmd_info=$(ps -p $pid -o cmd= 2>/dev/null || echo "Unknown command")
      
      echo -e "${YELLOW}  - PID: $pid | Process: $process_info | User: $user_info${NC}"
      echo -e "${YELLOW}    Command: $cmd_info${NC}"
      
      # Kill the process
      echo -e "${YELLOW}    Killing process...${NC}"
      kill -9 $pid 2>/dev/null
      
      # Verify if process was killed
      if ! ps -p $pid > /dev/null 2>&1; then
        echo -e "${GREEN}    Process terminated successfully.${NC}"
      else
        echo -e "${RED}    Failed to terminate process. You may need root privileges.${NC}"
      fi
    done
    
    # Double-check if port is now available
    sleep 1
    if [ -z "$(lsof -t -i:$port)" ]; then
      echo -e "${GREEN}Port $port is now available.${NC}"
    else
      echo -e "${RED}Port $port is still in use. Unable to free the port.${NC}"
      echo -e "${RED}You may need to manually kill the processes or use a different port.${NC}"
    fi
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

# Clean up any existing app processes
kill_all_existing_app_processes

# Kill processes on required ports
echo -e "${YELLOW}Checking for processes using required ports...${NC}"
kill_process_on_port $WEBSOCKET_PORT "WebSocket"
kill_process_on_port $BACKEND_PORT "Backend"
kill_process_on_port $FRONTEND_PORT "Frontend"
kill_process_on_port $((FRONTEND_PORT+1)) "Frontend Alternate"
kill_process_on_port $((FRONTEND_PORT+2)) "Frontend Alternate"

# If kill-ports flag is set, exit after killing ports
if [ "$KILL_PORTS" = true ]; then
  echo -e "${GREEN}Port cleanup completed. Exiting as requested.${NC}"
  exit 0
fi

# Check if the ports are now available, if not find alternatives
if [ ! -z "$(lsof -t -i:$WEBSOCKET_PORT 2>/dev/null)" ]; then
  WEBSOCKET_PORT=$(find_available_port $WEBSOCKET_PORT)
  echo -e "${YELLOW}Using alternative WebSocket port: $WEBSOCKET_PORT${NC}"
fi

if [ ! -z "$(lsof -t -i:$BACKEND_PORT 2>/dev/null)" ]; then
  BACKEND_PORT=$(find_available_port $BACKEND_PORT)
  echo -e "${YELLOW}Using alternative Backend port: $BACKEND_PORT${NC}"
fi

if [ ! -z "$(lsof -t -i:$FRONTEND_PORT 2>/dev/null)" ]; then
  FRONTEND_PORT=$(find_available_port $FRONTEND_PORT)
  echo -e "${YELLOW}Using alternative Frontend port: $FRONTEND_PORT${NC}"
fi

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
python3 websocket_server.py --port $WEBSOCKET_PORT > websocket.log 2>&1 &
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
  ./run.sh --port $BACKEND_PORT > backend.log 2>&1 &
else
  python3 -m uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT > backend.log 2>&1 &
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

# Start frontend in background with PORT environment variable set
export PORT=$FRONTEND_PORT
npm start > frontend.log 2>&1 &
frontend_pid=$!
echo -e "${GREEN}Frontend server started (PID: $frontend_pid).${NC}"
echo -e "${GREEN}Frontend logs available at: $SCRIPT_DIR/frontend/frontend.log${NC}"

# Save PIDs and port configuration to a file for later cleanup
echo "$websocket_pid $backend_pid $frontend_pid" > "$SCRIPT_DIR/.running_pids"
echo "WEBSOCKET_PORT=$WEBSOCKET_PORT" > "$SCRIPT_DIR/.port_config"
echo "BACKEND_PORT=$BACKEND_PORT" >> "$SCRIPT_DIR/.port_config"
echo "FRONTEND_PORT=$FRONTEND_PORT" >> "$SCRIPT_DIR/.port_config"

# Wait a moment for servers to start
sleep 3

# Check if WebSocket server is running
if ! ps -p $websocket_pid > /dev/null; then
  echo -e "${RED}WebSocket server failed to start. Check logs at: $SCRIPT_DIR/backend/websocket.log${NC}"
else
  echo -e "${GREEN}WebSocket server running at: ws://localhost:$WEBSOCKET_PORT${NC}"
fi

# Check if backend is running
if ! ps -p $backend_pid > /dev/null; then
  echo -e "${RED}Backend server failed to start. Check logs at: $SCRIPT_DIR/backend/backend.log${NC}"
else
  echo -e "${GREEN}Backend server running at: http://localhost:$BACKEND_PORT${NC}"
fi

# Check if frontend is running
if ! ps -p $frontend_pid > /dev/null; then
  echo -e "${RED}Frontend server failed to start. Check logs at: $SCRIPT_DIR/frontend/frontend.log${NC}"
else
  echo -e "${GREEN}Frontend server running at: http://localhost:$FRONTEND_PORT${NC}"
fi

echo -e "${GREEN}Crypto Trading Panel is now starting.${NC}"
echo -e "${YELLOW}The application should be available at http://localhost:$FRONTEND_PORT${NC}"
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
  
  # Remove PID and config files
  rm -f "$SCRIPT_DIR/.running_pids"
  rm -f "$SCRIPT_DIR/.port_config"
  
  echo -e "${GREEN}Crypto Trading Panel stopped.${NC}"
  exit 0
}

trap cleanup INT

# Keep script running until user presses Ctrl+C
while true; do
  sleep 1
done 