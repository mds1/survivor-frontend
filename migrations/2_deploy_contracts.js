const Survivor = artifacts.require('./Survivor.sol');

// DEPLOY CONTRACT -------------------------------------------------------------
module.exports = function (deployer) {
  deployer.deploy(Survivor);
};

