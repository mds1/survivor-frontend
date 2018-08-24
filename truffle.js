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
      // gas: 6891861,
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
