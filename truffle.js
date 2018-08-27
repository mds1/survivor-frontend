// *REPLACE* -- Ok, not really a replace. Create file called config.js like the sample below
// This file should contain the Infura API key, mnemonic phrase, and any other API keys needed
// Note: mnemonic phrase for existing MetaMask account is in Settings -> Reveal Seed Words

/* BEGIN Sample config.js file:
----------------------------------------------------------------------------------------------
const keys = {
  infuraAPIKey: 'PasteYourKeyHere',
  mnemonic: 'Paste your seed phrase here',
}

module.exports = keys
----------------------------------------------------------------------------------------------
END Sample config.js file: */

/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

// Import keys and mnemonic
const keys = require('./config');

const { infuraAPIKey, mnemonic } = keys;

const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: '127.0.0.1', // localhost
      port: 8545,
      network_id: '*', // match any network id
      gas: 7000000,
    },
    rinkeby: {
      host: '127.0.0.1', // localhost
      port: 8545,
      network_id: 4,
      provider() {
        /* eslint-disable-next-line no-new */
        return new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/${infuraAPIKey}`);
      },
    },
  },
};
