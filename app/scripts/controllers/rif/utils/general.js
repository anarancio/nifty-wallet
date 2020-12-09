import {global} from '../constants';
import {toChecksumAddress} from 'web3-utils';

const nodeify = require('../../../lib/nodeify');

export function isRskConfigurableNetwork (networkId) {
  return global.networks.reg === networkId;
}

export function isRskNetwork (networkId) {
  return global.networks.main === networkId ||
    global.networks.test === networkId ||
    global.networks.reg === networkId;
}

/**
 * Makes the operation callback available
 * @param operation the function reference
 * @param member the function container
 * @returns {function(...[*]=)}
 */
export function bindOperation (operation, member) {
  return nodeify(operation, member);
}

export function checkRequiredParameters (params) {
  const errors = [];
  if (params && Object.keys(params).length > 0) {
    Object.keys(params).forEach(paramKey => {
      if (!params[paramKey]) {
        errors.push('Param ' + paramKey + ' is required!');
      }
    })
  }
  return errors;
}

export function checksumAddresses (addresses) {
  const checksumedAddresses = {};
  if (addresses && Object.keys(addresses).length > 0) {
    Object.keys(addresses).forEach(addressKey => {
      if (addresses[addressKey]) {
        checksumedAddresses[addressKey] = toChecksumAddress(addresses[addressKey]);
      }
    })
  }
  return checksumedAddresses;
}
