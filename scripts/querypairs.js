const hre = require('hardhat');
const uv2queryAbi = require('../artifacts/contracts/UniswapV2Query.sol/UniswapV2Query.json').abi;
const configs = require('../appconfigs.json');
const fs = require('fs');
const path = require('path');
const utils = require('./utils');

const network = configs.network;
const dex = configs.dex;
const dexDescr = `${dex} (${network})`;
const uv2queryAddress = process.env[`UV2QUERY_ADDRESS_${network.toUpperCase()}`];
const factoryAddress = configs[`${dex}Factory${utils.toTitleCase(network)}`]
const cooldownMs = configs.cooldownMs;

async function main() {
  const account = utils.connectAccount(network, process.env.ACCOUNT_KEY);
  const uv2query = new  hre.ethers.Contract(uv2queryAddress, uv2queryAbi, account);
  const allPairsNum = (await uv2query.getPairsLenght(factoryAddress)).toNumber();
  console.log(`${dexDescr} pairs: ${allPairsNum}`);
  const pairs = [];

  const ranges = utils.getRanges(allPairsNum, configs.pairsChunkSize);
  for (let r = 0; r < ranges.length; r++) {
    const from = ranges[r][0];
    const to = ranges[r][1];
    console.log(`Getting pairs from ${from} to ${to}`);
    const pairsChunk = await uv2query.getPairsByRange(factoryAddress, from, to);
    await utils.sleep(cooldownMs);
    for (let c = 0; c < pairsChunk.length; c++) {
      pairs.push({
        address: pairsChunk[c][0],
        token0: {
          address: pairsChunk[c][1],
          reserve: pairsChunk[c][2].toString()
        },
        token1: {
          address: pairsChunk[c][3],
          reserve: pairsChunk[c][4].toString()
        }       
      })
    }
  }

  const fileName = path.join(configs.outputPath, `${network.toLowerCase()}${utils.toTitleCase(dex)}Pairs.json`)
  console.log(`Saving ${fileName}`);
  fs.writeFileSync(fileName, JSON.stringify(pairs, null, 2), {encoding: 'utf8'});

  console.log('Completed');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
