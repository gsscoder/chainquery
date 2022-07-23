const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const hre = require('hardhat');
const uv2queryAbi = require('../artifacts/contracts/UniswapV2Query.sol/UniswapV2Query.json').abi;
const configs = require('../appconfigs.json');

const network = configs.network;
const dex = configs.dex;
const uv2queryAddress = process.env[`UV2QUERY_ADDRESS_${network.toUpperCase()}`];

async function main() {

  const pairsOut = path.join(configs.outputPath, `${network.toLowerCase()}${utils.toTitleCase(dex)}Pairs.json`) 
  const pairs = JSON.parse(fs.readFileSync(pairsOut, {encoding: 'utf8'}));
  const tokensSet = new Set();
  pairs.forEach(p => {
    tokensSet.add(p.token0.address);
    tokensSet.add(p.token1.address);
  });
  const tokens = [...tokensSet];

  console.log(`Processing ${tokens.length} tokens`);

  const account = utils.connectAccount(network, process.env.ACCOUNT_KEY);
  const uv2query = new  hre.ethers.Contract(uv2queryAddress, uv2queryAbi, account);

  let allTokens = [];

  const chunks = Math.ceil(tokens.length / configs.tokensChunkSize);
  if (chunks <= 1) {
    allTokens.push(await uv2query.getERC20Tokens(tokens));
  }
  else {
    for (let i = 0; i < tokens.length; i += configs.tokensChunkSize) {
      let toIndex = i + configs.tokensChunkSize - 1;
      if (toIndex > tokens.length - 1) {
        toIndex = tokens.length - 1;
      }
      console.log(`Chunk from ${i} to ${toIndex}`);
      const slice = tokens.slice(i, toIndex);
      let tokensChunk = [];
      try {
        tokensChunk = await uv2query.getERC20Tokens(slice);
      } catch {
        console.log('ERROR: chunk retrieval failed. Attempting single fetch');
        for (let t = 0; t < slice.length; t++) {
          let token;
          try {
            token = await uv2query.getERC20Token(slice[t]);
          } catch {
            console.log(`WARNING: token ${slice[t]} is invalid`);
            continue;
          }
          tokensChunk.push(token);
        }
      }
      await utils.sleep(configs.cooldownMs);
      allTokens = allTokens.concat(tokensChunk);
    }
  }

  let tokensResult = allTokens.map(t => {
    return {
      address: t[0],
      symbol: t[1],
      name: t[2],
      decimals: t[3]
    }
  });
  tokensResult = tokensResult.filter(t => t.symbol && t.decimals);

  const tokensOut = path.join(configs.outputPath, `${network.toLowerCase()}Tokens.json`)
  console.log(`Saving ${tokensOut}`);
  fs.writeFileSync(tokensOut, JSON.stringify(tokensResult, null, 2), {encoding: 'utf8'});

  console.log('Adding token data to pairs file');

  const pairsResult = [];
  for (let i = 0; i < pairs.length; i++) {
    const token0 = tokensResult.find(t => t.address === pairs[i].token0.address);
    const token1 = tokensResult.find(t => t.address === pairs[i].token1.address);
    if (!token0 || !token1) {
      console.log(`WARNING: pair ${pairs[i].address} is invalid`);
      continue;
    }
    pairsResult.push({
      address: pairs[i].address,
      token0: {
        address: token0?.address,
        symbol: token0?.symbol,
        name: token0?.name,
        decimals: token0?.decimals
      },
      token1: {
        address: token1?.address,
        symbol: token1?.symbol,
        name: token1?.name,
        decimals: token1?.decimals
      }
    });
  }

  console.log(`Updating ${pairsOut}`);
  fs.writeFileSync(pairsOut, JSON.stringify(pairsResult, null, 2), {encoding: 'utf8'});  

  console.log('Completed');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
