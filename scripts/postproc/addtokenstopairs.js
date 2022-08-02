const fs = require('fs');
const path = require('path');
const utils = require('../utils');
const hre = require('hardhat');
const configs = require('../../appconfigs.json');

const hasSN = n => {
  const str = n.toString();
  return str.includes('e-') || str.includes('e+');
}

const network = configs.network;
const dex = configs.dex;

console.log('Adding token data to pairs file');

const pairsOut = path.join(configs.outputPath, `${network.toLowerCase()}${utils.toTitleCase(dex)}Pairs.json`) 
const pairs = JSON.parse(fs.readFileSync(pairsOut, {encoding: 'utf8'}));

const tokensOut = path.join(configs.outputPath, `${network.toLowerCase()}Tokens.json`)
const tokens = JSON.parse(fs.readFileSync(tokensOut, {encoding: 'utf8'}));

const pairsResult = [];
for (let i = 0; i < pairs.length; i++) {
  const token0 = tokens.find(t => t.address === pairs[i].token0.address);
  const token1 = tokens.find(t => t.address === pairs[i].token1.address);
  if (!token0 || !token1) {
    console.log(`WARNING: pair ${pairs[i].address} is invalid`);
    continue;
  }
  let reserve0 = 0;
  if (pairs[i].token0.reserve !== undefined && pairs[i].token0.reserve !== "0") {
    reserve0 = Number((hre.ethers.BigNumber.from(pairs[i].token0.reserve) / Math.pow(10, token0.decimals)).toFixed(token0.decimals));
    if (hasSN(reserve0)) {
      console.log(`WARNING: token ${pairs[i].token0.address} has not meaningful reserve`);
      continue;
    }
  }
  let reserve1 = 0;
  if (pairs[i].token1.reserve !== undefined && pairs[i].token1.reserve !== "0") {
    reserve1 = Number(hre.ethers.BigNumber.from(pairs[i].token1.reserve) / Math.pow(10, token1.decimals).toFixed(token1.decimals));  
    if (hasSN(reserve1)) {
      console.log(`WARNING: token ${pairs[i].token0.address} has not meaningful reserve`);
      continue;
    }
  }
  pairsResult.push({
    address: pairs[i].address,
    token0: {
      address: token0?.address,
      symbol: token0?.symbol,
      name: token0?.name,
      decimals: token0?.decimals,
      reserve: reserve0
    },
    token1: {
      address: token1?.address,
      symbol: token1?.symbol,
      name: token1?.name,
      decimals: token1?.decimals,
      reserve: reserve1
    }
  });
}

console.log(`Updating ${pairsOut}`);
fs.writeFileSync(pairsOut, JSON.stringify(pairsResult, null, 2), {encoding: 'utf8'});  

console.log('Completed');
