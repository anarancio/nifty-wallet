import * as namehash from 'eth-ens-namehash';
import {namehash as rskNameHash} from '@rsksmart/rns/lib/utils'
import RnsJsDelegate from '../rnsjs-delegate';
import web3Utils from 'web3-utils';
import { DomainDetails, ChainAddress } from '../classes';
import RSKOwner from '../abis/RSKOwner.json';
import MultiChainresolver from '../abis/MultiChainResolver.json';
import {DOMAIN_STATUSES, EXPIRING_REMAINING_DAYS, rns} from '../../constants';
import { getDateFormatted } from '../../utils/dateUtils';
import {ChainId} from '@rsksmart/rns/lib/types';

/**
 * This is a delegate to manage all the RNS resolver operations.
 */
export default class RnsResolver extends RnsJsDelegate {
  initialize () {
    const configuration = this.configurationProvider.getConfigurationObject();
    this.rskOwnerContractInstance = this.web3.eth.contract(RSKOwner).at(configuration.rns.contracts.rskOwner);
    this.multiChainresolverContractInstance = this.web3.eth.contract(MultiChainresolver).at(configuration.rns.contracts.multiChainResolver);
    this.store.pendingChainAddressesActions = [];
  }

  onConfigurationUpdated (configuration) {
    super.onConfigurationUpdated(configuration);
    this.rskOwnerContractInstance = this.web3.eth.contract(RSKOwner).at(configuration.rns.contracts.rskOwner);
    this.multiChainresolverContractInstance = this.web3.eth.contract(MultiChainresolver).at(configuration.rns.contracts.multiChainResolver);
  }

  buildApi () {
    const rnsJsApi = super.buildApi();
    return {
      getOwner: this.bindOperation(this.getOwner, this),
      isOwner: this.bindOperation(this.isOwner, this),
      getDomainDetails: this.bindOperation(this.getDomainDetails, this),
      setResolver: this.bindOperation(this.setResolver, this),
      getChainAddressForResolvers: this.bindOperation(this.getChainAddressForResolvers, this),
      setChainAddressForResolver: this.bindOperation(this.setChainAddressForResolver, this),
      deletePendingChainAddress: this.bindOperation(this.deletePendingChainAddress, this),
      ...rnsJsApi,
    }
  }

  /**
   * Get the owner of a domain.
   * @param domainName the domain name to check.
   * @returns {Promise<string>} owner address
   */
  getOwner (domainName) {
    return new Promise((resolve, reject) => {
      this.rnsContractInstance.owner(namehash.hash(domainName), (error, address) => {
          if (error) {
            reject(error);
          }
          console.debug('Owner Address', address);
          resolve(web3Utils.toChecksumAddress(address));
      });
    });
  }

  /**
   * Checks if a domain is owned by an address.
   * @param domainName the domain name to check.
   * @param address the address to make the check.
   * @returns {Promise<boolean>} true if the address is the owner, false otherwise.
   */
  isOwner (domainName, address) {
    return new Promise((resolve, reject) => {
      this.getOwner(domainName)
        .then(ownerAddress => {
          const isOwner = ownerAddress === address;
          console.debug(address + ' is Owner? = ' + isOwner);
          resolve(isOwner);
        }).catch(error => reject(error));
    });
  }

  /**
   * Gets all details of a given domain name
   * @param domainName the domain name to check (without resolver).
   * @returns {Promise<boolean>} true if it can get all the details correctly, false otherwise.
   * @param domainName
   * @returns {Promise<unknown>}
   */
  getDomainDetails (domainName) {
    const domainNameWSuffix = this.addRskSuffix(domainName);
    return new Promise((resolve, reject) => {
      const getDomainAddress = this.getDomainAddress(domainNameWSuffix);
      const content = this.getContent(domainNameWSuffix);
      const expiration = this.getExpirationRemaining(domainNameWSuffix);
      const getOwner = this.getOwner(domainNameWSuffix);
      const getResolver = this.getResolver(domainNameWSuffix);
      Promise.all([getDomainAddress, content, expiration, getOwner, getResolver]).then(values => {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + values[2]);
        const status = this.getStatus(values[2]);
        resolve(new DomainDetails(domainNameWSuffix, values[0], values[1], getDateFormatted(expirationDate), false, values[3], status, values[4], false, false));
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * Gets a resolver address if the domain has one
   * @param domainName with the .rsk extension
   * @returns {Promise<unknown>}
   */
  getResolver (domainName) {
    return new Promise((resolve, reject) => {
      this.call(this.rnsContractInstance, 'resolver', [namehash.hash(domainName)]).then(result => {
        console.debug('getResolver resolved with', result);
        resolve(web3Utils.toChecksumAddress(result));
      }).catch(error => {
        console.debug('Error when trying to get resolver addr', error);
        reject(error);
      });
    });
  }

  /**
   * Calls the contract and sets a new resolver to a given DomainName (This function is only_owner)
   * @param domainName DomainName with the .rsk extension
   * @param resolverAddress Address of the new resolver to be setted
   * @returns {Promise<unknown>}
   */
  setResolver (domainName, resolverAddress) {
    return new Promise((resolve) => {
      const transactionListener = this.send(this.rnsContractInstance, 'setResolver', [namehash.hash(domainName), resolverAddress]);
      transactionListener.transactionConfirmed()
        .then(transactionReceipt => {
          this.getDomainDetails(domainName).then(domainDetails => {
            const domain = this.getDomain(domainName);
            domain.details = domainDetails;
            this.updateDomains(domain);
          });
          console.debug('setResolver success', transactionReceipt);
        }).catch(transactionReceiptOrError => {
          console.debug('Error when trying to set resolver', transactionReceiptOrError);
        });
      resolve(transactionListener.id);
    });
  }

  /**
   * Returns an array of chain addresses for a given domain
   * @param domainName DomainName with the .rsk extension
   * @returns {Promise<unknown>}
   */
  getChainAddressForResolvers (domainName, subdomain = '') {
    return new Promise((resolve, reject) => {
      let node = namehash.hash(domainName);
      if (subdomain) {
        node = rskNameHash(domainName);
        const label = web3Utils.sha3(subdomain);
        node = web3Utils.soliditySha3(node, label);
      }
      const addrChangedEvent = this.multiChainresolverContractInstance.AddrChanged({node: node}, {fromBlock: 0, toBlock: 'latest'});
      const chainAddrChangedEvent = this.multiChainresolverContractInstance.ChainAddrChanged({node: node}, {fromBlock: 0, toBlock: 'latest'});
      const arrChains = [];
      const errorLogs = [];
      const pendingChainAddressesActions = this.store.pendingChainAddressesActions;
      addrChangedEvent.get(function (error, result) {
        if (error) {
          console.debug('Error when trying to get addrChangedEvent for resolver', error);
          errorLogs.push(error);
        }
        result.forEach(event => {
          if (event.args.addr !== rns.zeroAddress) {
            const chainAddressPending = pendingChainAddressesActions.find(chainAddr => chainAddr.chain === ChainId.RSK);
            arrChains[0] = new ChainAddress(ChainId.RSK, event.args.addr, chainAddressPending ? chainAddressPending.action : '');
          } else {
            arrChains.splice(0, 1);
          }
        });
        console.debug('getChainAddressForResolvers success', arrChains);
      });
      chainAddrChangedEvent.get(function (error, result) {
        if (error) {
          console.debug('Error when trying to get chainAddrChangedEvent for resolver', error);
          errorLogs.push(error);
          reject(errorLogs);
        }
        result.forEach(event => {
          const chainAddressPending = pendingChainAddressesActions.find(chainAddr => chainAddr.chain === event.args.chain);
          const chainAddrToPush = new ChainAddress(event.args.chain, event.args.addr, chainAddressPending ? chainAddressPending.action : '');
          const index = arrChains.findIndex((e) => e.chain === chainAddrToPush.chain);
          if (index === -1) {
            if (event.args.addr !== rns.zeroAddress) {
              arrChains.push(chainAddrToPush);
            }
          } else {
            if (event.args.addr !== rns.zeroAddress) {
              arrChains[index] = chainAddrToPush;
            } else {
              arrChains.splice(index, 1);
            }
          }
        });
        // Here we need to add the chainAddress that still pending to add
        pendingChainAddressesActions.map(chainAddr => {
          if (chainAddr.action === 'add' && chainAddr.isSubdomain === !!subdomain) {
            arrChains.push(new ChainAddress(chainAddr.chain, chainAddr.chainAddress, 'add'));
          }
        });
        console.debug('getChainAddressForResolvers success', arrChains);
        resolve(arrChains);
      });
    });
  }

  /**
   * This function stores a pending array of chainAddresses, every time you add, update or delete a chainaddress will be a pending action stored in the this.store.pendingCHainAdddressesActions
   * Call this in the success callback, so the UI can continue it's normal flow
   * @param chain ChainId that you want to delete from the pending queue
   * @returns {Promise<unknown>}
   */
  deletePendingChainAddress (chain, isSubdomain) {
    return new Promise((resolve, reject) => {
      const index = this.store.pendingChainAddressesActions.findIndex((e) => e.chain === chain && e.isSubdomain === isSubdomain);
      if (index >= 0) {
        this.store.pendingChainAddressesActions.splice(index, 1);
      }
      resolve();
    });
  }

  /**
   * Calls the contract and sets a new chain address calling the setChainAddr function in the contract of multichainresolver
   * @param domainName DomainName with the .rsk extension
   * @param chain
   * @param chainAddress
   * @param subdomain
   * @returns {Promise<unknown>}
   */
  setChainAddressForResolver (domainName, chain, chainAddress, subdomain = '', action = 'add') {
    return new Promise((resolve, reject) => {
      let node = namehash.hash(domainName);
      if (subdomain) {
        node = rskNameHash(domainName);
        const label = web3Utils.sha3(subdomain);
        node = web3Utils.soliditySha3(node, label);
      }
      const toBeSettedChainAddress = chainAddress || rns.zeroAddress;
      this.store.pendingChainAddressesActions.push({
        chainAddress: toBeSettedChainAddress,
        chain: chain,
        isSubdomain: !!subdomain,
        action: action,
      });
      const transactionListener = this.send(this.multiChainresolverContractInstance, 'setChainAddr', [node, chain, toBeSettedChainAddress])
      transactionListener.transactionConfirmed()
        .then(transactionReceipt => {
          console.debug('setChainAddressForResolver success', transactionReceipt);
        }).catch(transactionReceiptOrError => {
          console.debug('Error when trying to set chain address for resolver', transactionReceiptOrError);
        });
      resolve(transactionListener.id);
    });
  }

  /**
  * Returns a status for the days remaining of a domain
  * @param {int} daysRemaining
  */
  getStatus (daysRemaining) {
   let retStatus = DOMAIN_STATUSES.ACTIVE
   if (daysRemaining <= 0) {
     retStatus = DOMAIN_STATUSES.EXPIRED;
   } else if (daysRemaining > 0 && daysRemaining <= EXPIRING_REMAINING_DAYS) {
     retStatus = DOMAIN_STATUSES.EXPIRING;
   }
    return retStatus;
  }

  /**
   * Gets the expiration time in days of a given domain name
   * @param domainName the domain name to check (without resolver).
   * @returns {Promise<boolean>} Days remaining (int), an error otherwise
   */
  getExpirationRemaining (domainName) {
    return new Promise((resolve, reject) => {
      const label = this.cleanDomainFromRskSuffix(domainName);
      const hash = `0x${web3Utils.sha3(label)}`;
      this.call(this.rskOwnerContractInstance, 'expirationTime', [hash]).then(result => {
        const expirationTime = result;
        this.web3.eth.getBlock('latest', (timeError, currentBlock) => {
          if (timeError) {
            console.debug('Time error when tryng to get last block ', timeError);
            reject(timeError);
          }
          const diff = expirationTime - currentBlock.timestamp;
          // the difference is in seconds, so it is divided by the amount of seconds per day
          const remainingDays = Math.floor(diff / (60 * 60 * 24));
          console.debug('Remaining time of domain', remainingDays);
          resolve(remainingDays);
        });
      }).catch(error => {
        console.debug('Error when trying to invoke expirationTime', error);
        reject(error);
      });
    });
  };

  getContent (domainName) {
    return new Promise((resolve, reject) => {
      const label = domainName.split('.')[0];
      this.call(this.multiChainresolverContractInstance, 'content', [label]).then(result => {
        resolve(result);
      }).catch(error => {
        console.debug('Error when trying to get content of domain', error);
        reject(error);
      });
    });
  }
}
