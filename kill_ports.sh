#!/bin/bash

# Kill Ports Script
#
# This script kills all processes running on ports used by the Crypto Trading Panel.
# It's a quick way to free up the ports without having to start the application.
#
# Usage: ./kill_ports.sh [PORT1 PORT2 ...]
#
# If specific ports are provided as arguments, only those ports will be cleared.
# Otherwise, the default application ports will be cleared.

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Function to check if port is in use and kill the process
kill_port_process() {
  local port=$1
  local process_name=$2
  
  echo -e "${YELLOW}Checking port $port...${NC}"
  
  # Find PIDs using the port
  local pids=$(lsof -t -i:$port 2>/dev/null)
  
  if [ -z "$pids" ]; then
    echo -e "${GREEN}Port $port is available.${NC}"
    return 0
  fi
  
  echo -e "${YELLOW}Port $port is in use by the following processes:${NC}"
  
  for pid in $pids; do
    # Get process details
    local process_info=$(ps -p $pid -o comm= 2>/dev/null || echo "Unknown process")
    local user_info=$(ps -p $pid -o user= 2>/dev/null || echo "Unknown user")
    local cmd_info=$(ps -p $pid -o cmd= 2>/dev/null || echo "Unknown command")
    
    echo -e "${YELLOW}  - PID: $pid | Process: $process_info | User: $user_info${NC}"
    echo -e "${YELLOW}    Command: $cmd_info${NC}"
    
    # Try to kill the process normally first
    echo -e "${YELLOW}    Killing process...${NC}"
    kill -9 $pid 2>/dev/null
    
    # Check if process was killed
    sleep 1
    if ! ps -p $pid > /dev/null 2>&1; then
      echo -e "${GREEN}    Process terminated successfully.${NC}"
    else
      # If normal kill failed, try with sudo
      echo -e "${RED}    Failed to terminate process with normal privileges.${NC}"
      if command_exists sudo; then
        echo -e "${YELLOW}    Attempting to kill with sudo...${NC}"
        sudo kill -9 $pid 2>/dev/null
        
        sleep 1
        if ! ps -p $pid > /dev/null 2>&1; then
          echo -e "${GREEN}    Process terminated successfully with sudo.${NC}"
        else
          echo -e "${RED}    Failed to terminate process even with sudo.${NC}"
        fi
      else
        echo -e "${RED}    Sudo not available. Cannot kill process with elevated privileges.${NC}"
      fi
    fi
  done
  
  # Double-check if port is now available
  sleep 1
  if [ -z "$(lsof -t -i:$port 2>/dev/null)" ]; then
    echo -e "${GREEN}Port $port is now available.${NC}"
  else
    echo -e "${RED}Port $port is still in use after kill attempts.${NC}"
    
    # As a last resort, try using fuser with sudo
    if command_exists fuser; then
      echo -e "${YELLOW}Attempting to kill using fuser with sudo...${NC}"
      sudo fuser -k -n tcp $port
      sleep 1
      
      if [ -z "$(lsof -t -i:$port 2>/dev/null)" ]; then
        echo -e "${GREEN}Port $port is now available after fuser kill.${NC}"
      else
        echo -e "${RED}Port $port is still in use.${NC}"
        
        # Get the process names from lsof output
        echo -e "${YELLOW}Attempting to kill all related processes by name...${NC}"
        local process_names=$(lsof -i:$port | tail -n +2 | awk '{print $1}' | sort | uniq)
        
        if [ ! -z "$process_names" ]; then
          for proc_name in $process_names; do
            echo -e "${YELLOW}Killing all '$proc_name' processes with killall...${NC}"
            if command_exists killall; then
              sudo killall -9 $proc_name
              echo -e "${GREEN}Sent kill signal to all $proc_name processes.${NC}"
            else
              echo -e "${RED}killall command not available.${NC}"
            fi
          done
          
          sleep 2
          
          if [ -z "$(lsof -t -i:$port 2>/dev/null)" ]; then
            echo -e "${GREEN}Port $port is now available after killing all related processes.${NC}"
          else
            echo -e "${RED}Port $port is still in use. You may need to reboot your system.${NC}"
            PORTS_STILL_OCCUPIED=true
          fi
        else
          echo -e "${RED}Could not determine process names to kill.${NC}"
          echo -e "${RED}You may need to reboot your system.${NC}"
          PORTS_STILL_OCCUPIED=true
        fi
      fi
    else
      echo -e "${RED}fuser command not available. Install it with 'sudo apt-get install psmisc' on Debian/Ubuntu${NC}"
      echo -e "${RED}You may need to reboot or manually kill the processes.${NC}"
      PORTS_STILL_OCCUPIED=true
    fi
  fi
}

# Function to prompt for reboot
offer_reboot() {
  if [ "$PORTS_STILL_OCCUPIED" = true ]; then
    echo -e "${YELLOW}===============================================${NC}"
    echo -e "${YELLOW}Some ports could not be freed. Would you like to reboot the system?${NC}"
    echo -e "${YELLOW}This will close all applications and restart your computer.${NC}"
    echo -e "${YELLOW}Type 'yes' to reboot or anything else to cancel: ${NC}"
    read -r response
    
    if [ "$response" = "yes" ]; then
      echo -e "${RED}Rebooting system now...${NC}"
      sudo reboot
    else
      echo -e "${YELLOW}Reboot cancelled. Some ports may still be in use.${NC}"
    fi
  fi
}

# Main script logic
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# Track if any ports remained occupied
PORTS_STILL_OCCUPIED=false

# Default ports used by the application
DEFAULT_PORTS=(8765 8000 3000 3001 3002)

if [ $# -eq 0 ]; then
  # No arguments provided, use default ports
  echo -e "${YELLOW}Killing processes on default application ports...${NC}"
  
  for port in "${DEFAULT_PORTS[@]}"; do
    kill_port_process "$port" "Application"
  done
else
  # Specific ports provided
  echo -e "${YELLOW}Killing processes on specified ports...${NC}"
  
  for port in "$@"; do
    if [[ "$port" =~ ^[0-9]+$ ]]; then
      kill_port_process "$port" "User-specified"
    else
      echo -e "${RED}Error: '$port' is not a valid port number.${NC}"
    fi
  done
fi

echo -e "${GREEN}Port cleanup completed.${NC}"
# Offer reboot if any ports are still occupied
offer_reboot
exit 0 