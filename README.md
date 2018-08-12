Designed for the ConsenSys Academy 2018 Developer Program Final Project. The backend code can be found [here](https://github.com/mds1/survivor-backend)

# NFL Survivor Dapp
Not familiar with Survivor leagues? Here's how to play:

* Join the survivor pool
* Each week choose one team to win their game (straight up, no point spread)
  * If they lose, you are eliminated
  * If they win, you survive and pick a new team next week
  * Teams can only be picked once
* If all remaining players are eliminated at once, those players all move on to the next week
* Last player remaining wins the pot
  * If there is a tie at the end of the season, the remaining players split the pot evenly

## Config.js
Explain this.....

## Getting Started
To run a copy of this locally on a development server:
1. Install [Gananche CLI](https://github.com/trufflesuite/ganache-cli) using `npm install -g ganache-cli`
2. Install [Truffle](https://github.com/trufflesuite/truffle) using `npm install -g truffle`
3. Run `npm install`
4. Run `quasar dev`

## Testing
If you'd like to run the tests, there's a few extra setup steps
1. Either `git clone` or download [ethereum-bridge](https://github.com/oraclize/ethereum-bridge) somewhere on your computer _outside_ of this folder
2. Run `npm install` within that folder

Then, to run tests:
1. From within this project's folder, start up ganache-cli using `ganache-cli -d`
2. In a separate terminal window, start up ethereum-bridge using `node bridge -H localhost:8545 -a 9 --dev`
   * If interested, you can read more about this command in the ethereum-bridge docs and in [this](https://medium.com/coinmonks/using-apis-in-your-ethereum-smart-contract-with-oraclize-95656434292e) article
3. In a third terminal window, run tests with `truffle test`

## App Architecture
This section explains the architecture used for the three parts of this application: the smart contract, the frontend user interface, and the server

### Smart Contract
* The main smart contract, `Survivor.sol`, can be found in the `contracts` folder
* See the two documents within the `docs` folder for more details about design decisions in this contract

### Frontend
* [Quasar Framework](https://github.com/quasarframework/quasar) is used as the foundation, which uses [Vue](https://vuejs.org/), [Vuex](https://vuex.vuejs.org/), and [Vue Router](https://router.vuejs.org/)behind the scenes
* [MetaMask](https://metamask.io/), or some other client that injects web3, is required to use this dapp.
* For transparency, the Smart Contracts page provides the contract source code and links to the corresponding Etherscan page

### Server
* In order to simplify smart contract logic and reduce gas costs, a simple server was setup to obtain weekly game results and determine which players remain
* The server sends back an array of addresses to the contract to indicate which players survived that week
* Calls to the server are made using [Oraclize](http://www.oraclize.it/) in order to ensure data integrity. Oraclize also simplifies the process of scheduling weekly calls to the server to get results


## Updates on the Way!
Over the next few weeks, this site will be updated with the following features:
* [ ] Addition of a "status" area on the site to ensure it is very clear whether or not they are successfully connected to [MetaMask](https://metamask.io/)
* [ ] Completion of the "Smart Contract" tab to display the contract source code

## Acknowledgements
* Big thanks to the [MySportsFeed](https://www.mysportsfeeds.com/) team for providing a free/inexpensive API to obtain sports data
* Thanks to [OpenZeppelin](https://openzeppelin.org/) for their awesome library of smart contract