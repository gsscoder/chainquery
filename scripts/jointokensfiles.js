const fs = require('fs');
const path = require('path');
const glob = require('glob');
const utils = require('./utils');
const configs = require('../appconfigs.json');

const network = configs.network;

glob(`${configs.outputPath}/${network}Tokens_*.json`, function (err, files) {
  if (err) {
    console.log(`ERROR: ${err}`);
    process.exit(1);
  }
  mergeFiles(files);
});

function mergeFiles(files) {
  console.log(`Processing ${files.length} files`);

  const allTokens = [];

  files.forEach(file => {
    const tokens = JSON.parse(fs.readFileSync(file, {encoding: 'utf8'}));
    allTokens.push(...tokens);
  });

  const tokensOut = path.join(configs.outputPath, `${network.toLowerCase()}Tokens.json`)
  console.log(`Saving ${tokensOut}`);
  fs.writeFileSync(tokensOut, JSON.stringify(allTokens, null, 2), {encoding: 'utf8'});

  console.log('Completed');
}
