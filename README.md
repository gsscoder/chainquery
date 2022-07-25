# chainquery

Utilities to get data from from a blockchain using [UniswapV2Query](contracts/UniswapV2Query.sol) contract.

## Configuration

Choose a consistent network name across the two configuration files.

### .env

```text
PROVIDER_URL_POLYGON="https://polygon-mainnet.g.alchemy.com/v2/..."
ACCOUNT_KEY="5fa...9f39"
UV2QUERY_ADDRESS_POLYGON="0x460...7e67"
```

### appconfigs.json

```json
{
  "network": "polygon",
  "dex": "quickswap",
  "pairsChunkSize": 500,
  "cooldownMs": 2000,
  "cooldownAfterFailSec": 3,
  "tokensChunkSize": 10,
  "quickswapFactoryPolygon": "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
  "outputPath": "./output"
}
```

## Usage

- Deploy the contract: `npx hardhat run .\scripts\deploy.js --network polygon`.

- Set all needed configuration values.

- Run [querypairs](scripts/querypairs.js) script to get token pairs from the configured DEX.

- Run [querytokens](scripts/querytokens.js) to get tokens data using querypairs output.

After running the `querytokens` script, the `querypairs` output file will be updated with tokens data.
