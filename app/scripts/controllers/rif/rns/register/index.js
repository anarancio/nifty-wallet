import FIFSRegistrar from '../abis/FIFSRegistrar.json'
import RnsJsDelegate from '../rnsjs-delegate'
import web3Utils from 'web3-utils';
import {generateRandomSecret, numberToUint32, utf8ToHexString} from '../../utils/rns'
import {rns} from '../../constants'

/**
 * This is a delegate to manage all the RNS register operations.
 */
export default class RnsRegister extends RnsJsDelegate {

  constructor (props) {
    super(props);
    this.checkInitialPendingDomains();
  }

  initialize () {
    const configuration = this.configurationProvider.getConfigurationObject();
    this.fifsAddrRegistrarAddress = configuration.rns.contracts.fifsAddrRegistrar;
    this.fifsAddrRegistrarInstance = this.web3.eth.contract(FIFSRegistrar).at(this.fifsAddrRegistrarAddress);
  }

  onConfigurationUpdated (configuration) {
    super.onConfigurationUpdated(configuration);
    this.fifsAddrRegistrarAddress = configuration.rns.contracts.fifsAddrRegistrar;
    this.fifsAddrRegistrarInstance = this.web3.eth.contract(FIFSRegistrar).at(this.fifsAddrRegistrarAddress);
  }

  buildApi () {
    const rnsJsApi = super.buildApi();
    return {
      requestRegistration: this.bindOperation(this.requestRegistration, this),
      finishRegistration: this.bindOperation(this.finishRegistration, this),
      canFinishRegistration: this.bindOperation(this.canFinishRegistration, this),
      getDomainCost: this.bindOperation(this.getDomainCost, this),
      ...rnsJsApi,
    }
  }

  /**
   * Make a request for registration on the domainName for an amount of years.
   * @param domainName the Domain to register.
   * @param yearsToRegister the amount of years to register.
   * @returns {Promise<string>} commitment that helps is to check if you can finish registration or you still have to wait.
   */
  requestRegistration (domainName, yearsToRegister) {
    const cleanDomainName = this.cleanDomainFromRskSuffix(domainName);
    const domainHash = web3Utils.sha3(cleanDomainName);
    const secret = generateRandomSecret();
    return new Promise((resolve, reject) => {
      this.getDomainCost(cleanDomainName, yearsToRegister)
        .then(rifCost => {
          this.call(this.fifsAddrRegistrarInstance, 'makeCommitment', [domainHash, this.address, secret])
            .then(commitment => {
              const domain = this.createNewDomainObject(domainName);
              domain.registration.rifCost = rifCost.toString();
              domain.registration.yearsToRegister = yearsToRegister;
              domain.registration.secret = secret;
              domain.registration.commitment = commitment;
              this.updateDomain(domain);
              console.debug('Commitment received', commitment);
              const transactionListener = this.send(this.fifsAddrRegistrarInstance, 'commit', [commitment]);
              transactionListener.transactionConfirmed()
                .then(result => {
                  this.startWatchingCommitment(domainName, commitment, result.address, result.network);
              }).catch(result => {
                console.debug('Transaction Failed', result);
                this.deleteDomain(domainName, result.address, result.network);
              });
              resolve({
                commitment,
                transactionListenerId: transactionListener.id,
              });
            }).catch(error => reject(error));
        }).catch(error => reject(error));
    });
  }

  checkInitialPendingDomains () {
    const domains = this.getDomains();
    domains.forEach(domain => {
      // this means that we have pending commitments that are not being watched, this can be because the browser was closed.
      if (domain.registration && domain.registration.status === 'pending') {
        this.startWatchingCommitment(domain.name, domain.registration.commitment);
      }
    })
  }

  /**
   * Watchs for commitment reveal status for a domain and updates the domain after is ready to reveal.
   * @param domainName the domainName to check
   * @param commitment the commitment to check for reveal
   * @param address
   * @param network
   */
  startWatchingCommitment (domainName, commitment, address, network) {
    let time = 0;
    const interval = setInterval(async () => {
      const domain = this.getDomain(domainName, address, network);
      if (domain && domain.registration) {
        const readyToRegister = await this.canFinishRegistration(commitment);
        if (readyToRegister) {
          domain.registration.status = 'ready';
          this.updateDomain(domain, address, network);
          clearInterval(interval);
        }
      } else {
        time += rns.domainRegister.secondsToUpdateCommitment * 1000;
      }
      if (time >= rns.domainRegister.minutesWaitingForCommitmentReveal * 60 * 1000) {
        this.deleteDomain(domain.name, address, network);
        clearInterval(interval);
      }
    }, rns.domainRegister.secondsToUpdateCommitment * 1000);
  }

  /**
   * Calculates the rif cost for a domain
   * It uses the formula here: https://github.com/rnsdomains/rns-rskregistrar#name-price
   * @param domainName the domain name to ask for
   * @param yearsToRegister the amount of years to ask
   * @returns registration cost in RIF (wei)
   */
  getDomainCost (domainName, yearsToRegister) {
    const cleanDomainName = this.cleanDomainFromRskSuffix(domainName);
    return this.call(this.fifsAddrRegistrarInstance, 'price', [cleanDomainName, 0, yearsToRegister]);
  }

  /**
   * This method checks if we can invoke finishRegistration, because that has to be invoked after some time so we can
   * check when we can invoke that method with these call.
   * @param commitment the commitment hash obtained on the requestRegistration call.
   * @returns {Promise<boolean>} a boolean indicating that we can reveal the commit or not.
   */
  canFinishRegistration (commitment) {
    return new Promise((resolve, reject) => {
      this.call(this.fifsAddrRegistrarInstance, 'canReveal', [commitment])
        .then(canReveal => {
          console.debug('Can Reveal Commit?', canReveal);
          resolve(canReveal);
        }).catch(error => reject(error));
    })
  }

  /**
   * Finish the domain registration using the data stored with the domainName key on the requestRegistration operation.
   * @param domainName the Domain to be registered.
   * is used to do something after the user submits the operation and the domain it's registered
   * @returns {Promise<void>}
   */
  finishRegistration (domainName) {
    const cleanDomainName = this.cleanDomainFromRskSuffix(domainName);
    const pendingDomain = this.getDomain(domainName);
    if (pendingDomain) {
      return new Promise((resolve, reject) => {
        this.isDomainAvailable(domainName).then(available => {
          if (available) {
            const registerInformation = pendingDomain.registration;
            if (registerInformation) {
              const rifCost = registerInformation.rifCost;
              const secret = registerInformation.secret;
              const durationBN = this.web3.toBigNumber(registerInformation.yearsToRegister);
              const data = this.getAddrRegisterData(cleanDomainName, this.address, secret, durationBN, this.address);
              const transactionListener = this.send(this.rifContractInstance, 'transferAndCall', [this.fifsAddrRegistrarAddress, rifCost, data]);
              pendingDomain.registration.status = 'finishing';
              transactionListener.transactionConfirmed()
                .then(result => {
                  console.debug('Transaction success', result);
                  pendingDomain.registration.status = 'finished';
                  this.container.resolver.getDomainDetails(domainName).then(domainDetails => {
                    pendingDomain.details = domainDetails;
                    pendingDomain.status = 'active';
                    this.updateDomain(pendingDomain, result.address, result.network);
                  });
                }).catch(result => {
                console.debug('Transaction failed', result);
                pendingDomain.registration.status = 'pending';
                this.updateDomain(pendingDomain, result.address, result.network);
              });
              return resolve(transactionListener.id);
            } else {
              return reject('Invalid domainName, you need to use the same as the first request');
            }
          } else {
            this.deleteDomain(domainName);
            return reject('This domain is not available anymore, probably someone else already claim this');
          }
        });
      });
    } else {
      return Promise.reject('You dont have any registration pending, you need to request registration first');
    }
  }

  /**
   * registration with rif transferAndCall encoding
   * @param {string} name to register
   * @param {address} owner of the new name
   * @param {hex} secret of the commit
   * @param {BN} duration to register in years
   */
  getAddrRegisterData = (name, owner, secret, duration, addr) => {
    // 0x + 8 bytes
    const dataSignature = '0x5f7b99d5';

    // 20 bytes
    const dataOwner = owner.toLowerCase().slice(2);

    // 32 bytes
    let dataSecret = secret.slice(2);
    const padding = 64 - dataSecret.length;
    for (let i = 0; i < padding; i += 1) {
      dataSecret += '0';
    }

    // 32 bytes
    const dataDuration = numberToUint32(duration);

    // variable length
    const dataName = utf8ToHexString(name);

    // 20 bytes
    const dataAddr = addr.toLowerCase().slice(2);

    return `${dataSignature}${dataOwner}${dataSecret}${dataDuration}${dataAddr}${dataName}`;
  };

  /**
   * registration with rif transferAndCall encoding
   * @param {string} name to register
   * @param {address} owner of the new name
   * @param {hex} secret of the commit
   * @param {BN} duration to register in years
   */
  getRegisterData (name, owner, secret, duration) {
    // 0x + 8 bytes
    const dataSignature = '0xc2c414c8';

    // 20 bytes
    const dataOwner = owner.toLowerCase().slice(2);

    // 32 bytes
    const dataSecret = secret.slice(2);

    // 32 bytes
    const dataDuration = numberToUint32(duration);

    // variable length
    const dataName = utf8ToHexString(name);

    return `${dataSignature}${dataOwner}${dataSecret}${dataDuration}${dataName}`;
  }

}
