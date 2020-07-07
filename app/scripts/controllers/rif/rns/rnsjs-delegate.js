import RnsDelegate from './rns-delegate'
import RNS from '@rsksmart/rns'
import {rns} from '../constants'
import {namehash} from '@rsksmart/rns/lib/utils'
import web3Utils from 'web3-utils'
import {ChainAddress} from './classes';
import {ChainId} from '@rsksmart/rns/lib/types';

/**
 * This class encapsulates all the RNSJS logic, it initializes rnsjs library and uses it as a wrapper.
 */
export default class RnsJsDelegate extends RnsDelegate {
  constructor (props) {
    super(props);
    this.rnsJs = new RNS(this.web3, this.getRNSOptions());
    this.store.pendingSubdomainsActions = [];
  }

  buildApi () {
    const api = super.buildApi();
    return {
      ...api,
      getDomainAddress: this.bindOperation(this.getDomainAddress, this),
      getAddressDomain: this.bindOperation(this.getAddressDomain, this),
      setAddressToDomain: this.bindOperation(this.setAddressToDomain, this),
      setDomainResolver: this.bindOperation(this.setDomainResolver, this),
      isDomainAvailable: this.bindOperation(this.isDomainAvailable, this),
      isSubdomainAvailable: this.bindOperation(this.isSubdomainAvailable, this),
      setSubdomainOwner: this.bindOperation(this.setSubdomainOwner, this),
      createSubdomain: this.bindOperation(this.createSubdomain, this),
      deleteSubdomain: this.bindOperation(this.deleteSubdomain, this),
      getSubdomainsForDomain: this.bindOperation(this.getSubdomainsForDomain, this),
      getDomains: this.bindOperation(this.getDomainsForUi, this),
      getDomain: this.bindOperation(this.getDomainForUi, this),
      updateDomain: this.bindOperation(this.updateDomainsForUi, this),
      deletePendingSubdomain: this.bindOperation(this.deletePendingSubdomain, this),
    }
  }

  /**
   * Gets the options for the RNS object needed to use rnsjs library
   * @returns an object like {{networkId: (() => number) | number, contractAddresses: {registry: string}}}
   */
  getRNSOptions () {
    const configuration = this.configurationProvider.getConfigurationObject();
    return {
      networkId: this.networkController.store.getState().networkId,
      contractAddresses: {
        registry: configuration.rns.contracts.rns,
      },
    };
  }

  /**
   * Get the address of a given domain and chain. If chainId is not provided, it resolves current blockchain address.
   * @param domainName Domain to be resolved.
   * @param chainId Chain identifier listed in https://github.com/satoshilabs/slips/blob/master/slip-0044.md
   * @returns {Promise<string>} the address resolution
   */
  getDomainAddress (domainName, chainId) {
    domainName = this.addRskSuffix(domainName);
    return this.rnsJs.addr(domainName, chainId);
  }

  /**
   * Reverse lookup: Get the name of a given address.
   * @param address Address to be resolved.
   * @returns {Promise<string>} Domain or subdomain associated to the given address.
   */
  getAddressDomain (address) {
    return this.rnsJs.reverse(address);
  }

  /**
   * Set address resolution of a given domain using the AbstractAddrResolver interface.
   * @param domainName Domain to set resolution.
   * @param address Address to be set as the resolution of the given domain
   * @returns {Promise<>} TransactionReceipt
   */
  setAddressToDomain (domainName, address) {
    domainName = this.addRskSuffix(domainName);
    return this.rnsJs.setAddr(domainName, address);
  }

  /**
   * Set resolver of a given domain.
   * @param domainName Domain to set resolver.
   * @param resolver Address to be set as the resolver of the given domain
   * @returns {Promise<>} TransactionReceipt
   */
  setDomainResolver (domainName, resolver) {
    domainName = this.addRskSuffix(domainName);
    return this.rnsJs.setResolver(domainName, resolver);
  }

  /**
   * Check if given domain is available or if there is any availability for the given label.
   * @param domainName Domain or label to check availability.
   * @returns {Promise<boolean | string[]>} true if the domain is available, false if not,
   * or an array of available domains under possible TLDs if the parameter is a label
   */
  isDomainAvailable (domainName) {
    domainName = this.addRskSuffix(domainName);
    return this.rnsJs.available(domainName);
  }

  /**
   * Checks if the given label subdomain is available under the given domain tree.
   * @param domainName Parent .rsk domain. For example, wallet.rsk
   * @param subdomain Subdomain whose availability should be checked. For example, alice
   * @returns {Promise<boolean>} true if available, false if not
   */
  isSubdomainAvailable (domainName, subdomain) {
    domainName = this.addRskSuffix(domainName);
    return this.rnsJs.subdomains.available(domainName, subdomain);
  }

  /**
   * Creates a new subdomain under the given domain tree if it is available.
   * Precondition: the sender should be the owner of the parent domain.
   * @param domainName Parent .rsk domain. For example, wallet.rsk
   * @param subdomain Subdomain to register. For example, alice
   * @param ownerAddress The new owner’s address
   * @param parentOwnerAddress the parent domain owner address
   * @returns {Promise<>}
   */
  setSubdomainOwner (domainName, subdomain, ownerAddress, parentOwnerAddress) {
    domainName = this.addRskSuffix(domainName);
    if (!ownerAddress && !parentOwnerAddress) {
      return Promise.reject('You need to specify ownerAddress or parentOwnerAddress');
    } else if (!ownerAddress) {
      ownerAddress = parentOwnerAddress;
    }
    const node = namehash(domainName);
    const label = web3Utils.sha3(subdomain);
    const transactionListener = this.send(this.rnsContractInstance, 'setSubnodeOwner', [node, label, ownerAddress])
    transactionListener.transactionConfirmed()
      .then(transactionReceipt => {
        let subdomains = this.getSubdomains(domainName);
        const foundSubdomain = subdomains.find(sd => sd.name === subdomain);
        if (foundSubdomain) {
          // existent subdomain
          if (ownerAddress === rns.zeroAddress) {
            // deleting subdomain
            subdomains = subdomains.filter(sd => sd.name !== subdomain);
          } else {
            // updating subdomain
            foundSubdomain.ownerAddress = ownerAddress;
          }
        } else {
          // new subdomain
          subdomains.push({
            domainName,
            name: subdomain,
            ownerAddress,
            parentOwnerAddress,
          });
        }
        this.updateSubdomains(domainName, subdomains);
      }).catch(transactionReceiptOrError => {
      console.log('Transaction failed', transactionReceiptOrError);
    });
    return Promise.resolve(transactionListener.id);
  }

  /**
   * Creates a new subdomain under the given domain tree if it is available, and sets its resolution if addr is provided.
   * @param domainName Parent .rsk domain. For example, wallet.rsk
   * @param subdomain Subdomain to register. For example, alice
   * @param ownerAddress The owner of the new subdomain. If not provided, the address who executes the tx will be the owner
   * @param parentOwnerAddress The address to be set as resolution of the new subdomain
   *
   * If addr is not provided, no resolution will be set
   * If owner is not provided, the sender will be set as the new owner
   * If owner and addr are provided and owner is equals to the sender, two txs will be sent.
   * If owner and addr are provided but owner is different from the sender, then three txs will be sent.
   *
   * @returns {Promise<>} TransactionReceipt of the latest transaction
   */
  createSubdomain (domainName, subdomain, ownerAddress, parentOwnerAddress) {
    this.store.pendingSubdomainsActions.push({
      domainName: domainName,
      subdomain: subdomain,
      action: 'add',
    });
    return this.setSubdomainOwner(domainName, subdomain, ownerAddress, parentOwnerAddress);
  }

  /**
   * Deletes a subdomain, it sets the default address as the owner of the subdomain to release it.
   * @param domainName the parent domain name
   * @param subdomain the subdomain name
   * @returns {Promise} containing the transaction listener id to track this operation.
   */
  deleteSubdomain (domainName, subdomain) {
    this.store.pendingSubdomainsActions.push({
      domainName: domainName,
      subdomain: subdomain,
      action: 'delete',
    });
    return this.setSubdomainOwner(domainName, subdomain, rns.zeroAddress, this.address);
  }

  deletePendingSubdomain (domainName, subdomain) {
    return new Promise((resolve, reject) => {
      domainName = this.addRskSuffix(domainName);
      const index = this.store.pendingSubdomainsActions.findIndex((e) => e.domainName === domainName && e.subdomain === subdomain);
      if (index >= 0) {
        this.store.pendingSubdomainsActions.splice(index, 1);
      }
      resolve();
    });
  }

  /**
   * Gets the subdomains under a domain name
   * @param domainName the domain name to query
   * @returns the subdomains array
   */
  getSubdomains (domainName) {
    domainName = this.addRskSuffix(domainName);
    const pendingSubdomainsActions = this.store.pendingSubdomainsActions;
    const subdomainsLst = [];
    const state = this.getStateForContainer(rns.storeContainers.register);
    // Here we need to add the subdomains that still pending to add
    pendingSubdomainsActions.map(subdomain => {
      if (subdomain.action === 'add' && subdomain.domainName === domainName) {
        subdomainsLst.push({
          action: subdomain.action,
          domainName: subdomain.domainName,
          name: subdomain.subdomain,
          ownerAddress: '',
          parentOwnerAddress: '',
        });
      }
    });
    if (!state || !state.domains || !state.domains[domainName] || !state.domains[domainName].subdomains) {
      return subdomainsLst;
    }
    state.domains[domainName].subdomains.map(subdomain => {
      const subdomainPending = pendingSubdomainsActions.find(subdomainPend => subdomainPend.domainName === domainName && subdomainPend.subdomain === subdomain.name);
      subdomain.action = subdomainPending ? subdomainPending.action : '';
      subdomainsLst.push(subdomain);
    });
    return subdomainsLst;
  }

  /**
   * Gets the domain by name with the details.
   * @param domainName to query
   * @returns the domain object
   */
  getDomainForUi (domainName) {
    const domain = this.getDomain(domainName);
    if (!domain.details && !domain.registration) {
      return new Promise((resolve, reject) => {
        this.container.resolver.getDomainDetails(domainName)
          .then(domainDetails => {
            domain.details = domainDetails;
            this.updateDomains(domain);
            resolve(domain);
          }).catch(error => reject(error));
      });
    }
    return Promise.resolve(domain);
  }

  /**
   * Gets the domains for the ui with their details.
   * @returns the domains array
   */
  getDomainsForUi () {
    const domains = this.getDomains();
    const domainsToUpdateDetails = [];
    domains.forEach(domain => {
      if (!domain.details && !domain.registration) {
        domainsToUpdateDetails.push(domain);
      }
    });
    if (domainsToUpdateDetails.length > 0) {
      return new Promise((resolve, reject) => {
        const detailRequests = [];
        domainsToUpdateDetails.forEach(domain => {
          detailRequests.push(this.container.resolver.getDomainDetails(domain.name));
        });
        Promise.all(detailRequests).then(results => {
          results.forEach(result => {
            const domain = domains.find(domain => domain.name === result.name);
            domain.details = result;
            this.updateDomains(domain);
          });
          resolve(domains);
        }).catch(error => reject(error));
      });
    } else {
      return Promise.resolve(domains);
    }
  }

  /**
   * Gets a stored domain by name
   * @param domainName
   * @returns {*}
   */
  getDomain (domainName) {
    const domains = this.getDomains();
    return domains.find(domain => domain.name === domainName);
  }

  /**
   * Gets the domains for the selected address
   * @returns the domains array
   */
  getDomains () {
    const domains = [];
    const state = this.getStateForContainer(rns.storeContainers.register);
    if (!state || !state.domains) {
      return domains;
    }
    Object.keys(state.domains).forEach(domainName => {
      domains.push(state.domains[domainName]);
    })
    return domains;
  }

  /**
   * Creates a new domain object to populate
   * @param domainName the domain name for this object
   * @returns {{subdomains: [], name: *, registration: {readyToRegister: boolean, yearsToRegister: null, secret: null, rifCost: null}, details: null, status: string}}
   */
  createNewDomainObject (domainName) {
    return {
      name: domainName,
      subdomains: [],
      registration: {
        secret: null,
        yearsToRegister: null,
        rifCost: null,
        readyToRegister: false,
        commitment: null,
      },
      status: 'pending',
      details: null,
    }
  }

  /**
   * Exposes the updateDomains method to the ui
   * @param domain
   * @returns {Promise<void>}
   */
  updateDomainsForUi (domain) {
    return Promise.resolve(this.updateDomains(domain));
  }

  /**
   * Updates the stored domains
   * @param domain to add
   */
  updateDomains (domain) {
    const state = this.getStateForContainer(rns.storeContainers.register);
    if (!state.domains) {
      state.domains = {};
    }
    state.domains[domain.name] = domain;
    this.updateStateForContainer(rns.storeContainers.register, state);
  }

  /**
   * Deletes the domainName from storage
   * @param domainName to delete
   */
  deleteDomain (domainName) {
    const state = this.getStateForContainer(rns.storeContainers.register);
    if (state.domains && state.domains[domainName]) {
      delete state.domains[domainName];
      this.updateStateForContainer(rns.storeContainers.register, state);
    }
  }

  /**
   * Method to get the subdomains under a domain name, exposes the getSubdomains method
   * @param domainName the domain name to query
   * @returns the subdomains under the domain name
   */
  getSubdomainsForDomain (domainName) {
    domainName = this.addRskSuffix(domainName);
    return Promise.resolve(this.getSubdomains(domainName));
  }

  /**
   * Updates the subdomains under a domain name
   * @param domainName the domain to update
   * @param subdomains the subdomains under the domain name
   */
  updateSubdomains (domainName, subdomains) {
    domainName = this.addRskSuffix(domainName);
    let state = this.getStateForContainer(rns.storeContainers.register);
    if (!state) {
      state = {
        domains: [],
      };
    }
    if (!state.domains) {
      state.domains = {};
    }
    if (!state.domains[domainName]) {
      state.domains[domainName] = {
        subdomains: [],
      };
    }
    if (!state.domains[domainName].subdomains) {
      state.domains[domainName].subdomains = [];
    }
    state.domains[domainName].subdomains = subdomains;
    this.updateStateForContainer(rns.storeContainers.register, state);
  }

  onConfigurationUpdated (configuration) {
    super.onConfigurationUpdated(configuration);
    this.rnsJs = new RNS(this.web3, this.getRNSOptions());
  }

}
