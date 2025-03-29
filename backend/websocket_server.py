#!/usr/bin/env python3
import asyncio
import json
import os
import mmap
import ctypes
from ctypes import Structure, c_double, c_uint64, c_char, c_bool
import websockets

# Define data structures matching C++ shared memory layout
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

# Shared memory config
SHM_MOUNT_POINT = "/dev/shm"
SHM_DIRECTORY = "okx_market_data"
INSTRUMENT = "BTC-USDT"  # Default instrument

def get_shm_name(instrument):
    name = instrument.replace('-', '_')
    return f"OKX_{name}"

def get_shm_path(shm_name):
    return f"{SHM_MOUNT_POINT}/{SHM_DIRECTORY}/{shm_name}"

async def read_market_data(instrument=INSTRUMENT):
    """Read market data from shared memory for specified instrument"""
    try:
        shm_name = get_shm_name(instrument)
        shm_path = get_shm_path(shm_name)
        
        if not os.path.exists(shm_path):
            return {"error": f"Shared memory not found for {instrument}"}
        
        with open(shm_path, "rb") as f:
            mm = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
            
            # Read depth data
            mm.seek(0)
            depth_size = ctypes.sizeof(DepthData)
            depth_bytes = mm.read(depth_size)
            depth = DepthData.from_buffer_copy(depth_bytes)
            
            # Process depth data
            depth_data = {
                "timestamp": depth.exchange_ts,
                "bids": [{"price": level.price, "quantity": level.quantity} 
                         for level in depth.bids if level.price > 0],
                "asks": [{"price": level.price, "quantity": level.quantity} 
                         for level in depth.asks if level.price > 0]
            }
            
            # Read recent trades
            trade_size = ctypes.sizeof(PublicTrade)
            trades = []
            
            # Read last 10 trades
            for i in range(10):
                try:
                    mm.seek(depth_size + i * trade_size)
                    trade_bytes = mm.read(trade_size)
                    trade = PublicTrade.from_buffer_copy(trade_bytes)
                    
                    # Skip empty/invalid trades
                    if trade.price <= 0 or trade.quantity <= 0:
                        continue
                        
                    trade_id = bytes(trade.trade_id).split(b'\0', 1)[0].decode('utf-8', errors='ignore')
                    
                    trades.append({
                        "price": trade.price,
                        "quantity": trade.quantity,
                        "timestamp": trade.exchange_ts,
                        "is_buyer_maker": bool(trade.is_buyer_maker)
                    })
                except:
                    break
            
            mm.close()
            
            return {
                "depth": depth_data,
                "trades": trades
            }
            
    except Exception as e:
        return {"error": str(e)}

async def market_data_handler(websocket):
    """Handle WebSocket connection and send market data updates"""
    instrument = INSTRUMENT
    try:
        async for message in websocket:
            # Allow client to specify instrument
            try:
                data = json.loads(message)
                if "instrument" in data:
                    instrument = data["instrument"]
            except:
                pass
                
            # Read and send market data
            market_data = await read_market_data(instrument)
            await websocket.send(json.dumps(market_data))
            
    except websockets.exceptions.ConnectionClosed:
        pass

async def websocket_server():
    """Start WebSocket server"""
    host = "0.0.0.0"
    port = 8765
    
    print(f"Starting WebSocket server on {host}:{port}")
    async with websockets.serve(market_data_handler, host, port):
        await asyncio.Future()  # Run forever

async def data_broadcast():
    """Broadcast market data updates to all connected clients"""
    connected = set()
    
    async def register(websocket):
        connected.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            connected.remove(websocket)
    
    async with websockets.serve(register, "0.0.0.0", 8765):
        while True:
            market_data = await read_market_data()
            websockets.broadcast(connected, json.dumps(market_data))
            await asyncio.sleep(0.1)  # Update 10 times per second

if __name__ == "__main__":
    # Use the broadcast mode for real-time updates
    asyncio.run(data_broadcast()) 