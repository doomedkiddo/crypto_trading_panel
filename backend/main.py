#!/usr/bin/env python3
import os
import asyncio
import json
import mmap
import ctypes
import time
from ctypes import Structure, c_double, c_uint64, c_char, c_bool
from typing import Dict, List, Optional
from datetime import datetime
import pathlib

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Define data structures (same as in simple_shm_reader.py)
class PriceLevel(Structure):
    _fields_ = [
        ("price", c_double),
        ("quantity", c_double)
    ]

class DepthData(Structure):
    _fields_ = [
        ("exchange_ts", c_uint64),
        ("local_ts", c_uint64),
        ("bids", PriceLevel * 10),
        ("asks", PriceLevel * 10)
    ]

class PublicTrade(Structure):
    _fields_ = [
        ("price", c_double),
        ("quantity", c_double),
        ("exchange_ts", c_uint64),
        ("local_ts", c_uint64),
        ("trade_id", c_char * 32),
        ("is_buyer_maker", c_bool)
    ]

# Shared memory configuration
SHM_MOUNT_POINT = "/dev/shm"
SHM_DIRECTORY = "okx_market_data"
INSTRUMENT = "BTC-USDT"  # Default instrument

# Position tracking model
class Position(BaseModel):
    instrument: str
    quantity: float = 0.0
    entry_price: float = 0.0
    current_price: float = 0.0
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0
    liquidation_price: Optional[float] = None
    margin_ratio: float = 0.0
    last_update: float = 0.0

# Risk metrics model
class RiskMetrics(BaseModel):
    total_equity: float = 0.0
    used_margin: float = 0.0
    available_margin: float = 0.0
    margin_ratio: float = 0.0
    daily_pnl: float = 0.0
    drawdown: float = 0.0
    var_95: float = 0.0
    max_position_size: float = 0.0
    position_concentration: float = 0.0

# API response models
class MarketDepth(BaseModel):
    instrument: str
    timestamp: int
    bids: List[Dict[str, float]]
    asks: List[Dict[str, float]]

class Trade(BaseModel):
    instrument: str
    price: float
    quantity: float
    timestamp: int
    trade_id: str
    is_buyer_maker: bool

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

app = FastAPI(title="Crypto Trading Panel API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize connection manager
manager = ConnectionManager()

# Mock initial data - in a real system, this would come from a database or trading system
# TODO: Implement proper position tracking with exchange API keys
positions = {
    "BTC-USDT": Position(
        instrument="BTC-USDT",
        quantity=0.0,  # Set to zero since we don't have real position data
        entry_price=0.0,
        current_price=0.0,
        unrealized_pnl=0.0,
        realized_pnl=0.0,
        liquidation_price=None,
        margin_ratio=0.0,
        last_update=time.time()
    )
}

risk_metrics = RiskMetrics(
    total_equity=0.0,  # Set to zero since we don't have real account data
    used_margin=0.0,
    available_margin=0.0,
    margin_ratio=0.0,
    daily_pnl=0.0,
    drawdown=0.0,
    var_95=0.0,
    max_position_size=0.0,
    position_concentration=0.0
)

# API key configuration - load from config file
CONFIG_FILE = pathlib.Path(__file__).parent / "config.json"
API_CONFIG = {
    "api_key": "",
    "api_secret": "",
    "passphrase": ""
}

def has_valid_api_credentials():
    """Check if valid API credentials are configured"""
    return API_CONFIG["api_key"] and API_CONFIG["api_secret"]

# Try to load config from file
try:
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r") as f:
            config_data = json.load(f)
            if "api_key" in config_data:
                API_CONFIG["api_key"] = config_data["api_key"]
            if "api_secret" in config_data:
                API_CONFIG["api_secret"] = config_data["api_secret"]
            if "passphrase" in config_data:
                API_CONFIG["passphrase"] = config_data["passphrase"]
        print("Loaded API configuration from config.json")
    else:
        print("Config file not found at:", CONFIG_FILE)
        # Fall back to environment variables if config file doesn't exist
        API_CONFIG["api_key"] = os.getenv("EXCHANGE_API_KEY", "")
        API_CONFIG["api_secret"] = os.getenv("EXCHANGE_API_SECRET", "")
        API_CONFIG["passphrase"] = os.getenv("EXCHANGE_PASSPHRASE", "")
        print("Using environment variables for API configuration")
except Exception as e:
    print(f"Error loading config file: {e}")
    # Fall back to environment variables
    API_CONFIG["api_key"] = os.getenv("EXCHANGE_API_KEY", "")
    API_CONFIG["api_secret"] = os.getenv("EXCHANGE_API_SECRET", "")
    API_CONFIG["passphrase"] = os.getenv("EXCHANGE_PASSPHRASE", "")
    print("Using environment variables for API configuration")

# Log whether we have API credentials (without exposing the actual keys)
print(f"API credentials {'configured' if has_valid_api_credentials() else 'not configured'}")

def fetch_positions_from_exchange():
    """Fetch real position data from exchange using API credentials
    
    This is a placeholder function that should be implemented with
    actual exchange API integration code.
    """
    if not has_valid_api_credentials():
        return None
    
    try:
        # TODO: Implement exchange-specific API calls to fetch positions
        # Example pseudocode:
        # client = ExchangeClient(API_CONFIG["api_key"], API_CONFIG["api_secret"])
        # exchange_positions = client.get_positions()
        # 
        # parsed_positions = {}
        # for pos in exchange_positions:
        #     parsed_positions[pos["symbol"]] = Position(
        #         instrument=pos["symbol"],
        #         quantity=float(pos["size"]),
        #         entry_price=float(pos["entry_price"]),
        #         current_price=float(pos["mark_price"]),
        #         unrealized_pnl=float(pos["unrealized_pnl"]),
        #         realized_pnl=float(pos["realized_pnl"]),
        #         liquidation_price=float(pos["liquidation_price"]) if pos["liquidation_price"] else None,
        #         margin_ratio=float(pos["margin_ratio"]),
        #         last_update=time.time()
        #     )
        # return parsed_positions
        
        # For now, return None to use mock data
        return None
    except Exception as e:
        print(f"Error fetching positions from exchange: {e}")
        return None

def fetch_account_risk_metrics_from_exchange():
    """Fetch real account risk metrics from exchange using API credentials
    
    This is a placeholder function that should be implemented with
    actual exchange API integration code.
    """
    if not has_valid_api_credentials():
        return None
    
    try:
        # TODO: Implement exchange-specific API calls to fetch account data
        # Example pseudocode:
        # client = ExchangeClient(API_CONFIG["api_key"], API_CONFIG["api_secret"])
        # account = client.get_account()
        # 
        # return RiskMetrics(
        #     total_equity=float(account["equity"]),
        #     used_margin=float(account["used_margin"]),
        #     available_margin=float(account["available_margin"]),
        #     margin_ratio=float(account["margin_ratio"]),
        #     daily_pnl=float(account["daily_pnl"]),
        #     drawdown=float(account["drawdown"]),
        #     var_95=calculate_var(account),  # Would need implementation
        #     max_position_size=calculate_max_position(account),  # Would need implementation
        #     position_concentration=calculate_concentration(account)  # Would need implementation
        # )
        
        # For now, return None to use mock data
        return None
    except Exception as e:
        print(f"Error fetching account risk metrics from exchange: {e}")
        return None

def get_shm_name(instrument):
    name = instrument.replace('-', '_')
    return f"OKX_{name}"

def get_shm_path(shm_name):
    return f"{SHM_MOUNT_POINT}/{SHM_DIRECTORY}/{shm_name}"

def read_market_data(instrument=INSTRUMENT):
    try:
        # Try to fetch position data from exchange
        real_positions = fetch_positions_from_exchange()
        real_risk_metrics = fetch_account_risk_metrics_from_exchange()
        
        # If we have real position data, use it instead of mock data
        if real_positions:
            global positions
            positions = real_positions
        
        # If we have real risk metrics, use them instead of mock data
        if real_risk_metrics:
            global risk_metrics
            risk_metrics = real_risk_metrics
            
        # Continue with existing shared memory reading logic...
        shm_name = get_shm_name(instrument)
        shm_path = get_shm_path(shm_name)
        
        if not os.path.exists(shm_path):
            return None, None
        
        with open(shm_path, "rb") as f:
            mm = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
            
            # Read depth data
            mm.seek(0)
            depth_size = ctypes.sizeof(DepthData)
            depth_bytes = mm.read(depth_size)
            depth = DepthData.from_buffer_copy(depth_bytes)
            
            # Process depth data
            market_depth = MarketDepth(
                instrument=instrument,
                timestamp=depth.exchange_ts,
                bids=[{"price": bid.price, "quantity": bid.quantity} for bid in depth.bids if bid.price > 0],
                asks=[{"price": ask.price, "quantity": ask.quantity} for ask in depth.asks if ask.price > 0]
            )
            
            # Read trades data
            trades = []
            trade_size = ctypes.sizeof(PublicTrade)
            offset = depth_size
            
            for i in range(10):  # Read up to 10 recent trades
                try:
                    mm.seek(offset + i * trade_size)
                    trade_bytes = mm.read(trade_size)
                    trade = PublicTrade.from_buffer_copy(trade_bytes)
                    
                    if trade.price == 0:  # Skip empty trades
                        continue
                        
                    trade_id = bytes(trade.trade_id).split(b'\0', 1)[0].decode('utf-8', errors='ignore')
                    
                    trades.append(Trade(
                        instrument=instrument,
                        price=trade.price,
                        quantity=trade.quantity,
                        timestamp=trade.exchange_ts,
                        trade_id=trade_id,
                        is_buyer_maker=trade.is_buyer_maker
                    ))
                except:
                    break
            
            mm.close()
            return market_depth, trades
            
    except Exception as e:
        print(f"Error reading shared memory: {e}")
        return None, None

# Update position data based on current market data
def update_position(instrument, current_price):
    if instrument in positions:
        pos = positions[instrument]
        pos.current_price = current_price
        pos.unrealized_pnl = pos.quantity * (current_price - pos.entry_price)
        pos.last_update = time.time()
        
        # Update risk metrics based on position changes
        update_risk_metrics()

def update_risk_metrics():
    # In a real system, these calculations would be much more sophisticated
    total_unrealized = sum(p.unrealized_pnl for p in positions.values())
    total_realized = sum(p.realized_pnl for p in positions.values())
    
    risk_metrics.daily_pnl = total_unrealized + total_realized
    risk_metrics.used_margin = sum(abs(p.quantity * p.current_price) * 0.1 for p in positions.values())
    risk_metrics.available_margin = risk_metrics.total_equity - risk_metrics.used_margin
    risk_metrics.margin_ratio = risk_metrics.used_margin / risk_metrics.total_equity if risk_metrics.total_equity else 0
    
    # Calculate position concentration
    total_position_value = sum(abs(p.quantity * p.current_price) for p in positions.values())
    max_position = max([abs(p.quantity * p.current_price) for p in positions.values()], default=0)
    risk_metrics.position_concentration = max_position / total_position_value if total_position_value else 0
    risk_metrics.max_position_size = max_position

@app.get("/")
async def root():
    return {"message": "Crypto Trading Panel API is running"}

@app.get("/market/depth/{instrument}")
async def get_market_depth(instrument: str):
    depth, _ = read_market_data(instrument)
    if depth:
        return depth
    return {"error": "Failed to read market depth data"}

@app.get("/market/trades/{instrument}")
async def get_trades(instrument: str):
    _, trades = read_market_data(instrument)
    if trades:
        return trades
    return {"error": "Failed to read trades data"}

@app.get("/positions")
async def get_positions():
    return list(positions.values())

@app.get("/position/{instrument}")
async def get_position(instrument: str):
    if instrument in positions:
        return positions[instrument]
    return {"error": "Position not found"}

@app.get("/risk")
async def get_risk_metrics():
    return risk_metrics

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Read market data for the default instrument
            depth, trades = read_market_data()
            
            if depth and depth.bids and depth.asks:
                # Update position with latest price
                mid_price = (depth.bids[0]["price"] + depth.asks[0]["price"]) / 2
                update_position(INSTRUMENT, mid_price)
                
                # Create a payload with all relevant data
                payload = {
                    "type": "market_update",
                    "timestamp": int(time.time() * 1000),
                    "depth": depth.dict(),
                    "trades": [t.dict() for t in trades] if trades else [],
                    "positions": [p.dict() for p in positions.values()],
                    "risk_metrics": risk_metrics.dict()
                }
                
                await websocket.send_text(json.dumps(payload))
            
            await asyncio.sleep(1)  # Send updates every second
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 