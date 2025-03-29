#!/bin/bash
cd "$(dirname "$0")"

CONFIG_FILE="config.json"

# Check if the config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Config file not found. Creating a new one..."
  cat > "$CONFIG_FILE" << EOF
{
    "api_key": "",
    "api_secret": "",
    "passphrase": "",
    "exchange": "okx"
}
EOF
fi

# Function to read JSON values
get_json_value() {
  local json_file="$1"
  local key="$2"
  python3 -c "import json; print(json.load(open('$json_file')).get('$key', ''))"
}

# Function to update JSON values
update_json_value() {
  local json_file="$1"
  local key="$2"
  local value="$3"
  python3 -c "
import json
data = json.load(open('$json_file'))
data['$key'] = '$value'
json.dump(data, open('$json_file', 'w'), indent=4)
"
}

# Check API key in config file
API_KEY=$(get_json_value "$CONFIG_FILE" "api_key")
if [ -z "$API_KEY" ]; then
  echo "API key not found in config file. Do you want to enter it now? (y/n)"
  read answer
  if [ "$answer" == "y" ]; then
    echo "Enter your exchange API key:"
    read -s API_KEY
    update_json_value "$CONFIG_FILE" "api_key" "$API_KEY"
    echo "API key saved to config file."
  fi
fi

# Check API secret in config file
API_SECRET=$(get_json_value "$CONFIG_FILE" "api_secret")
if [ -z "$API_SECRET" ]; then
  echo "API secret not found in config file. Do you want to enter it now? (y/n)"
  read answer
  if [ "$answer" == "y" ]; then
    echo "Enter your exchange API secret:"
    read -s API_SECRET
    update_json_value "$CONFIG_FILE" "api_secret" "$API_SECRET"
    echo "API secret saved to config file."
  fi
fi

# Check passphrase in config file
PASSPHRASE=$(get_json_value "$CONFIG_FILE" "passphrase")
if [ -z "$PASSPHRASE" ]; then
  echo "Passphrase not found in config file. Do you want to enter it now? (y/n)"
  read answer
  if [ "$answer" == "y" ]; then
    echo "Enter your exchange passphrase (if required):"
    read -s PASSPHRASE
    update_json_value "$CONFIG_FILE" "passphrase" "$PASSPHRASE"
    echo "Passphrase saved to config file."
  fi
fi

# Start the backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload 