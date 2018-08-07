/* eslint-disable-next-line */
import web3 from './web3';

// the file below will be output after compiling
// import survivor from './truffle/build/contracts/Survivor.json';
let survivor; // TODO this is a temporary variable to replace above

// Create and export instance of the contract
// This allows us to simply import this file to interact with the deployed contract, e.g:
/*
    import survivor from '@ethereum/survivorInstance.js'
    const output = await survivor.methods.someMethod().call()
*/

// const instance = new web3.eth.Contract(
//   survivor.abi,
//   // *REPLACE* this address with the address of your deployed contract
//   '0x170732ddd535ca37245ac8e24677f87c9a232965',
// );
const instance = survivor; // TODO this is a temporary variable to replace above

export default instance;
