import {Lumino} from '@rsksmart/lumino-light-client-sdk';
import {LuminoSigningHandler} from './signing-handler';
import {AbstractManager} from '../abstract-manager';
import {bindOperation, isRskNetwork} from '../utils/general';
import {LuminoOperations} from './operations';
import {LuminoCallbacks} from './callbacks';
import ethUtils from 'ethereumjs-util';
import {LuminoExplorer} from './explorer';
import {LuminoStorageHandler} from './storage';

/**
 * Manager to control the access to lumino api
 */
export class LuminoManager extends AbstractManager {

  constructor (props) {
    super(props);
    this.lumino = Lumino;
    this.operations = new LuminoOperations({
      lumino: this.lumino,
      address: this.address,
      configurationProvider: this.configurationProvider,
    });
    this.callbacks = new LuminoCallbacks(this.lumino);
    this.keyringController = props.keyringController;
    this.signingHandler = new LuminoSigningHandler({
      transactionController: this.transactionController,
      address: this.address,
      keyringController: this.keyringController,
    });
    this.luminoExplorer = new LuminoExplorer({
      address: this.address,
      configurationProvider: this.configurationProvider,
    });
  }

  async initializeLumino (reconfigure = false) {
    const configuration = this.configurationProvider.getConfigurationObject();
    if (this.unlocked && isRskNetwork(this.network.id)) {
      let hubEndpoint;
      try {
        hubEndpoint = await this.luminoExplorer.getHubConnectionUrl();
      } catch (error) {
        throw Error(error);
      }
      const configParams = {
        chainId: this.network.id,
        rskEndpoint: this.network.rskEndpoint,
        hubEndpoint,
        address: ethUtils.toChecksumAddress(this.address),
        registryAddress: configuration.rns.contracts.rns,
      };
      await this.signingHandler.initialize();
      const signingHandler = {
        sign: (tx) => this.signingHandler.sign(tx),
        offChainSign: (byteMessage) => this.signingHandler.offChainSign(byteMessage),
      }
      const luminoStorageHandler = new LuminoStorageHandler({
        store: this.store,
        address: this.address,
        chainId: this.network.id,
      });
      this.luminoStorageHandler = luminoStorageHandler;
      const storageHandler = {
        getLuminoData: () => {
          return luminoStorageHandler.getLuminoData();
        },
        saveLuminoData: (data) => {
          luminoStorageHandler.saveLuminoData(data);
        },
      }
      if (reconfigure) {
        await this.lumino.reConfigure(signingHandler, storageHandler, configParams)
      } else {
        await this.lumino.init(signingHandler, storageHandler, configParams);
      }
      await this.operations.onboarding();
      await this.afterInitialization();
    }
  };

  async afterInitialization () {
    const configuration = this.configurationProvider.getConfigurationObject();
    await this.operations.notifiersInitialization(configuration.notifier.availableNodes);
  }

  onUnlock () {
    super.onUnlock();
    this.initializeLumino();
  }

  onNetworkChanged (network) {
    super.onNetworkChanged(network);
    if (this.luminoStorageHandler) {
      this.luminoStorageHandler.onNetworkChanged(network);
    }
    this.initializeLumino(true);
  }

  onConfigurationUpdated (configuration) {
    this.initializeLumino(true);
  }

  onAddressChanged (address) {
    super.onAddressChanged(address);
    if (this.signingHandler) {
      this.signingHandler.updateAddress(address);
    }
    if (this.luminoStorageHandler) {
      this.luminoStorageHandler.onAddressChanged(address);
    }
    if (this.operations) {
      this.operations.updateAddress(address);
    }
    if (this.luminoExplorer) {
      this.luminoExplorer.onAddressChanged(address);
    }
    this.initializeLumino(true);
  }

  bindApi () {
    return {
      onboarding: bindOperation(this.operations.onboarding, this.operations),
      openChannel: bindOperation(this.operations.openChannel, this.operations),
      closeChannel: bindOperation(this.operations.closeChannel, this.operations),
      subscribeToCloseChannel: bindOperation(this.operations.subscribeToCloseChannel, this.operations),
      deleteChannelFromSDK: bindOperation(this.operations.deleteChannelFromSdk, this.operations),
      createDeposit: bindOperation(this.operations.createDeposit, this.operations),
      createPayment: bindOperation(this.operations.createPayment, this.operations),
      getChannels: bindOperation(this.operations.getChannels, this.operations),
      getApiKey: bindOperation(this.operations.getApiKey, this.operations),
      getAvailableCallbacks: bindOperation(this.callbacks.getAvailableCallbacks, this.callbacks),
      listenCallback: bindOperation(this.callbacks.listenForCallback, this.callbacks),
      getTokens: bindOperation(this.luminoExplorer.getTokens, this.luminoExplorer),
      isLuminoNode: bindOperation(this.luminoExplorer.isLuminoNode, this.luminoExplorer),
    };
  }

}
