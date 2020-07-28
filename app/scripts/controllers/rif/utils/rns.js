import web3Utils from 'web3-utils';
import * as namehash from 'eth-ens-namehash';
import {namehash as rskNameHash} from '@rsksmart/rns/lib/utils';

export function generateRandomSecret () {
  const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
  const strSalt = Array.from(randomBytes).map(byte => byte.toString(16)).join('');
  return `0x${strSalt.padEnd(64, '0')}`;
}

export function generateDataHash (methodSignature, orderedParameterArray) {
  const cleanMethodHash = web3Utils.sha3(methodSignature).substring(0, 10);
  const cleanParameterHashes = [];
  if (orderedParameterArray && orderedParameterArray.length > 0) {
    for (let index = 0; index < orderedParameterArray.length; index++) {
      const parameter = orderedParameterArray[index];
      let cleanParameterHash;
      if (parameter.toString().startsWith('0x')) {
        cleanParameterHash = parameter.toString().substring(2).padStart(64, '0');
      } else {
        cleanParameterHash = web3Utils.sha3(parameter).substring(2);
      }
      cleanParameterHashes.push(cleanParameterHash);
    }
  }
  return cleanMethodHash + cleanParameterHashes.join();
}

export function numberToUint32 (number) {
  const hexDuration = web3Utils.numberToHex(number);
  let duration = '';
  for (let i = 0; i < 66 - hexDuration.length; i += 1) {
    duration += '0';
  }
  duration += hexDuration.slice(2);
  return duration;
}

export function utf8ToHexString (string) {
  return string ? web3Utils.asciiToHex(string).slice(2) : '';
}

export function getNodeHash(domainName, subdomainName = '') {
  let node = namehash.hash(domainName);
  if (subdomainName) {
    node = rskNameHash(domainName);
    const label = web3Utils.sha3(subdomainName);
    node = web3Utils.soliditySha3(node, label);
  }
  return node;
}
