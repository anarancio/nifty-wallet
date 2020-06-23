// Constant names, if you want to add a new token (icon), just go to constant.js and add one to the array, then add it to getNameTokenForIcon
import { SLIP_ADDRESSES } from '../constants/slipAddresses'

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
  return items.reduce( function(a, b){
    return a + b[prop];
  }, 0);
};
const arraysMatch = (arr1, arr2) => {

  // Check if the arrays are the same length
  if (arr1.length !== arr2.length) return false;

  // Check if all items exist and are in the same order
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  // Otherwise, return true
  return true;

};
export {
  getChainAddressByChainAddress,
  getStatusForChannel,
  sumValuesOfArray,
  arraysMatch,
}
