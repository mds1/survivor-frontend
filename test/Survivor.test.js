// Tests Survivor.sol contract
//   - Most (all?) tests done in JS as opposed to Solidity to make it easier to
//     modify the dates/timestamps as required for testing
//   - See the following link for info on changing EVM time with ganache-cli for
//     testing: https://medium.com/coinmonks/testing-solidity-with-truffle-and-async-await-396e81c54f93

// INITIALIZATION --------------------------------------------------------------
// Use Chai with Chai As Promised
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

// const expect = chai.expect;
// const assert = chai.assert;
const { expect, assert } = chai;

// We'll use ganache-cli + ethereum-bridge for Oraclize testing
const ganache = require('ganache-cli');

// Configure web3 1.0.0 instead of the default version with Truffle
const Web3 = require('web3');

const provider = ganache.provider();
const web3 = new Web3(provider);

// Define the contract we'll be testing
const Survivor = artifacts.require('Survivor');


// DEFINE TESTS ----------------------------------------------------------------
contract('Survivor', (accounts) => {
  // Define variable to hold the instance of the Survivor.sol contract
  let survivor;
  // Define other commonly used state variables
  let ENTRY_FEE;

  // DEFINE COMMON ACTIONS -----------------------------------------------------
  // Here we define functions that would be used to make the required contract
  // calls. This just makes the tests easier to read and reduces duplicate code

  // FUNCTION joinPool
  //   Called by a user to join the Survivor pool
  // INPUTS
  //   value   -- amount of Wei the user would send along to pay the entry fee
  //   account -- ganache account to send the transaction from
  // OUTPUTS
  //   result  -- result of transaction
  async function joinPool(value, account) {
    const result = await survivor.joinPool({
      from: account,
      value,
    });
    return result;
  } // end joinPool


  // BEGIN TESTS ---------------------------------------------------------------
  beforeEach('Setup deployed contract', async () => {
    // Get instance of deployed contract
    survivor = await Survivor.deployed();
    // Get commonly used variables
    ENTRY_FEE = await survivor.ENTRY_FEE();
  });

  // ADMINISTRATIVE TESTS ------------------------------------------------------
  // check that it assigns the deployer as the owner
  it('properly assigns the owner', async () => {
    // console.log(survivor)
    assert.equal(await survivor.OWNER(), accounts[0], 'Variable "OWNER" was not properly set');
  });

  // TESTS FOR JOINING THE POOL ------------------------------------------------
  // check that it allows players to join the pool
  it('allows players to join the pool', async () => {
    // join pool
    const result = await joinPool(ENTRY_FEE, accounts[0]);
    assert.equal(result.receipt.status, true), 'Transaction to join pool has failed';
  });

  // check that it won't allow entries when msg.value < ENTRY_FEE
  it('prevents joining if msg.value < ENTRY_FEE', async () => {
    // this test is looking for a failed entry
    const joinPoolFailure = async function () {
      await joinPool(ENTRY_FEE / 2, accounts[1]);
    };
    return expect(joinPoolFailure()).to.be.rejectedWith(Error);
  });

  // check that it won't allow entries when msg.value > ENTRY_FEE
  it('prevents joining if msg.value < ENTRY_FEE', async () => {
    // this test is looking for a failed entry
    const joinPoolFailure = async function () {
      await joinPool(ENTRY_FEE * 2, accounts[1]);
    };
    return expect(joinPoolFailure()).to.be.rejectedWith(Error);
  });

  // check that player status is correctly updated after joining
  it('updates state variables after a player joins', async () => {

  });

  // TESTS FOR MAKING PICKS ----------------------------------------------------
  // check that players can make picks before the deadline
  it('allows players to make picks before the pick deadline', async () => {

  });

  // check that players cannot make picks after the deadline
  it('prevents players from making picks after the pick deadline', async () => {

  });

  // check that players can change their picks before the deadline
  it('allows players to change their picks before the pick deadline', async () => {

  });

  // check that players cannot change their picks after the deadline
  it('prevents players from changing their picks after the pick deadline', async () => {

  });

  // TESTS FOR RECEIVING RESULTS -----------------------------------------------
  // check that game results are properly received from server
  it('receives results from the server', async () => {

  });

  // TESTS FOR SAFEGUARDS ------------------------------------------------------
  // check that the contract refunds people if results are not provided
  it('sets up refunds for withdrawal if results are not provided', async () => {

  });

  // check that it allows players to withdraw refunds
  it('allows players to withdraw their refunds', async () => {

  });
});
