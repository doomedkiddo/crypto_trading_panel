# Crypto Trading Panel

A professional-grade cryptocurrency trading monitoring system featuring real-time market data visualization and position risk management.

## Features

- Real-time order book visualization
- Price chart with volume indicators
- Recent trades display
- Position monitoring with risk metrics
- Comprehensive risk management dashboard
- WebSocket-based real-time updates

## System Architecture

The system consists of two main components:

1. **Backend (Python/FastAPI)**
   - Reads market data from shared memory (`/dev/shm`)
   - Provides REST API for data access
   - Streams real-time updates via WebSockets
   - Calculates and serves position and risk metrics

2. **Frontend (React)**
   - Professional dark theme UI with Material UI components
   - Interactive charts with lightweight-charts
   - Real-time data visualization
   - Responsive layout

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- Access to the shared memory data source

## Installation

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
# or
yarn install
```

## Running the Application

### Start the Backend

```bash
cd backend
./run.sh
```

This will start the FastAPI server at http://localhost:8000 with automatic reload enabled.

### Start the Frontend

```bash
cd frontend
npm start
# or
yarn start
```

This will start the React development server at http://localhost:3000.

## Configuration

The system is pre-configured to monitor BTC-USDT by default. To monitor additional trading pairs, you'll need to:

1. Make sure the shared memory files are available for those pairs
2. Add them to the position tracking in the backend

## Shared Memory Structure

The system reads market data from shared memory files located at `/dev/shm/okx_market_data/OKX_*`. Each file contains:

- Market depth data (10 levels of bids and asks)
- Recent trades data

## Security Considerations

- This application is designed for local use only
- No authentication is implemented in the current version
- Implement proper access controls if deploying to a network

## License

This project is proprietary and confidential.