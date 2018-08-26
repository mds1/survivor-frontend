NFL Survivor Decentralized Application. The backend code can be found [here](https://github.com/mds1/survivor-backend).

# NFL Survivor Dapp
Not familiar with Survivor leagues? Here's how to play:

* Pay the entry fee to join the Survivor pool
* Each week choose one team to win their game straight up (no point spread)
  * If they lose, you are out
  * If they win, you pick a new team next week
  * Teams can only be picked once
* Last player remaining wins the pot
  * If there is a tie at the end of the season, the remaining players split the pot
  * If all remaining players are eliminated at once, those players all split the pot

## Config.js
To build/deploy this project you will need to create a file in the project root called `config.js` that looks like this:
```JavaScript
const keys = {
  infuraAPIKey: 'your infura key',
  mnemonic: 'your mnemonic phrase',
};

module.exports = keys;
```

## Getting Started
To run a copy of this locally on a development server:
1. Run `npm install`
2. Run `quasar dev` (this will get you up and running using the copy of this contract on the Rinkeby network)

## Testing
If you'd like to run the tests, there's a few extra setup steps
1. Either `git clone` or download [ethereum-bridge](https://github.com/oraclize/ethereum-bridge) somewhere on your computer _outside_ of this folder
2. Run `npm install` within that folder
3. Install [Gananche CLI](https://github.com/trufflesuite/ganache-cli) using `npm install -g ganache-cli`
4. Install [Truffle](https://github.com/trufflesuite/truffle) using `npm install -g truffle@4.1.3` (newer versions of Truffle will not work, as Oraclize is only compatible with versions of Solidity <= 0.4.20, and Truffle versions are currently tied to specific Solidity versions)

Then, to run tests:
1. From within this project's folder, start up ganache-cli using `ganache-cli -d -l 0x6ACFC0`
   * The `-l 0x6ACFC0` increases the block gas limit to 7,000,000. This is used since the default ganache gas limit is lower than the Rinkey/Mainnet gas limits, and the contract is expensive to deploy so needs to bring this up a bit
2. In a separate terminal window, navigate to the `ethereum-bridge` folder and start up ethereum-bridge using `node bridge -H localhost:8545 -a 9 --dev`
   * If interested, you can read more about this command in the ethereum-bridge docs and in [this](https://medium.com/coinmonks/using-apis-in-your-ethereum-smart-contract-with-oraclize-95656434292e) article
3. In a third terminal window, run tests with `truffle test`

## App Architecture
This section explains the architecture used for the three parts of this application: the smart contract, the frontend user interface, and the server

### Smart Contract
The main smart contract, `Survivor.sol`, can be found in the `contracts` folder. See the two documents within the `docs` folder for more details about design decisions in this contract.


* Upon creating the contract, we define the entry fee and deadline, and a time by which all week 1 games are over
  * During contract creation we schedule the first call to Oraclize
  * We allow players to join the pool and make week 1 picks

* In the contract, we store a list of players, their current pick, and their historical picks
  * This is how we verify a pick is ok when submitted
  * We do not need to check if a player is alive when they make a pick, since the API handles this using the remainingPlayers array stored by the contract


* After week 1 games end, Oraclize calls `__callback` and provides results
  * The existing array of remaining players is used by the API to determine this next set of remaining players
  * An updated  array of remaining players is returned and used to determine the next action by the contract (i.e. make payouts to winners or prepare for next week's picks)
  * The call for the next week's results is scheduled within this function
  * The contract uses the length of the remainingPlayers array and the current week to determine if there was a winner, and if so makes payouts accordingly


### Frontend
Interaction with the frontend should be self-explanatory for the most part. However, you will need to refresh the page after submitting a transaction to see the updated UI. A few things of note:
* [MetaMask](https://metamask.io/), or some other client that injects web3, is required to use this dapp.
* For convenience, the Smart Contracts page provides the contract source code and links to the corresponding Etherscan page
* [Quasar Framework](https://github.com/quasarframework/quasar) is used as the foundation, which uses [Vue](https://vuejs.org/), [Vuex](https://vuex.vuejs.org/), and [Vue Router](https://router.vuejs.org/)behind the scenes

### Server
* In order to simplify smart contract logic and reduce gas costs, a simple server was setup to obtain weekly game results and determine which players remain
* The server sends back an array of addresses to the contract to indicate which players survived that week
* Calls to the server are made using [Oraclize](http://www.oraclize.it/) in order to ensure data integrity. Oraclize also simplifies the process of scheduling weekly calls to the server to get results


## Future Improvements
Below are various ideas on how this contract can be improved upon:
* Creation of a SurvivorFactory contract to allow players to deploy their own pools to play with friends
  * This would require moving ENTRY_FEE and MAX_NUMBER_OF_PLAYERS into the constructor so users can choose these parameters
  * It would also be nice to have a whitelisted set of addresses so people can ensure they are playing with their friends, and not stranges
* More on-chain operations when determining winners
* Lock the ability to call `makePicks()` based on your specific team. Currently, no more picks can be made after 8:00 PM EST Thursday's even if the team you want to pick does not play until Sunday. Adding this in would likely get pricey as it would require additional API calls and state variables to maintain this data.
  * Another option is to hardcode this data in the contract, but the risk is when games gete reschedule (due to weather, natural disasters, flexible scheduling, etc.)
* Allow the option to restore all eliminated players, when all remaining players are eliminated simultaneously and it is not week 17
* Allow players to pay _x_ times the entry fee to receive _x_ picks per week
* Random pick assignment for players who forget to pick

## Acknowledgements
* Big thanks to the [MySportsFeed](https://www.mysportsfeeds.com/) team for providing a free/inexpensive API to obtain sports data
* Thanks to [OpenZeppelin](https://openzeppelin.org/) for their awesome library of smart contract