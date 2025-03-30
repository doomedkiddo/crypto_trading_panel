#!/usr/bin/env python3
import asyncio
import json
import os
import mmap
import ctypes
from ctypes import Structure, c_double, c_uint64, c_char, c_bool
import websockets
import random
from datetime import datetime, timedelta

# Mock data generator
class MockDataGenerator:
    def __init__(self):
        self.base_price = 45000.0
        self.base_pnl = 10000.0
        self.positions = [
            {
                "instrument": "BTC-USDT",
                "quantity": 1.5,
                "entryPrice": 44000.0,
                "markPrice": 45000.0,
                "unrealizedPnl": 1500.0,
                "notional": 67500.0,
                "marginRatio": 0.1,
                "liquidationPrice": 40000.0
            },
            {
                "instrument": "ETH-USDT",
                "quantity": -10,
                "entryPrice": 2200.0,
                "markPrice": 2150.0,
                "unrealizedPnl": 500.0,
                "notional": 21500.0,
                "marginRatio": 0.15,
                "liquidationPrice": 2500.0
            }
        ]
        self.trades = []
        self.pnl_history = []
        self.last_update = datetime.now()
        self.volatility = 0.001  # 0.1% volatility

    def generate_mock_depth(self):
        center_price = self.base_price
        bids = []
        asks = []

        # Generate 10 levels of bids and asks
        for i in range(10):
            bid_price = center_price * (1 - 0.001 * (i + 1))
            ask_price = center_price * (1 + 0.001 * (i + 1))
            quantity = random.uniform(0.1, 2.0)

            bids.append({"price": bid_price, "quantity": quantity})
            asks.append({"price": ask_price, "quantity": quantity})

        return {
            "timestamp": int(datetime.now().timestamp() * 1000),
            "bids": bids,
            "asks": asks
        }

    def generate_mock_trade(self):
        side = random.choice(['buy', 'sell'])
        price = self.base_price * (1 + random.gauss(0, self.volatility))
        quantity = random.uniform(0.1, 1.0)

        return {
            "price": price,
            "quantity": quantity,
            "timestamp": int(datetime.now().timestamp() * 1000),
            "is_buyer_maker": side == 'sell'
        }

    def update_mock_data(self):
        # Update base price with random walk
        self.base_price *= (1 + random.gauss(0, self.volatility))

        # Update positions
        for position in self.positions:
            position["markPrice"] *= (1 + random.gauss(0, self.volatility))
            price_diff = position["markPrice"] - position["entryPrice"]
            position["unrealizedPnl"] = price_diff * position["quantity"]
            position["notional"] = abs(position["quantity"] * position["markPrice"])

        # Generate new trade
        if random.random() < 0.3:  # 30% chance to generate a new trade
            new_trade = self.generate_mock_trade()
            self.trades.insert(0, new_trade)
            self.trades = self.trades[:100]  # Keep only last 100 trades

        # Update PnL
        self.base_pnl += random.gauss(0, 100)  # Random PnL changes
        current_time = datetime.now()

        # Add new PnL data point every second
        if (current_time - self.last_update).total_seconds() >= 1:
            self.pnl_history.append({
                "timestamp": current_time.isoformat(),
                "value": self.base_pnl
            })
            self.last_update = current_time

        # Keep last 100 PnL data points
        self.pnl_history = self.pnl_history[-100:]

        return {
            "depth": self.generate_mock_depth(),
            "trades": self.trades,
            "positions": self.positions,
            "pnlData": self.pnl_history,
            "lastUpdate": datetime.now().isoformat()
        }

# Create mock data generator instance
mock_generator = MockDataGenerator()

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
            market_data = mock_generator.update_mock_data()
            websockets.broadcast(connected, json.dumps(market_data))
            await asyncio.sleep(0.1)  # Update 10 times per second

if __name__ == "__main__":
    print("Starting WebSocket server on 0.0.0.0:8765")
    try:
        asyncio.run(data_broadcast())
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Server error: {e}")