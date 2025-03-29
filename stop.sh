#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Stopping Crypto Trading Panel...${NC}"

# Check for PID file
if [ -f "$SCRIPT_DIR/.running_pids" ]; then
  # Read PIDs from file
  read backend_pid frontend_pid < "$SCRIPT_DIR/.running_pids"
  
  # Kill backend
  if [ ! -z "$backend_pid" ] && ps -p $backend_pid > /dev/null; then
    kill $backend_pid
    echo -e "${GREEN}Backend server stopped (PID: $backend_pid).${NC}"
  fi
  
  # Kill frontend
  if [ ! -z "$frontend_pid" ] && ps -p $frontend_pid > /dev/null; then
    kill $frontend_pid
    echo -e "${GREEN}Frontend server stopped (PID: $frontend_pid).${NC}"
  fi
  
  # Remove PID file
  rm -f "$SCRIPT_DIR/.running_pids"
else
  # Try to find processes by pattern matching
  backend_pid=$(pgrep -f "uvicorn main:app")
  if [ ! -z "$backend_pid" ]; then
    kill $backend_pid
    echo -e "${GREEN}Backend server stopped (PID: $backend_pid).${NC}"
  fi
  
  frontend_pid=$(pgrep -f "node.*start")
  if [ ! -z "$frontend_pid" ]; then
    kill $frontend_pid
    echo -e "${GREEN}Frontend server stopped (PID: $frontend_pid).${NC}"
  fi
fi

echo -e "${GREEN}Crypto Trading Panel has been stopped.${NC}" 