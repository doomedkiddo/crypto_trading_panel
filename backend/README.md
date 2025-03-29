# Backend Configuration

## API Credentials

This application can fetch real position data from exchanges if you provide API credentials.

### Setting Up API Credentials

There are two ways to configure your API credentials:

1. **Using the config.json file (Recommended)**:
   - Run `./run.sh` and you will be prompted to enter your API credentials
   - Alternatively, manually edit the `config.json` file:
     ```json
     {
         "api_key": "YOUR_API_KEY",
         "api_secret": "YOUR_API_SECRET",
         "passphrase": "YOUR_PASSPHRASE", 
         "exchange": "okx"
     }
     ```

2. **Using environment variables**:
   - Set the following environment variables:
     ```bash
     export EXCHANGE_API_KEY="YOUR_API_KEY"
     export EXCHANGE_API_SECRET="YOUR_API_SECRET"
     export EXCHANGE_PASSPHRASE="YOUR_PASSPHRASE"
     ```

**Note**: The passphrase is only required for some exchanges, like OKX.

## Security Considerations

- API credentials are stored in plain text in the config.json file
- Make sure to set appropriate read permissions on the config.json file
- Prefer to use API keys with read-only access if you only need to view positions
- Never share your API credentials or commit them to version control

## Running the Application

1. Make sure your shared memory files are correctly formatted at `/dev/shm/okx_market_data/OKX_*`
2. Install the required dependencies: `pip install -r requirements.txt`
3. Start the application: `./run.sh` 