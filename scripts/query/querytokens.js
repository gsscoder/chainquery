const fs = require('fs');
const path = require('path');
const utils = require('../utils');
const hre = require('hardhat');
const uv2queryAbi = require('../../artifacts/contracts/UniswapV2Query.sol/UniswapV2Query.json').abi;
const configs = require('../../appconfigs.json');

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

  let startIndex, endIndex;
  let startChunk_, endChunk_;
  const chunks = Math.ceil(tokens.length / configs.tokensChunkSize);
  if (chunks <= 1) {
    console.log('Getting all tokens in one request');
    allTokens.push(await uv2query.getERC20Tokens(tokens));
  }
  else {
    console.log(`Total chunks: ${chunks}`);
    const { startChunk, endChunk } = parseArgs();
    startChunk_ = startChunk;
    endChunk_ = endChunk;
    startIndex = (startChunk * configs.tokensChunkSize) - configs.tokensChunkSize;
    endIndex = (endChunk * configs.tokensChunkSize) - 1;
    let chunkIndex = startChunk;
    for (let i = startIndex; i < tokens.length; i += configs.tokensChunkSize) {
      let toIndex = i + configs.tokensChunkSize - 1;
      if (toIndex > tokens.length - 1) {
        toIndex = tokens.length - 1;
      }
      console.log(`[${chunkIndex}] Chunk from ${i} to ${toIndex}`);
      const slice = tokens.slice(i, toIndex + 1);
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
      if (toIndex == endIndex) {
        break;
      }
      chunkIndex++;
    }

    function parseArgs() {
      const args = process.argv.slice(2);
      if (args.length != 2) {
        console.log('Usage: node querytokens START_CHUNK END_CHUNK');
        process.exit();
      }
      const start = parseInt(args[0]);
      if (start < 1 || start > chunks) {
        console.log(`START_CHUNK must be between 1 and ${chunks}`);
        process.exit();
      }
      const end = parseInt(args[1]);
      if (end < 1 || end > chunks || end < start) {
        console.log(`START_CHUNK must be between 1 and ${chunks} and lesser than ${start}`);
        process.exit();
      }    
      return { startChunk: start, endChunk: end }; 
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

  const start = utils.zeroPad(startChunk_, 4);
  const end = utils.zeroPad(endChunk_, 4);
  const tokensOut = path.join(configs.outputPath, `${network.toLowerCase()}Tokens_${start}-${end}.json`)
  console.log(`Saving ${tokensOut}`);
  fs.writeFileSync(tokensOut, JSON.stringify(tokensResult, null, 2), {encoding: 'utf8'});

  console.log('Completed');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
