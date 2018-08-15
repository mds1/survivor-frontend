import web3 from '@ethereum/web3';
import survivor from '@ethereum/survivorInstance.js';
import * as functions from '@common/functions.js';

export default {

  // ======================================================================
  //                          MetaMask Checks
  // ======================================================================

  set_isMetaMaskInstalled(context) {
    // Ensure MetaMask/web3 is installed
    let isMetaMaskInstalled = false;
    // check for injected web3
    if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
      isMetaMaskInstalled = true;
    }
    // commit state mutation
    context.commit('SET_IS_METAMASK_INSTALLED', isMetaMaskInstalled);
  },

  async set_isMetaMaskUnlocked(context) {
    // Ensure MetaMask/web3 is unlocked/available
    let isMetaMaskUnlocked = false;
    // check list of accounts
    const accounts = await web3.eth.getAccounts();
    if (accounts[0] !== undefined) {
      isMetaMaskUnlocked = true;
    }
    // commit state mutation
    context.commit('SET_IS_METAMASK_UNLOCKED', isMetaMaskUnlocked);
  },

  async set_isMetaMaskOnCorrectNetwork(context) {
    // Ensure MetaMask is on the network required by the dapp
    let isMetaMaskOnCorrectNetwork = false;
    // get required and current networks
    const requiredNetwork = functions.requiredNetwork();
    const currentNetwork = await functions.currentNetwork();
    if (requiredNetwork.toUpperCase() === currentNetwork.toUpperCase()) {
      isMetaMaskOnCorrectNetwork = true;
    }
    // commit state mutation
    context.commit('SET_IS_METAMASK_ON_CORRECT_NETWORK', isMetaMaskOnCorrectNetwork);
  },

  // ======================================================================
  //                             Network Checks
  // ======================================================================

  set_requiredNetwork(context) {
    const requiredNetwork = functions.requiredNetwork();
    context.commit('SET_REQUIRED_NETWORK', requiredNetwork);
  },

  async set_currentNetwork(context) {
    const currentNetwork = await functions.currentNetwork();
    context.commit('SET_CURRENT_NETWORK', currentNetwork);
  },

  // ======================================================================
  //                      Getting Contract Properties
  // ======================================================================

  async setOwner(context) {
    // get owner
    const owner = await survivor.methods.owner().call();
    // commit state mutation
    context.commit('SET_OWNER', owner);
  },

  async setPlayers(context) {
    // get list of platers
    const players = await survivor.methods.getEnteredPlayers().call();

    // define array to hold the promises used to get the picks
    const pickPromises = [];

    // For each player, get their pick (there is probably a better way to do this)
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const pickPromise = survivor.methods.getPlayersPick(player).call();
      pickPromises.push(pickPromise);
    }
    // Resolve promises
    let picks = await Promise.all(pickPromises);
    // Convert to integers
    picks = picks.map(x => parseInt(x, 10));

    // commit state mutation
    const data = { players, picks };
    context.commit('SET_PLAYERS', data);
  },

  async setBalance(context) {
    // get list of platers
    const balance = await web3.eth.getBalance(survivor.options.address);
    // commit state mutation
    context.commit('SET_BALANCE', web3.utils.fromWei(balance, 'ether'));
  },

  async setEntryFee(context) {
    // get list of platers
    const entryFee = await survivor.methods.ENTRY_FEE().call();
    // commit state mutation
    context.commit('SET_ENTRY_FEE', web3.utils.fromWei(entryFee, 'ether'));
  },

  async setUserHasJoined(context) {
    // get list of platers
    const allplayers = await survivor.methods.getEnteredPlayers().call();
    // ensure all addresses are lowercase
    const players = allplayers.map(x => x.toLowerCase());
    // get player who is on the site and check if they have joined
    const accounts = await web3.eth.getAccounts();
    const userHasJoined = players.includes(accounts[0].toLowerCase());

    // commit state mutation
    context.commit('SET_USER_HAS_JOINED', userHasJoined);
  },
};
