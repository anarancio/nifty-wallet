import {TransactionListener} from '../transaction-listener'
const nodeify = require('../../../lib/nodeify')
import extend from 'xtend'

/**
 * Delegate class to encapsulate all the logic related to delegates.
 */
export default class RnsDelegate {
  constructor (props) {
    this.web3 = props.web3;
    this.preferencesController = props.preferencesController;
    this.networkController = props.networkController;
    this.transactionController = props.transactionController;
    this.rifConfig = props.rifConfig;
    this.rnsContractInstance = props.rnsContractInstance;
    this.rifContractInstance = props.rifContractInstance;
    this.address = props.address;
    this.store = props.store;
    this.transactionListeners = {};
    this.initialize();
  }

  /**
   * This is executed by the end of the constructor to initialize everything, a child can override this.
   */
  initialize () {}

  /**
   * This method is meant to expose operations to the ui. Basically here we have an object returned that contains keys
   * with the method names and the binding to the implementation on the values. This must be overwritten by the child.
   *
   * NOTE: all the operations have to return a Promise, if the operation doesn't return anything you can use
   * Promise.resolve() or Promise.reject()
   *
   * Example: {
   *   doSomething: this.bindOperation(this.doSomething, this),
   * }
   */
  buildApi () {
    return {
      getUnapprovedTransactions: this.bindOperation(this.getUnapprovedTransactions, this),
      getSelectedAddress: this.bindOperation(this.getSelectedAddress, this),
      waitForTransactionListener: this.bindOperation(this.waitForTransactionListener, this),
    }
  }

  /**
   * Method to get the selected address to expose it to the ui.
   * @returns selected address
   */
  getSelectedAddress () {
    return Promise.resolve(this.address);
  }

  /**
   * Makes the operation callback available
   * @param operation the function reference
   * @param member the function container
   * @returns {function(...[*]=)}
   */
  bindOperation (operation, member) {
    return nodeify(operation, member);
  }

  /**
   * Util method to invoke call transactions with web3
   * @param contractInstance the contract instance to invoke
   * @param methodName the contract method to invoke
   * @param parameters the method parameters array
   * @returns a Promise with the result of the transaction
   */
  call (contractInstance, methodName, parameters) {
    if (contractInstance && methodName) {
      if (contractInstance[methodName]) {
        return new Promise((resolve, reject) => {
          contractInstance[methodName].call(...parameters, (error, result) => {
            if (error) {
              reject(error);
            }
            resolve(result);
          })
        });
      }
      return Promise.reject('Invalid method for contract instance');
    }
    return Promise.reject('Contract and Method is needed');
  }

  /**
   * Util method to invoke send transactions with web3
   * @param contractInstance the contract instance to invoke
   * @param methodName the contract method to invoke
   * @param parameters the method parameters array
   * @param transactionOptions optional, if you want to specify the gas for this transaction or another parameter
   * @returns a Promise that resolves with the listener to handle the transaction receipt after the
   * transaction is confirmed on the node.
   */
  send (contractInstance, methodName, parameters, transactionOptions = {from: this.address}) {
    if (contractInstance && methodName) {
      if (contractInstance[methodName]) {
        const transactionListener = new TransactionListener({
          web3: this.web3,
          transactionController: this.transactionController,
          afterClean: (transactionListenerId) => {
            delete this.transactionListeners[transactionListenerId];
          },
        });
        const transactionListenerId = transactionListener.id;
        contractInstance[methodName].sendTransaction(...parameters, transactionOptions, (error, transactionHash) => {
          if (error) {
            this.transactionListeners[transactionListenerId].error(error);
            this.transactionListeners[transactionListenerId].clean();
          } else {
            const pendingTransaction = this.getPendingTransactionByHash(transactionHash)
            this.transactionListeners[transactionListenerId].transactionId = pendingTransaction.id;
            this.transactionListeners[transactionListenerId].transactionHash = transactionHash;
            this.transactionListeners[transactionListenerId].listen();
          }
        });
        this.transactionListeners[transactionListenerId] = transactionListener;
        return this.transactionListeners[transactionListenerId];
      }
      throw new Error('Invalid method for contract instance');
    }
    throw new Error('Contract and Method is needed');
  }

  /**
   * Gets a pending transaction by hash, these transactions are those that are submitted
   * @param transactionHash
   * @returns the transaction
   */
  getPendingTransactionByHash (transactionHash) {
    const pendingTransactions = this.transactionController.txStateManager.getPendingTransactions(this.address);
    return pendingTransactions.find(transaction => transaction.hash === transactionHash);
  }

  /**
   * Waits for a transaction to be confirmed and then resolves the promise with the transaction receipt or an error.
   * @param transactionListenerId to listen
   * @returns {Promise<TransactionReceipt or Error>}
   */
  waitForTransactionListener (transactionListenerId) {
    return new Promise((resolve, reject) => {
      const listener = this.transactionListeners[transactionListenerId];
      if (listener) {
        listener.transactionConfirmed().then(transactionReceipt => {
          resolve(transactionReceipt);
        }).catch(transactionReceiptOrError => {
          reject(transactionReceiptOrError);
        });
      } else {
        reject('No listener found for this id' + transactionListenerId);
      }
    });
  }

  /**
   * Returns the domain name without .rsk, this is because the top level call has for example infuy.rsk but some
   * contracts are working only without the .rsk, we have this method to clear that.
   * @param domainName the domain name to clear.
   * @returns the cleared domain name
   */
  cleanDomainFromRskSuffix (domainName) {
    return (domainName && domainName.indexOf('.rsk') !== -1) ? domainName.replace('.rsk', '') : domainName;
  }

  /**
   * Returns the domain name with .rsk, this is because rns-js expects domains with .rsk suffix and the top level call
   * has for example infuy without the .rsk
   * @param domainName the domain name to change.
   * @returns the domain name with the rsk suffix
   */
  addRskSuffix (domainName) {
    return (domainName && domainName.indexOf('.rsk') === -1) ? (domainName + '.rsk') : domainName;
  }

  /**
   * Gets the unapproved transactions. Used to redirect a page to the confirmation page.
   * @returns the unapproved transactions array.
   */
  getUnapprovedTransactions () {
    return Promise.resolve(this.transactionController.txStateManager.getUnapprovedTxList());
  }

  /**
   * Updates the store state
   * @param newState
   */
  updateStoreState (newState) {
    this.store.putState(newState);
  }

  /**
   * Gets the store state
   * @returns the current state
   */
  getStoreState () {
    return this.store.getState();
  }

  /**
   * Gets the state of the container for the current selected address.
   * @param containerName
   * @returns the current container state
   */
  getStateForContainer (containerName) {
    return this.getStoreState() && this.getStoreState()[containerName] ? this.getStoreState()[containerName][this.address] : {};
  }

  /**
   * Updates the state for a container on the current selected address
   * @param containerName the container name
   * @param newState to update with
   */
  updateStateForContainer (containerName, newState) {
    let currentState = this.getStoreState();
    if (!currentState) {
      currentState = {};
    }
    if (!currentState[containerName]) {
      currentState[containerName] = {};
    }
    if (!currentState[containerName][[this.address]]) {
      currentState[containerName][[this.address]] = {};
    }
    currentState[containerName][[this.address]] = extend(currentState[containerName][[this.address]], newState);
    this.updateStoreState(currentState);
  }
}
