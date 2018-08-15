export default {
  // Dapp properties
  MetaMask: {
    isInstalled: true,
    isUnlocked: true,
    isOnCorrectNetwork: true,
  },

  // Network information
  network: {
    required: '', // network required by the dapp (set in functions.js)
    current: '', // network user is connected to
  },

  // Contract properties (require asynchronous calls)
  contract: {
    owner: '', // address of who deployed contract
    players: [], // list of entered addresses
    picks: [], // array of arrays, storing the picks for each player
    balance: '', // contract balance
    entryFee: '', // required amount to join
    userHasJoined: false, // bool, has this visitor joined the pool
  },
};
