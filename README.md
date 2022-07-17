# chainquery

Utilities to get data from from a blockchain using [UniswapV2Query](contracts/UniswapV2Query.sol) contract.

## Configuration

Choose a consistent network name across the two configuration files.

### .env

```text
PROVIDER_URL_MUMBAI="https://polygon-mumbai.g.alchemy.com/v2/..."
ACCOUNT_KEY="5fa...9f39"
UV2QUERY_ADDRESS_MUMBAI="0x460...7e67"
```

### appconfigs.json

```json
{
  "network": "mumbai",
  "dex": "quickswap",
  "pairsChunkSize": 1000,
  "cooldownMs": 1000,
  "tokensChunkSize": 10,
  "quickswapFactoryMumbai": "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
  "outputPath": "./output"
}
```

## Usage

- Deploy the contract: `npx hardhat run .\scripts\deploy.js --network mumbai`.

- Set all needed configuration values.

- Run [querypairs](scripts/querypairs.js) script to get token pairs from the configured DEX.

- Run [querytokens](scripts/querytokens.js) to get tokens data using querypairs output.
