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
  '0xf3020cb3070340becc8ca51d7ef33f7930d9edf3',
);

export default instance;
