// set of functions that get used with the JoinPool.vue template
// place this file in the src/components/common folder

import { Notify } from 'quasar';
import web3 from '../../ethereum/web3';

// =======================================================================================
//                                       Generic
// =======================================================================================

export function requiredNetwork() {
  // returns the required network the user must be connected to in order to interact with this dapp
  // format this using the same nomenclature given in the currentNetwork() function below
  return 'Rinkeby';
}

export async function currentNetwork() {
  // returns the name of the network the user is currently connected to
  const netId = await web3.eth.net.getId();

  switch (netId) {
    case 1:
      return 'Main';
    case 2:
      return 'Morden'; // Morden test network is deprecated
    case 3:
      return 'Ropsten';
    case 4:
      return 'Rinkeby';
    case 42:
      return 'Kovan';
    default:
      return 'an unknown network';
  }
}

export function integer2team(integer) {
  // Return team based on input integer
  const mapping = {
    1: 'Arizona Cardinals',
    2: 'Atlanta Falcons',
    3: 'Baltimore Ravens',
    4: 'Buffalo Bills',
    5: 'Carolina Panthers',
    6: 'Chicago Bears',
    7: 'Cincinnati Bengals',
    8: 'Cleveland Browns',
    9: 'Dallas Cowboys',
    10: 'Denver Broncos',
    11: 'Detroit Lions',
    12: 'Green Bay Packers',
    13: 'Houston Texans',
    14: 'Indianapolis Colts',
    15: 'Jacksonville Jaguars',
    16: 'Kansas City Chiefs',
    17: 'Los Angeles Charger', // LA chargers
    18: 'Los Angeles Rams', // LA rams (not LAR, since MySportsFeed uses LA)
    19: 'Miami Dolphins',
    20: 'Minnesota Vikings',
    21: 'New England Patriots',
    22: 'New Orleans Saints',
    23: 'New York Giants',
    24: 'New York Jets',
    25: 'Oakland Raiders',
    26: 'Philadelphia Eagles',
    27: 'Pittsburgh Steelers',
    28: 'Seattle Seahawks',
    29: 'San Francisco 49ers',
    30: 'Tampa Bay Buccaneers',
    31: 'Tennessee Titans',
    32: 'Washington Redskins',
  };
  return mapping[integer];
}


export function createEtherscanAddressLink(network, address) {
  // network: string, ethereum network the address is on (e.g. main, ropsten, etc.)
  // address: address to generate link for

  // generate and return URL
  if (network.toUpperCase() === 'MAIN') {
    return `https://etherscan.io/address/${address}`;
  }
  return `https://${network}.etherscan.io/address/${address}`;
}

export function getSourceCodeFromEtherscan(network, address) {
  // network: string, ethereum network the address is on (e.g. main, ropsten, etc.)
  // address: address to generate link for

  // generate and return URL
  let url;
  if (network.toUpperCase() === 'MAIN') {
    url = `https://etherscan.io/address/${address}#code`;
  } else {
    url = `https://${network}.etherscan.io/address/${address}#code`;
  }

  // copy source code
  // TO DO

  return url;
}

export function capitalizeFirstLetter(string) {
  // capitalize the first letter of a string
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatNumberForWeb3(value) {
  // formats the value for use with Web3
  //   - removes scientific notation and converts to decimal format
  //   - formats number as a string
  // source: https://stackoverflow.com/questions/16139452/how-to-convert-big-negative-scientific-notation-number-into-decimal-notation-str

  const data = String(value).split(/[eE]/);
  if (data.length === 1) {
    return data[0];
  }

  /* eslint-disable */
  let z = '',
    sign = this < 0 ? '-' : '',
    str = data[0].replace('.', ''),
    mag = Number(data[1]) + 1;

  if (mag < 0) {
    z = `${sign }0.`;
    while (mag++) z += '0';
    return z + str.replace(/^-/, '');
  }
  mag -= str.length;
  while (mag--) z += '0';
  return str + z;
}
/* eslint-enable */

// =======================================================================================
//                                  ENS Functions
// =======================================================================================

/* eslint-disable */

// variables for ENS support, from https://github.com/ethereum/meteor-package-elements/blob/master/addressInput.js
// ENS support added for mainnet only
const ensContractAbi = [{
  constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'resolver', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function',
}, {
  constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'owner', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function',
}, {
  constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'label', type: 'bytes32' }, { name: 'owner', type: 'address' }], name: 'setSubnodeOwner', outputs: [], payable: false, type: 'function',
}, {
  constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'ttl', type: 'uint64' }], name: 'setTTL', outputs: [], payable: false, type: 'function',
}, {
  constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'ttl', outputs: [{ name: '', type: 'uint64' }], payable: false, type: 'function',
}, {
  constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'resolver', type: 'address' }], name: 'setResolver', outputs: [], payable: false, type: 'function',
}, {
  constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'owner', type: 'address' }], name: 'setOwner', outputs: [], payable: false, type: 'function',
}, {
  anonymous: false, inputs: [{ indexed: true, name: 'node', type: 'bytes32' }, { indexed: false, name: 'owner', type: 'address' }], name: 'Transfer', type: 'event',
}, {
  anonymous: false, inputs: [{ indexed: true, name: 'node', type: 'bytes32' }, { indexed: true, name: 'label', type: 'bytes32' }, { indexed: false, name: 'owner', type: 'address' }], name: 'NewOwner', type: 'event',
}, {
  anonymous: false, inputs: [{ indexed: true, name: 'node', type: 'bytes32' }, { indexed: false, name: 'resolver', type: 'address' }], name: 'NewResolver', type: 'event',
}, {
  anonymous: false, inputs: [{ indexed: true, name: 'node', type: 'bytes32' }, { indexed: false, name: 'ttl', type: 'uint64' }], name: 'NewTTL', type: 'event',
}];
const resolverContractAbi = [{
  constant: true, inputs: [{ name: 'interfaceID', type: 'bytes4' }], name: 'supportsInterface', outputs: [{ name: '', type: 'bool' }], payable: false, type: 'function',
}, {
  constant: true, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'contentTypes', type: 'uint256' }], name: 'ABI', outputs: [{ name: 'contentType', type: 'uint256' }, { name: 'data', type: 'bytes' }], payable: false, type: 'function',
}, {
  constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'x', type: 'bytes32' }, { name: 'y', type: 'bytes32' }], name: 'setPubkey', outputs: [], payable: false, type: 'function',
}, {
  constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'content', outputs: [{ name: 'ret', type: 'bytes32' }], payable: false, type: 'function',
}, {
  constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'addr', outputs: [{ name: 'ret', type: 'address' }], payable: false, type: 'function',
}, {
  constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'contentType', type: 'uint256' }, { name: 'data', type: 'bytes' }], name: 'setABI', outputs: [], payable: false, type: 'function',
}, {
  constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'name', outputs: [{ name: 'ret', type: 'string' }], payable: false, type: 'function',
}, {
  constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'name', type: 'string' }], name: 'setName', outputs: [], payable: false, type: 'function',
}, {
  constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'hash', type: 'bytes32' }], name: 'setContent', outputs: [], payable: false, type: 'function',
}, {
  constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'pubkey', outputs: [{ name: 'x', type: 'bytes32' }, { name: 'y', type: 'bytes32' }], payable: false, type: 'function',
}, {
  constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'addr', type: 'address' }], name: 'setAddr', outputs: [], payable: false, type: 'function',
}, { inputs: [{ name: 'ensAddr', type: 'address' }], payable: false, type: 'constructor' }, {
  anonymous: false, inputs: [{ indexed: true, name: 'node', type: 'bytes32' }, { indexed: false, name: 'a', type: 'address' }], name: 'AddrChanged', type: 'event',
}, {
  anonymous: false, inputs: [{ indexed: true, name: 'node', type: 'bytes32' }, { indexed: false, name: 'hash', type: 'bytes32' }], name: 'ContentChanged', type: 'event',
}, {
  anonymous: false, inputs: [{ indexed: true, name: 'node', type: 'bytes32' }, { indexed: false, name: 'name', type: 'string' }], name: 'NameChanged', type: 'event',
}, {
  anonymous: false, inputs: [{ indexed: true, name: 'node', type: 'bytes32' }, { indexed: true, name: 'contentType', type: 'uint256' }], name: 'ABIChanged', type: 'event',
}, {
  anonymous: false, inputs: [{ indexed: true, name: 'node', type: 'bytes32' }, { indexed: false, name: 'x', type: 'bytes32' }, { indexed: false, name: 'y', type: 'bytes32' }], name: 'PubkeyChanged', type: 'event',
}];
const ensAddress = '0x314159265dd8dbb310642f98f50c066173c1259b';

// set ensContract
export const ensContract = new web3.eth.Contract(ensContractAbi, ensAddress);

function sha3(str, opt) {
  // source: https://github.com/ethereum/meteor-package-elements/blob/master/addressInput.js
  return `0x${web3.utils.sha3(str, opt).replace('0x', '')}`;
}

function namehash(name) {
  // source: https://github.com/ethereum/meteor-package-elements/blob/master/addressInput.js
  let node =
    '0x0000000000000000000000000000000000000000000000000000000000000000';
  if (name !== '') {
    const labels = name.split('.');
    for (let i = labels.length - 1; i >= 0; i--) {
      node = sha3(node + sha3(labels[i]).slice(2), { encoding: 'hex' });
    }
  }
  return node.toString();
}

export async function getAddr(name, ens, callback) {
  // source: https://github.com/ethereum/meteor-package-elements/blob/master/addressInput.js

  // NEW: added async check for which network we're connected to, since only mainnet ENS is supported
  // (this was not part of the original source code linked above)
  const network = await currentNetwork();
  if (network !== 'Main') {
    return null;
  }

  const resolverContract = new web3.eth.Contract(resolverContractAbi);

  const node = namehash(name);
  // get a resolver address for that name
  ens.methods
    .resolver(node)
    .call()
    .then((resolverAddress) => {
      if (resolverAddress !== 0) {
        // if you find one, find the addr of that resolver
        resolverContract.options.address = resolverAddress;
        resolverContract.methods
          .addr(node)
          .call()
          .then((result) => {
            if (result !== 0 && callback) {
              callback(result);
            }
          });
      } else {
        // NEW: added this else block to ensure address state is set to null if invalid ENS name is entered
        // (this else block was not part of the original source code linked above)
        callback(null);
      }
    });
}

// function getName (address, ens, callback) {
//   // source: https://github.com/ethereum/meteor-package-elements/blob/master/addressInput.js
//   var resolverContract = new web3.eth.Contract(resolverContractAbi)
//   var node = namehash(
//     address.toLowerCase().replace('0x', '') + '.addr.reverse'
//   )

//   // get a resolver address for that name
//   ens.methods.resolver(node).call(function (error, resolverAddress) {
//     if (error) {
//       console.log('Error from ens getName: ', error)
//       return
//     }

//     if (resolverAddress !== 0) {
//       // if you find one, find the name on that resolver
//       resolverContract.options.address = resolverAddress
//       resolverContract.methods.name(node, function (error, result) {
//         if (!error && result !== 0 && callback) {
//           callback(result)
//         }
//       })
//     }
//   })
// }

/* eslint-enable */

// =======================================================================================
//                                       Validators
// =======================================================================================

// Check if an Ethereum address is valid
export function isValidETHAddress(address) {
  return web3.utils.isAddress(address) && address.length === 42;
}

export async function isValidENSDomain(name, ens) {
  // this is a modified version of getAddr to use for form validation
  // modified from getAddr: https://github.com/ethereum/meteor-package-elements/blob/master/addressInput.js

  // ensure address ends with .eth
  if (name.slice(-4) !== '.eth') {
    return false;
  }

  // var resolverContract = new web3.eth.Contract(resolverContractAbi)

  const node = namehash(name);

  let result;
  // get a resolver address for that name
  await ens.methods
    .resolver(node)
    .call()
    .then((resolverAddress) => {
      if (resolverAddress !== 0) {
        result = true;
      } else {
        // NEW: added this else block to ensure address state is set to null if
        // invalid ENS name is entered
        // (this else block was not part of the original source code linked above)
        result = false;
      }
    });

  return result;
}

// =======================================================================================
//                              Transaction UI Helpers
// =======================================================================================

export function createTXAlert(html, type) {
  // html: string, valid HTML to be used as the alert's text
  // type: string, adds color and icon, choose 'positive', 'negative', 'warning', 'info'

  const alert = Notify.create({
    message: '', // text is updated later
    timeout: 0,
    type,
    actions: [
      {
        label: 'Dismiss',
      },
    ],
  });

  // use setTimeout(function, 0) to ensure element is created by the time we add HTML
  setTimeout(() => {
    // the div containing the text has no class or id, so we first get its parent
    // based on its classes
    const el = document.getElementsByClassName('q-alert-content col self-center');
    // then we update the html of the most recently added notification
    el[el.length - 1].firstChild.innerHTML = html;
  }, 0);

  return alert;
}

export function deleteAllTXAlerts() {
  // removes all notification elements generated by QNotify
  const elements = document.getElementsByClassName('q-notification');
  for (let i = 0; i < elements.length; i++) {
    elements[i].remove();
  }
}

export function createTXLink(network, txhash) {
  // network: string, ethereum network the TX is on (e.g. main, ropsten, etc.)
  // txhash: transaction hash

  // generate URL
  let url;
  if (network.toUpperCase() === 'MAIN') {
    url = `https://etherscan.io/tx/${txhash}`;
  } else {
    url = `https://${network}.etherscan.io/tx/${txhash}`;
  }

  const urlHTML = `<a href=${url} target="_blank">${txhash}</a>`;

  // put together HTML string
  return `Transaction ID: ${urlHTML}`;
}

export function trimErrorMessage(msg) {
  // msg: string or object, error message who's length to trim
  const maxLength = 199;
  const explanationMsg = 'The portion of the error message shown below is likely ' +
    'the most important, but the full error message can be found in the console.<br><br>';

  if (typeof msg === 'object') {
    // if input is an object, look for message property
    msg = `${explanationMsg}<i>${msg.message.slice(0, maxLength)}.....</i>`;
  } else if (typeof msg === 'string') {
    // if input is a string, just trim it directly
    msg = `${explanationMsg}<i>${msg.slice(0, maxLength)}.....</i>`;
  }

  return msg;
}


export async function performNetworkChecks(_this, accounts) {
  // returns false if checks fail, otherwise returns true

  // CHECK NUMBER 1: ensure account is unlocked
  if (accounts[0] === undefined) {
    // display failed message to user
    const failedHTML = '<br><br><b>Oops! Something went wrong...</b><br>Be sure to unlock ' +
      'your account to send this transaction. Check MetaMask and enter your password if necessary.<br><br><br>';
    createTXAlert(failedHTML, 'negative');
    // reset status of txsent flag, so user can send another tx if desired
    _this.txsent = false;
    return false;
  }

  // CHECK NUMBER 2: ensure the user is on the right network
  if (_this.$store.state.network.current.toUpperCase() !== _this.requiredNetwork.toUpperCase()) {
    // display failed message to user
    const failedHTML = `<br><br><b>Oops! Something went wrong...</b><br>You must be connected to the ${_this.requiredNetwork} ` +
      `network to send this transaction. You are currently connected to the ${_this.$store.state.network.current} network.<br><br><br>`;
    createTXAlert(failedHTML, 'negative');
    // reset status of txsent flag, so user can send another tx if desired
    _this.txsent = false;
    return false;
  }

  // NOW BOTH CHECKS PASSED: continue with transaction
  // Generate alert that transaction will be sent
  const waitingHTML = '<br><br>Please confirm the transasction using the pop-up MetaMask dialog<br><br><br>';
  createTXAlert(waitingHTML, 'info');
  return true;
} // end performChecks


export function onTransactionHash(_this, txhash) {
  // save off txhash for later
  _this.txhash = txhash;
  // dismiss old alert
  deleteAllTXAlerts();
  // prepare new message
  const sentHTML1 = '<br><br>Waiting for the transaction to be confirmed by the Ethereum network. ' +
    'This will take between 15 and 60 seconds, but sometimes can be even longer. Click the transaction ' +
    'ID below for more information on the status of your transaction.<br><br>';
  // generate hyperlink to the transaction on ethercsan
  const txidHTML = createTXLink(_this.requiredNetwork, _this.txhash);
  // finish generating message
  const sentHTML = `${sentHTML1} ${txidHTML} <br><br><br>`;
  // display updated message to user
  createTXAlert(sentHTML, 'warning');

  return _this;
}


export function onReceipt(_this, receipt) {
  // receipt.status returns 0x0 if transaction fails, or 0x1 if it succeeds
  web3.eth.getTransactionReceipt(_this.txhash).then(() => {
    if (receipt.status === '0x0') {
      // TRANSACTION FAILED
      // dismiss previous alert
      deleteAllTXAlerts();
      // shorten long error messages that may contain code references
      const errmsg = trimErrorMessage(err.message); // eslint-disable-line no-undef
      // generate hyperlink to the transaction on ethercsan
      const txidHTML = createTXLink(_this.requiredNetwork, _this.txhash);
      // finish generating message
      const failedHTML = `<br><br><b>Oops! Something went wrong...</b><br>${errmsg} For reference, your transaction ID is below.<br><br>${txidHTML}<br><br><br>`;
      // display updated alert to user
      createTXAlert(failedHTML, 'negative');
      // re-throw error so it shows in the console
      throw new Error(err); // eslint-disable-line no-undef
    } else {
      // TRANSACTION SUCCEEDED

      // currently returns the warning below:

      // Warning: a promise was created in a handler at webpack-internal:///./node_modules/web3-core-method/src/index.js:346:44 but was not returned from it, see http://goo.gl/rRqMUw
      //     at new Promise (webpack-internal:///./node_modules/bluebird/js/browser/bluebird.js:2845:10)
      //     at PromiEvent (webpack-internal:///./node_modules/web3-core-promievent/src/index.js:35:24)
      //     at Eth.send [as getTransactionReceipt] (webpack-internal:///./node_modules/web3-core-method/src/index.js:446:21)
      //     at Promise.eval (webpack-internal:///./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/components/contract/JoinPool.vue:111:87)
      //     at Promise.emit (webpack-internal:///./node_modules/eventemitter3/index.js:116:35)
      //     at eval (webpack-internal:///./node_modules/web3-core-method/src/index.js:346:44)
      // From previous event:
      //     at checkConfirmation (webpack-internal:///./node_modules/web3-core-method/src/index.js:340:14)

      // once tx is confirmed, dismiss old alert and give an update
      deleteAllTXAlerts();
      // generate hyperlink to the transaction on ethercsan
      const txidHTML = createTXLink(_this.requiredNetwork, _this.txhash);
      // finish generating message
      const confirmedHTML = `<br><br><b>Success!</b><br>Your transaction has been confirmed. For reference, your transaction ID is below.<br><br> ${txidHTML} <br><br><br>`;
      // display updated alert to user
      createTXAlert(confirmedHTML, 'positive');
    } // end if receipt.status === '0x0' / else
  }); // end web3.eth.getTransactionReceipt

  return _this;
}


export function onCatch(_this, err) {
  // if tx fails, dismiss any old alerts, then give an update
  deleteAllTXAlerts();

  // shorten long error messages that may contain code references
  const errmsg = trimErrorMessage(err.message);

  let failedHTML;
  // finish generating message
  if (_this.txhash === '') {
    // transaction was never sent, so don't include transaction ID
    failedHTML = `<br><br><b>Oops! Something went wrong...</b><br> ${errmsg} <br><br><br>`;
  } else {
    // generate hyperlink to the transaction on ethercsan
    const txidHTML = createTXLink(_this.requiredNetwork, _this.txhash);
    // include transaction ID in error message
    failedHTML = `<br><br><b>Oops! Something went wrong...</b><br> ${errmsg} For reference, your transaction ID is below.<br><br> ${txidHTML} <br><br><br>`;
  }

  // display alert
  createTXAlert(failedHTML, 'negative');

  // re-throw error so it shows in the console
  throw new Error(err);
}
