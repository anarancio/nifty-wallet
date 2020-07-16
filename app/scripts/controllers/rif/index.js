import RnsManager from './rns'
import Web3 from 'web3'
import ComposableObservableStore from './../../lib/ComposableObservableStore'
import {LuminoManager} from './lumino';
import {bindOperation, isRskNetwork} from './utils/general';
import {RifConfigurationProvider} from './configuration';
import {global} from './constants';
import {NotifierManager} from './notifier';

/**
 * RIF Controller
 *
 * This controller hold's all the business logic for RIF
 * Any operation related to RIF like rns contracts should be here.
 *
 * Props:
 *   preferenceController: the preference controller that has all the preferences of the user
 *   networkController: this is needed to create a new instance of web3 and get all the network info
 *   metamaskStore and memoryStore: this 2 stores holds all the stores on the app, this is to register the RIF store into the application stores.
 *
 */
export default class RifController {
  constructor (props) {
    if (!props.metamaskController) {
      throw new Error('MetamaskController has to be present');
    }
    this.unlocked = false;
    this.metamaskController = props.metamaskController;
    this.web3 = new Web3(this.metamaskController.networkController._provider);

    const initState = props.initState || {};

    const currentNetworkId = this.metamaskController.networkController.getNetworkState() === 'loading' ? global.networks.main :
      this.metamaskController.networkController.getNetworkState();

    this.configurationProvider = new RifConfigurationProvider({
      initState: initState.RifConfigurationProvider,
      networkController: this.metamaskController.networkController,
      preferencesController: this.metamaskController.preferencesController,
    });

    this.configurationProvider.loadConfiguration(currentNetworkId);

    this.notifierManager = new NotifierManager({
      configurationProvider: this.configurationProvider,
      keyringController: this.metamaskController.keyringController,
    });

    this.rnsManager = new RnsManager({
      initState: initState.RnsManager,
      configurationProvider: this.configurationProvider,
      preferencesController: this.metamaskController.preferencesController,
      networkController: this.metamaskController.networkController,
      transactionController: this.metamaskController.txController,
      web3: this.web3,
      notifierManager: this.notifierManager,
    });

    this.luminoManager = new LuminoManager({
      initState: initState.LuminoManager,
      configurationProvider: this.configurationProvider,
      web3: this.web3,
      keyringController: this.metamaskController.keyringController,
      preferencesController: this.metamaskController.preferencesController,
      networkController: this.metamaskController.networkController,
      transactionController: this.metamaskController.txController,
    });

    this.store = new ComposableObservableStore(props.initState, {
      RnsManager: this.rnsManager.store,
      LuminoManager: this.luminoManager.store,
      RifConfigurationProvider: this.configurationProvider.store,
    });

    this.metamaskController.preferencesController.store.subscribe(updatedPreferences => this.preferencesUpdated(updatedPreferences));
    this.metamaskController.networkController.store.subscribe(updatedNetwork => this.networkUpdated(updatedNetwork));
    this.metamaskController.on('update', (memState) => {
      const unlocked = this.metamaskController.isUnlocked();
      if (unlocked && !this.unlocked) {
        this.unlocked = true;
        this.onUnlocked();
      }
    });
  }

  /**
   * When the preferences are updated and the account has changed this operation is called to update the selected
   * address.
   * @param preferences the updated preferences.
   */
  preferencesUpdated (preferences) {
    // check if the account was changed and update the rns domains to show
    const newAddress = preferences.selectedAddress;
    if (this.address !== newAddress) {
      // update
      this.address = newAddress;
      this.onAddressChanged(this.address);
    }
  }

  /**
   * This operation is called when the user changes the network
   * @param networkState the new network state: {
                                                  provider: {
                                                    nickname: ""
                                                    rpcTarget: ""
                                                    ticker: ""
                                                    type: ""
                                                  }
                                                  network: ""
                                                  settings: {
                                                    network: ""
                                                    chainId: ""
                                                    rpcUrl: ""
                                                    ticker: ""
                                                    nickname: ""
                                                  }
                                                }
   */
  networkUpdated (networkState) {
    if (networkState.network && networkState.network !== 'loading') {
      this.network = {
        id: networkState.network,
        rskEndpoint: networkState.provider.rpcTarget ? networkState.provider.rpcTarget : this.getRskEndpoint(networkState.network),
      };
      this.onNetworkChanged(this.network);
    }
  }

  // TODO: Remove this when nifty fixes the error.
  /**
   * Temporal fix for bad rsk endpoint on nifty dependency
   * @param chainId
   * @returns {string}
   */
  getRskEndpoint (chainId) {
    switch (chainId) {
      case '30':
        return 'https://public-node.rsk.co';
      case '31':
        return 'https://public-node.testnet.rsk.co';
      default:
        return 'http:localhost:4444';
    }
  }

  /**
   * Event executed when the user unlocks the wallet
   */
  onUnlocked () {
    this.configurationProvider.onUnlock();
    this.notifierManager.onUnlock();
    this.rnsManager.onUnlock();
    this.luminoManager.onUnlock();
  }

  /**
   * Event executed when the user changes the selected network
   * @param network the new network state
   */
  onNetworkChanged (network) {
    this.configurationProvider.onNetworkChanged(network);
    this.notifierManager.onNetworkChanged(network);
    this.rnsManager.onNetworkChanged(network);
    this.luminoManager.onNetworkChanged(network);
  }

  /**
   * Event executed when the user changes the selected address
   * @param address the new address
   */
  onAddressChanged (address) {
    this.notifierManager.onAddressChanged(address);
    this.rnsManager.onAddressChanged(address);
    this.luminoManager.onAddressChanged(address);
  }

  /**
   * Cleans the store completely, this can be used by the developer to reset rif state.
   */
  cleanStore () {
    this.configurationProvider.store.putState({});
    this.rnsManager.store.putState({});
    this.luminoManager.store.putState({});
    return Promise.resolve();
  }

  /**
   * Checks if rif is enabled for the current selected network
   * @returns Promise with boolean that indicates if rif is enabled or not.
   */
  enabled () {
    const enabled = isRskNetwork(this.network.id);
    return Promise.resolve(enabled);
  }

  getConfiguration () {
    return this.configurationProvider.getConfiguration();
  }

  setConfiguration (configuration) {
    if (configuration) {
      this.configurationProvider.setConfiguration(configuration);
      this.notifierManager.onConfigurationUpdated(configuration);
      this.rnsManager.onConfigurationUpdated(configuration);
      this.luminoManager.onConfigurationUpdated(configuration);
    }
    return Promise.resolve();
  }

  walletUnlocked () {
    return Promise.resolve(this.unlocked);
  }

  /**
   * This method publishes all the operations available to call from the ui for RifController
   * and all it's members.
   * @returns an object like { operationName: functionBind, }
   */
  exposeApi () {
    return {
      getConfiguration: bindOperation(this.getConfiguration, this),
      setConfiguration: bindOperation(this.setConfiguration, this),
      rns: this.rnsManager.bindApi(),
      lumino: this.luminoManager.bindApi(),
      cleanStore: bindOperation(this.cleanStore, this),
      enabled: bindOperation(this.enabled, this),
      walletUnlocked: bindOperation(this.walletUnlocked, this),
    }
  }
}
