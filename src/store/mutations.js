export default {

  // ======================================================================
  //                          MetaMask Checks
  // ======================================================================

  SET_IS_METAMASK_INSTALLED(state, isMetaMaskInstalled) {
    state.MetaMask.isInstalled = isMetaMaskInstalled;
  },

  SET_IS_METAMASK_UNLOCKED(state, isMetaMaskUnlocked) {
    state.MetaMask.isUnlocked = isMetaMaskUnlocked;
  },

  SET_IS_METAMASK_ON_CORRECT_NETWORK(state, isMetaMaskOnCorrectNetwork) {
    state.MetaMask.isOnCorrectNetwork = isMetaMaskOnCorrectNetwork;
  },

  // ======================================================================
  //                             Network Checks
  // ======================================================================

  SET_REQUIRED_NETWORK(state, network) {
    state.network.required = network;
  },

  SET_CURRENT_NETWORK(state, network) {
    state.network.current = network;
  },

  SET_CURRENT_ADDRESS(state, obj) {
    state.network.currentAddress = obj.account;
    state.network.picks = obj.picks;
  },

  // ======================================================================
  //                      Getting Contract Properties
  // ======================================================================

  SET_OWNER(state, address) {
    state.contract.owner = address;
  },

  SET_PLAYERS(state, obj) {
    state.contract.players = obj.players;
    state.contract.picks = obj.picks;
  },

  SET_BALANCE(state, balance) {
    state.contract.balance = balance;
  },

  SET_ENTRY_FEE(state, entryFee) {
    state.contract.entryFee = entryFee;
  },

  SET_USER_HAS_JOINED(state, userHasJoined) {
    state.contract.userHasJoined = userHasJoined;
  },

  SET_SOURCE_CODE(state, code) {
    state.contract.code = code;
  },
};
