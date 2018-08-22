/* eslint-disable-next-line */
import web3 from './web3';

// the file below will be output after compiling
import survivor from '@contracts/Survivor.json';

// Create and export instance of the contract
// This allows us to simply import this file to interact with the deployed contract, e.g:
/*
    import survivor from '@ethereum/survivorInstance.js'
    const output = await survivor.methods.someMethod().call()
*/

const instance = new web3.eth.Contract(
  survivor.abi,
  '0x66acd4550da9658a77c94ab6b255488588ad8dce',
);

export default instance;
