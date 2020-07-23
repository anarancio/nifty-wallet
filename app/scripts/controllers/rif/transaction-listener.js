import EventEmitter from 'safe-event-emitter'
import {global} from './constants'
import createId from '../../lib/random-id'

/**
 * Listener for pending mining transactions to handle events
 */
export class TransactionListener extends EventEmitter {
  constructor (props) {
    super();
    this.web3 = props.web3;
    this.transactionId = props.transactionId;
    this.transactionHash = props.transactionHash;
    this.transactionController = props.transactionController;
    this.confirmed = false;
    this.currentListeners = 0;
    this.afterClean = props.afterClean;
    this.address = props.address;
    this.network = props.network;
    this.id = createId();
  }

  /**
   * Handles the error when the user submits the operation and for some reason it fails.
   * @param error
   */
  error (error) {
    this.emit('submitError', error);
  }

  /**
   * Start listening for mined transactions to filter by our transaction if it's available
   * If the transaction is there we get the receipt and we emit events depending on what the result is.
   * @returns {TransactionListener}
   */
  listen () {
    this.transactionController.on(`tx:status-update`, (txId, status) => {
      if (this.transactionId === txId && !this.confirmed) {
        this.confirmed = true;
        if (status === 'confirmed' || status === 'failed') {
          this.getTransactionReceipt().then(transactionReceipt => {
            if (transactionReceipt &&
              (transactionReceipt.status === true || transactionReceipt.status === global.TRANSACTION_STATUS_OK)) {
              this.emit('transactionSuccess', transactionReceipt);
            } else {
              this.emit('transactionFailed', transactionReceipt);
            }
          });
        }
      }
    });
    return this;
  }

  /**
   * Gets the transaction receipt if it's available at the time.
   * @returns {Promise<TransactionReceipt>}
   */
  getTransactionReceipt () {
    if (this.confirmed) {
      return new Promise((resolve, reject) => {
        this.web3.eth.getTransactionReceipt(this.transactionHash, (error, transactionReceipt) => {
          if (error) {
            reject(error);
          }
          resolve(transactionReceipt);
        });
      });
    }
    return Promise.reject('The transaction is not mined yet');
  }

  /**
   * It returns a promise that resolves when the transaction is successfully confirmed and the status is 0x1, otherwise it rejects.
   * In both cases it retrieves the transaction receipt or an error if the submission fails.
   * @returns {Promise<TransactionReceipt>}
   */
  transactionConfirmed () {
    this.currentListeners++;
    return new Promise((resolve, reject) => {
      this.on('transactionSuccess', (transactionReceipt) => {
        this.currentListeners--;
        this.shouldClean();
        resolve({
          address: this.address,
          network: this.network,
          transactionReceipt,
        });
      });
      this.on('transactionFailed', (transactionReceipt) => {
        this.currentListeners--;
        this.shouldClean();
        reject({
          address: this.address,
          network: this.network,
          transactionReceipt,
        });
      });
      this.on('submitError', (error) => {
        this.currentListeners--;
        this.shouldClean();
        if (error && error.message && error.message.indexOf('User denied transaction signature') !== -1) {
          // the user rejected the operation
          reject({
            address: this.address,
            network: this.network,
            error,
            rejectedOperation: true,
          });
        } else {
          reject({
            address: this.address,
            network: this.network,
            error,
          });
        }
      });
    });
  }

  /**
   * This is an internal method to clean memory when all the listeners already received the confirmation.
   */
  shouldClean () {
    if (this.currentListeners <= 0) {
      this.clean();
    }
  }

  /**
   * Clean listener from memory
   */
  clean () {
    this.removeAllListeners();
    this.afterClean(this.id);
  }
}
