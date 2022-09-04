const fs = require('fs');
const path = require('path');
const configs = require('../../appconfigs.json');
const utils = require('../utils');

const network = configs.network;
const dex = configs.dex;

const invalidSymb = value => value.toLowerCase() == 'test' || value.toLowerCase().includes('test');

const pairsOut = path.join(configs.outputPath, `${network.toLowerCase()}${utils.toTitleCase(dex)}Pairs.json`)

let pairs = JSON.parse(fs.readFileSync(pairsOut, {encoding: 'utf8'}));
console.log(`Processing ${pairs.length} pairs`);
pairs = pairs.filter(p => p.token0.reserve != 0 || p.token1.reserve != 0);
pairs = pairs.filter(p => !invalidSymb(p.token0.symbol) && !invalidSymb(p.token1.symbol));
console.log(`Final pairs count: ${pairs.length}`);

console.log(`Updating ${pairsOut}`);
fs.writeFileSync(pairsOut, JSON.stringify(pairs, null, 2), {encoding: 'utf8'});  

console.log('Completed');
