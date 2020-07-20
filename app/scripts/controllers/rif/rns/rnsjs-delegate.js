import RnsDelegate from './rns-delegate'
import RNS from '@rsksmart/rns'
import {rns} from '../constants'
import {namehash} from '@rsksmart/rns/lib/utils'
import web3Utils from 'web3-utils'

/**
 * This class encapsulates all the RNSJS logic, it initializes rnsjs library and uses it as a wrapper.
 */
export default class RnsJsDelegate extends RnsDelegate {
  constructor (props) {
    super(props);
    this.rnsJs = new RNS(this.web3, this.getRNSOptions());
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

  setStatusSubdomain (domainName, subdomain, status, address, network) {
    domainName = this.addRskSuffix(domainName);
    const subdomains = this.getSubdomains(domainName, address, network);
    const foundSubdomain = subdomains.find(sd => sd.name === subdomain);
    if (foundSubdomain) {
      foundSubdomain.status = status;
    } else {
      // new subdomain
      subdomains.push(this.createNewSubdomainObject(domainName, subdomain, status));
    }
    this.updateSubdomains(domainName, subdomains, address, network);
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
      .then(result => {
        let subdomains = this.getSubdomains(domainName, result.address, result.network);
        const foundSubdomain = subdomains.find(sd => sd.name === subdomain);
        if (foundSubdomain) {
          // existent subdomain
          if (ownerAddress === rns.zeroAddress) {
            // deleting subdomain
            subdomains = subdomains.filter(sd => sd.name !== subdomain);
          } else {
            // updating subdomain
            foundSubdomain.ownerAddress = ownerAddress;
            foundSubdomain.parentOwnerAddress = parentOwnerAddress;
            // Just update the status to none, and dont call the setStatusSubdomain because otherwise we're going to call twiche the getSubdomains and is redundant
            foundSubdomain.status = '';
          }
        }
        this.updateSubdomains(domainName, subdomains, result.address, result.network);
      }).catch(result => {
        let subdomains = this.getSubdomains(domainName, result.address, result.network);
        const foundSubdomain = subdomains.find(sd => sd.name === subdomain);
        if (foundSubdomain) {
          subdomains = subdomains.filter(sd => sd.name !== subdomain);
          this.updateSubdomains(domainName, subdomains, result.address, result.network);
        }
      console.log('Transaction failed', result);
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
    this.setStatusSubdomain(domainName, subdomain, 'add');
    return this.setSubdomainOwner(domainName, subdomain, ownerAddress, parentOwnerAddress);
  }

  /**
   * Deletes a subdomain, it sets the default address as the owner of the subdomain to release it.
   * @param domainName the parent domain name
   * @param subdomain the subdomain name
   * @param address
   * @returns {Promise} containing the transaction listener id to track this operation.
   */
  deleteSubdomain (domainName, subdomain, address = this.address) {
    this.setStatusSubdomain(domainName, subdomain, 'delete');
    return this.setSubdomainOwner(domainName, subdomain, rns.zeroAddress, address);
  }

  /**
   * Gets the subdomains under a domain name
   * @param domainName the domain name to query
   * @param address
   * @param network
   * @returns the subdomains array
   */
  getSubdomains (domainName, address, network) {
    domainName = this.addRskSuffix(domainName);
    const subdomainsLst = [];
    const state = this.getStateForContainer(rns.storeContainers.register, address, network);
    if (!state || !state.domains || !state.domains[domainName] || !state.domains[domainName].subdomains) {
      return subdomainsLst;
    }
    return state.domains[domainName].subdomains;
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
            this.updateDomain(domain);
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
            this.updateDomain(domain);
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
   * @param address
   * @param network
   * @returns {*}
   */
  getDomain (domainName, address, network) {
    const domains = this.getDomains(address, network);
    return domains.find(domain => domain.name === domainName);
  }

  /**
   * Gets the domains for the selected address
   * @param address
   * @param network
   * @returns the domains array
   */
  getDomains (address, network) {
    const domains = [];
    const state = this.getStateForContainer(rns.storeContainers.register, address, network);
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
      pendingActions: {
        chainAddresses: [],
        pendingSetResolver: false,
      },
      registration: {
        secret: null,
        yearsToRegister: null,
        rifCost: null,
        readyToRegister: false,
        commitment: null,
        status: 'pending',
      },
      status: 'pending',
      details: null,
    }
  }

  createNewSubdomainObject (domainName, subdomain, status) {
    return {
      domainName,
      name: subdomain,
      ownerAddress: '',
      parentOwnerAddress: '',
      status,
    }
  }

  /**
   * Exposes the updateDomains method to the ui
   * @param domain
   * @returns {Promise<void>}
   */
  updateDomainsForUi (domain) {
    return Promise.resolve(this.updateDomain(domain));
  }

  /**
   * Updates the stored domains
   * @param address
   * @param network
   * @param domain to add
   */
  updateDomain (domain, address, network) {
    const state = this.getStateForContainer(rns.storeContainers.register, address, network);
    if (!state.domains) {
      state.domains = {};
    }
    state.domains[domain.name] = domain;
    this.updateStateForContainer(rns.storeContainers.register, state, address, network);
  }

  /**
   * Deletes the domainName from storage
   * @param address
   * @param network
   * @param domainName to delete
   */
  deleteDomain (domainName, address, network) {
    const state = this.getStateForContainer(rns.storeContainers.register, address, network);
    if (state.domains && state.domains[domainName]) {
      delete state.domains[domainName];
      this.updateStateForContainer(rns.storeContainers.register, state, address, network);
    }
  }

  /**
   * Method to get the subdomains under a domain name, exposes the getSubdomains method
   * @param domainName the domain name to query
   * @param address
   * @param network
   * @returns the subdomains under the domain name
   */
  getSubdomainsForDomain (domainName, address, network) {
    domainName = this.addRskSuffix(domainName);
    return Promise.resolve(this.getSubdomains(domainName, address, network));
  }

  /**
   * Updates the subdomains under a domain name
   * @param domainName the domain to update
   * @param subdomains the subdomains under the domain name
   * @param address
   * @param network
   */
  updateSubdomains (domainName, subdomains, address, network) {
    domainName = this.addRskSuffix(domainName);
    let state = this.getStateForContainer(rns.storeContainers.register, address, network);
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
    this.updateStateForContainer(rns.storeContainers.register, state, address, network);
  }

  onConfigurationUpdated (configuration) {
    super.onConfigurationUpdated(configuration);
    this.rnsJs = new RNS(this.web3, this.getRNSOptions());
  }

}
