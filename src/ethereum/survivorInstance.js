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
  '0xCb9AC72B34b3F89Dbc278154ACC481d1D7dC133A',
);

export default instance;
