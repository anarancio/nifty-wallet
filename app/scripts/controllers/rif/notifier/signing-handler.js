import web3Utils from 'web3-utils';
import {Wallet} from 'ethers';

/**
 * Custom signing handler for rif notifier using our sign controller.
 */
export class NotifierSigningHandler {
  constructor (props) {
    this.address = web3Utils.toChecksumAddress(props.address);
    this.keyringController = props.keyringController;
    this.transactionController = props.transactionController;
  }

  async initialize () {
    const privateKey = await this.keyringController.exportAccount(this.address);
    this.wallet = new Wallet(privateKey);
  }

  async updateAddress (newAddress) {
    this.address = web3Utils.toChecksumAddress(newAddress);
    await this.initialize();
  }

  async offChainSign (plainOrByteMessage) {
    return await this.wallet.signMessage(plainOrByteMessage);
  }
}
