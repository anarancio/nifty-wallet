const nodeify = require('../../../lib/nodeify')

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
  buildApi () {}

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
   * @param gas optional, if you want to specify the gas for this transaction
   * @returns a Promise with the result of the transaction
   */
  send (contractInstance, methodName, parameters, transactionOptions = {from: this.address}) {
    if (contractInstance && methodName) {
      if (contractInstance[methodName]) {
        return new Promise((resolve, reject) => {
          contractInstance[methodName].sendTransaction(...parameters, transactionOptions, (error, result) => {
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
   * Returns the domain name without .rsk, this is because the top level call has for example infuy.rsk but some
   * contracts are working only without the .rsk, we have this method to clear that.
   * @param domainName the domain name to clear.
   * @returns the cleared domain name
   */
  cleanDomainFromRskPrefix (domainName) {
    return (domainName && domainName.indexOf('.rsk') !== -1) ? domainName.replace('.rsk', '') : domainName;
  }
}