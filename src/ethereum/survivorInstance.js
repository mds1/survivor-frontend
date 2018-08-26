/* eslint-disable-next-line */
import web3 from './web3';

// the file below will be output after compiling
import survivor from '../../build/contracts/Survivor.json';

// Create and export instance of the contract
// This allows us to simply import this file to interact with the deployed contract, e.g:
/*
    import survivor from '@ethereum/survivorInstance.js'
    const output = await survivor.methods.someMethod().call()
*/

const instance = new web3.eth.Contract(
  survivor.abi,
  '0x976595a9694fba7edc3e4af5dcaf26292e1bac45',
);

export default instance;
