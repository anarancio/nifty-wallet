// Constant names, if you want to add a new token (icon), just go to constant.js and add one to the array, then add it to getNameTokenForIcon
import {SLIP_ADDRESSES} from '../constants/slipAddresses'
import React from 'react';
import _ from 'lodash';

const getChainAddressByChainAddress = function (chainAddress) {
  return SLIP_ADDRESSES.find(e => e.chain === chainAddress);
}

const getStatusForChannel = (SDK_STATUS) => {
  switch (SDK_STATUS) {
    case 'CHANNEL_OPENED':
      return 'OPEN';
    default:
      return 'CLOSE';
  }
}
const sumValuesOfArray = (items, prop) => {
  return items.reduce(function (a, b) {
    return a + b[prop];
  }, 0);
};
const arraysMatch = (arr1, arr2) => {
  return _.isEqual(arr1, arr2);
};

const getStatus = (sdkStatus) => {
  let retVal;
  switch (sdkStatus) {
    case 'CHANNEL_OPENED':
      retVal = 'Open';
      break;
    case 'CHANNEL_WAITING_FOR_CLOSE':
      retVal = 'Waiting for Close';
      break;
    case 'CHANNEL_WAITING_OPENING':
      retVal = 'Opening';
      break;
    default:
      retVal = 'Closed';
  }
  return retVal;
}

const clearArray = (arrayObject) => {
  if (arrayObject && Array.isArray(arrayObject)) {
    for (let index = 0; index < arrayObject.length; index++) {
      arrayObject.pop();
    }
  }
}

export {
  getChainAddressByChainAddress,
  getStatusForChannel,
  sumValuesOfArray,
  arraysMatch,
  getStatus,
  clearArray,
}
