// Tests Survivor.sol contract
//   - Most (all?) tests done in JS as opposed to Solidity to make it easier to
//     modify the dates/timestamps as required for testing
//   - See the following link for info on changing EVM time with ganache-cli for
//     testing: https://medium.com/coinmonks/testing-solidity-with-truffle-and-async-await-396e81c54f93

// INITIALIZATION --------------------------------------------------------------

/* eslint-disable no-undef */
/* eslint-disable func-names */

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

  /**
   * Called by a user to join the Survivor pool
   * @param value amount of Wei the user would send along to pay the entry fee
   * @param account ganache account to send the transaction from
   * @returns result of transcation
   */
  async function joinPool(value, account) {
    const result = await survivor.joinPool({
      from: account,
      value,
    });
    return result;
  } // end joinPool


  /**
   * Called by a user to make a pick
   * @param integer 1-32 alphabetically corresponding to team names
   * @param account ganache-cli account to send the transaction from
   * @returns result of transaction
   */
  async function makePick(integer, account) {
    const result = await survivor.makePick(integer, {
      from: account,
    });
    return result;
  } // end makePick


  /**
   * Increase EVM time in ganache to simulate calls in the future
   * @param integer Number of seconds to increase time by
   */
  async function increaseTime(integer) {
    // First we increase the time
    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [integer],
      id: 0,
    }, () => {});

    // Then we mine a block to actually get the time change to occur (see this
    // issue: https://github.com/trufflesuite/ganache-cli/issues/394)
    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      params: [],
      id: 0,
    }, () => { });

    /* Note: witout the blank callbacks you get:
         Error: No callback provided to provider's send function. As of web3
         1.0, provider.send is no longer synchronous and must be passed a
        callback as its final argument. */
  } // end increaseTime


  // BEGIN TESTS ---------------------------------------------------------------
  beforeEach('Setup deployed contract', async () => {
    // Get instance of deployed contract
    survivor = await Survivor.deployed();
    // Get commonly used variables
    ENTRY_FEE = await survivor.ENTRY_FEE();
  });

  // ADMINISTRATIVE TESTS ------------------------------------------------------
  // check that it assigns the deployer as the owner -- this is needed to ensure
  // the contract can be paused if needed
  it('properly assigns the owner', async () => {
    // console.log(survivor)
    assert.equal(await survivor.owner(), accounts[0], 'Variable "owner" was not properly set');
  });

  // TESTS FOR JOINING THE POOL ------------------------------------------------
  // check that it allows players to join the pool -- this is nedded to ensure
  // players can actually participate in the pool
  it('allows players to join the pool', async () => {
    // join pool
    const result = await joinPool(ENTRY_FEE, accounts[0]);
    expect(result.receipt.status).to.equal('0x1');
  });

  // check that it won't allow entries when msg.value < ENTRY_FEE -- we must
  // ensure you cannot join if you pay less than the required entry fee
  it('prevents joining if msg.value < ENTRY_FEE', async () => {
    // this test is looking for a failed entry
    const joinPoolFailure = async function () {
      await joinPool(ENTRY_FEE / 2, accounts[1]);
    };
    return expect(joinPoolFailure()).to.be.rejectedWith(Error);
  });

  // check that it won't allow entries when msg.value > ENTRY_FEE -- similar to
  // above, players should not pay more than the entry fee either
  it('prevents joining if msg.value < ENTRY_FEE', async () => {
    // this test is looking for a failed entry
    const joinPoolFailure = async function () {
      await joinPool(ENTRY_FEE * 2, accounts[1]);
    };
    return expect(joinPoolFailure()).to.be.rejectedWith(Error);
  });

  // check that player status is correctly updated after joining -- this
  // ensures the contract state is properly updated after each pick
  it('properly updates state variables after a player joins', async () => {
    // Enter 2 more people (accounts[0] already joined in previous test)
    await joinPool(ENTRY_FEE, accounts[1]);
    await joinPool(ENTRY_FEE, accounts[2]);
    const nplayers = String(3);

    // Confirm results (convert from BigNumber to String)
    const numPlayersEntered = String(await survivor.getNumberOfPlayers());

    // using contract function to get contract balance because for some reason
    // web3.eth.getBalance always returns 0
    const balance = String(await survivor.getContractBalance());
    const players = await survivor.getEnteredPlayers();

    expect(numPlayersEntered).to.be.equal(nplayers);
    expect(balance).to.be.equal(String(nplayers * ENTRY_FEE));
    expect(String(players.length)).to.be.equal(nplayers);
  });

  // TESTS FOR MAKING PICKS ----------------------------------------------------
  // check that players can make picks before the deadline -- this is needed to
  // ensure players can make picks each week
  it('allows players to make picks before the pick deadline', async () => {
    const result = await makePick(32, accounts[0]);
    expect(result.receipt.status).to.equal('0x1');
  });

  // check that players cannot make picks if they have not joined -- this
  // prevents peolpe from participating if they have not paid the entry fee
  it('prevents players from making picks if they have not joined', async () => {
    // this test is looking for a failed entry
    const makePickFailure = async function () {
      await makePick(3, accounts[5]); // use account that has not entered
    };
    return expect(makePickFailure()).to.be.rejectedWith(Error);
  });

  // check that players cannot make picks using invalid integers/teams -- for
  // security reasons, it is very important to ensure only allowable user
  // inputs are accepted
  it('prevents players from making picks with invalid teams', async () => {
    // this test is looking for a failed entry
    const makePickFailure = async function () {
      // use integer less than 1 or greater than 32 for testing
      await makePick(0, accounts[1]);
    };
    return expect(makePickFailure()).to.be.rejectedWith(Error);
  });

  // check that players cannot make picks after the deadline -- this prevents
  // cheating by ensuring that players cannot choose teams after games have started
  it('prevents players from making picks after the pick deadline', async () => {
    // // this test is commented out, since it fails due to an issue with
    // // ganache-cli's evm_increaseTime method
    // // see issue here: https://github.com/trufflesuite/ganache-cli/issues/336
    // // details on my implementation at the end here: https://medium.com/@msolomon44/lessons-learned-from-developing-an-nfl-survivor-pool-on-ethereum-992dd4efbb25

    // // this test is looking for a failed entry
    // let block = await web3.eth.getBlock('latest');
    // // Log initial timestamp -- 1535296387
    // console.log(block.timestamp);

    // // Increase time by a huge amount simply to make it easier to distinguish
    // // between the logged 10-digit numbers (this changes leading digit from a
    // // 1 to a 2)
    // await increaseTime(533868440);

    // // Get new block number
    // block = await web3.eth.getBlock('latest');
    // // Log new timestamp from ganache-cli -- 2069164830 (seems to be updated)
    // console.log(block.timestamp);
    // // Log timestamp returned by the contract -- 1535298108 (not updated)
    // console.log(String(await survivor.getTime()));

    // const makePickFailure = async function () {
    //   // use integer less than 0 or greater than 31 for testing
    //   await makePick(9, accounts[2]);
    // };
    // return expect(makePickFailure()).to.be.rejectedWith(Error);
  });

  // check that players can change their picks before the deadline
  it('allows players to change their picks before the pick deadline', async () => {
    // Functionality not yet implemented
  });

  // check that players cannot change their picks after the deadline
  it('prevents players from changing their picks after the pick deadline', async () => {
    // changePicks uses the same modifiers as makePicks to prevent this, so
    // we do not need to implement this test twice
  });

  // TESTS FOR RECEIVING RESULTS -----------------------------------------------
  // check that game results are properly received from Oraclize
  it('receives results from Oraclize', async () => {
    // not implemented, as ganache-cli's evm_increaseTime method does not
    // seem to work properly
    // see issue here: https://github.com/trufflesuite/ganache-cli/issues/336
  });

  // TESTS FOR SAFEGUARDS ------------------------------------------------------
  // check that the contract refunds people if results are not provided -- we
  // provide a way of providing refunds if Oraclize goes down
  it('provides refunds for withdrawal if results are not provided', async () => {
    // currently not implemented due to time constraints
  });


  // check that ownership can be changed -- this is important in case the
  // original owner can no longer manage the contract to pause if needed
  it('allows ownership to be changed', async () => {
    // get current owner
    const owner = await survivor.owner();
    // make sure owner is accounts[0]
    expect(owner).to.be.equal(accounts[0]);
    // try to change owner
    await survivor.transferOwnership(accounts[8], {
      from: accounts[0],
    });
    // get new owner
    const newOwner = await survivor.owner();
    // confirm it has changed
    expect(newOwner).to.not.equal(owner);
  });
}); // end contract()
