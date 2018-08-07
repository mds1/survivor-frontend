const Survivor = artifacts.require('./Survivor.sol')

// DEFINE CONTRACT CONSTANTS ---------------------------------------------------
// Here we define contract constants that will facilitate testing

// Required fee to enter
const ENTRY_FEE = 0.1 * 10 ^ 18; // 0.1 Ether, in units of Wei
// Timestamp of entry deadline, currently set to 2018-09-06, 8:00 PM EST
const ENTRY_DEADLINE = 1536278400;
// Timestamp, when all week 1 games are over, set to 2018-09-11, 4:00 AM EST
const FIRST_WEEK_GAME_END = 1536652800;

// DEPLOY CONTRACT -------------------------------------------------------------
module.exports = function (deployer) {
  deployer.deploy(Survivor, ENTRY_FEE, ENTRY_DEADLINE, FIRST_WEEK_GAME_END)
}