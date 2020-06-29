import {AbstractManager} from '../abstract-manager';
import {isRskNetwork} from '../utils/general';
import {NotifierOperations} from './operations';
import {NotifierSigningHandler} from './signing-handler';


export class NotifierManager extends AbstractManager {
  constructor (props) {
    super(props);
    this.configurationProvider = props.configurationProvider;
    this.keyringController = props.keyringController;
    this.signingHandler = new NotifierSigningHandler({
      transactionController: this.transactionController,
      address: this.address,
      keyringController: this.keyringController,
    });
    this.operations = new NotifierOperations({
      address: this.address,
      configurationProvider: this.configurationProvider,
      signingHandler: this.signingHandler,
    });
    this.apiKey = '';
  }
  async initializeNotifier () {
    if (this.unlocked && isRskNetwork(this.network.id)) {
      await this.signingHandler.initialize();
      const apiKey = await this.operations.onboarding();
      await this.operations.subscribe(apiKey);
      await this.afterInitialization();
      this.apiKey = apiKey;
    }
  };

  async afterInitialization () {}

  onUnlock () {
    super.onUnlock();
    this.initializeNotifier();
  }

  onNetworkChanged (network) {
    super.onNetworkChanged(network);
    this.initializeNotifier();
  }

  onConfigurationUpdated (configuration) {
    this.initializeNotifier();
  }

  onAddressChanged (address) {
    super.onAddressChanged(address);
    if (this.signingHandler) {
      this.signingHandler.updateAddress(address);
    }
    if (this.operations) {
      this.operations.updateAddress(address);
    }
    this.initializeNotifier();
  }
  bindApi () {
    return {}
  }
}
