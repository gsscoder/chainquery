const hre = require('hardhat');

exports.connectAccount = function connectAccount(network, key) {
  let networkUrl = process.env[`PROVIDER_URL_${network.toUpperCase()}`];
  console.log(`Connecting to ${network} provider`);
  const provider = new hre.ethers.providers.JsonRpcProvider(networkUrl);
  const signer = new hre.ethers.Wallet(key, provider);
  const account = signer.connect(provider);
  return account;
}
