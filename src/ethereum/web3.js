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

import Web3 from 'web3';

/* eslint-disable-next-line import/no-mutable-exports */
let web3;

// Import Infura key
// Import keys
let infuraAPIKey;
if (typeof process.env.infuraAPIKey === 'undefined') {
  // Running locally, so read from config file (TODO: set env vars locally)
  /* eslint-disable-next-line global-require */
  /* eslint-disable-next-line */
  infuraAPIKey = require('../../config').infuraAPIKey;
} else {
  // Running on server, read from environment variable
  /* eslint-disable-next-line prefer-destructuring */
  infuraAPIKey = process.env.infuraAPIKey;
}

// *REPLACE* -- make sure network matches the string in requiredNetwork() in functions.js
// TODO: replace this with an import of the requiredNetwork function
// Get network to use
const network = 'rinkeby';

if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
  // Code is running in the browser *AND* MetaMask is running
  // get the current provider from MetaMask's web3 instance
  web3 = new Web3(window.web3.currentProvider);
} else {
  // Code is running on the server *OR* the user is not running MetaMask
  // set up our own provider to connect to network through Infura
  const provider = new Web3.providers.HttpProvider(`https://${network}.infura.io/${infuraAPIKey}`);
  web3 = new Web3(provider);
}

// export the web3 instance
export default web3;
