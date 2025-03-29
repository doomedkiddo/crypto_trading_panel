#!/usr/bin/env python3
import os
import mmap
import ctypes
from ctypes import Structure, c_double, c_uint64, c_char, c_bool

# 定义与C++相同的数据结构
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

# 共享内存路径
SHM_MOUNT_POINT = "/dev/shm"
SHM_DIRECTORY = "okx_market_data"
INSTRUMENT = "BTC-USDT"  # 要测试的交易对，根据需要修改

def get_shm_name(instrument):
    name = instrument.replace('-', '_')
    return f"OKX_{name}"

def get_shm_path(shm_name):
    return f"{SHM_MOUNT_POINT}/{SHM_DIRECTORY}/{shm_name}"

def read_shared_memory():
    try:
        shm_name = get_shm_name(INSTRUMENT)
        shm_path = get_shm_path(shm_name)
        print(f"读取共享内存: {shm_path}")
        
        if not os.path.exists(shm_path):
            print(f"错误: 共享内存文件不存在")
            return
        
        with open(shm_path, "rb") as f:
            mm = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
            
            # 读取深度数据
            mm.seek(0)
            depth_size = ctypes.sizeof(DepthData)
            depth_bytes = mm.read(depth_size)
            depth = DepthData.from_buffer_copy(depth_bytes)
            
            print("\n深度数据:")
            print(f"时间戳: {depth.exchange_ts}")
            
            print("\n买单:")
            for i, bid in enumerate(depth.bids):
                print(f"  [{i}] 价格: {bid.price}, 数量: {bid.quantity}")
            
            print("\n卖单:")
            for i, ask in enumerate(depth.asks):
                print(f"  [{i}] 价格: {ask.price}, 数量: {ask.quantity}")
            
            # 读取交易数据
            trade_size = ctypes.sizeof(PublicTrade)
            offset = depth_size
            
            print("\n交易数据:")
            for i in range(5):  # 读取前5个交易
                try:
                    mm.seek(offset + i * trade_size)
                    trade_bytes = mm.read(trade_size)
                    trade = PublicTrade.from_buffer_copy(trade_bytes)
                    
                    trade_id = bytes(trade.trade_id).split(b'\0', 1)[0].decode('utf-8', errors='ignore')
                    
                    print(f"\n交易 #{i+1}:")
                    print(f"  价格: {trade.price}")
                    print(f"  数量: {trade.quantity}")
                    print(f"  时间戳: {trade.exchange_ts}")
                    print(f"  交易ID: {trade_id}")
                except:
                    break
            
            mm.close()
            
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    while True:
        read_shared_memory() 