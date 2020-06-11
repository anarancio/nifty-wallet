import {Lumino} from '@rsksmart/lumino-light-client-sdk';
import {lumino, rns} from '../../../../../rif.config';
import {LuminoSigningHandler} from './signing-handler';
import {AbstractManager} from '../abstract-manager';
import {bindOperation, isRskNetwork} from '../utils/general';
import {LuminoOperations} from './operations';
import {LuminoCallbacks} from './callbacks';
import ethUtils from 'ethereumjs-util';
import { LuminoExplorer } from './explorer';
import {LuminoStorageHandler} from './storage';

/**
 * Manager to control the access to lumino api
 */
export class LuminoManager extends AbstractManager {

  constructor (props) {
    super(props, {
      apiKey: null,
    });
    this.lumino = Lumino;
    this.operations = new LuminoOperations(this.lumino);
    this.callbacks = new LuminoCallbacks(this.lumino);
    this.keyringController = props.keyringController;
    this.signingHandler = new LuminoSigningHandler({
      transactionController: this.transactionController,
      address: this.address,
      keyringController: this.keyringController,
    });
    this.luminoExplorer = new LuminoExplorer();
  }

  async initializeLumino (cleanApiKey = false) {
    if (this.unlocked && isRskNetwork(this.network.id)) {
      const configParams = {
        chainId: this.network.id,
        rskEndpoint: this.network.rskEndpoint,
        hubEndpoint: lumino.hub.endpoint,
        address: ethUtils.toChecksumAddress(this.address),
        registryAddress: rns.contracts.rns,
      };
      const signingHandler = {
        sign: (tx) => this.signingHandler.sign(tx),
        offChainSign: (byteMessage) => this.signingHandler.offChainSign(byteMessage),
      }
      const luminoStorageHandler = new LuminoStorageHandler({
        store: this.store,
      });
      const storageHandler = {
        getLuminoData: () => {
          return luminoStorageHandler.getLuminoData();
        },
        saveLuminoData: (data) => {
          luminoStorageHandler.saveLuminoData(data);
        },
      }
      await this.lumino.init(signingHandler, storageHandler, configParams);
      const state = this.store.getState();
        if (state.apiKey && !cleanApiKey) {
          await this.operations.setApiKey(state.apiKey);
        } else {
          await this.operations.onboarding();
          state.apiKey = await this.operations.getApiKey();
          this.store.putState(state);
        }
    }
  };

  onUnlock () {
    super.onUnlock();
    this.initializeLumino();
  }

  onNetworkChanged (network) {
    super.onNetworkChanged(network);
    this.initializeLumino(true);
  }

  onAddressChanged (address) {
    super.onAddressChanged(address);
    if (this.signingHandler) {
      this.signingHandler.address = address;
    }
    this.initializeLumino(true);
  }

  bindApi () {
    return {
      onboarding: bindOperation(this.operations.onboarding, this.operations),
      openChannel: bindOperation(this.operations.openChannel, this.operations),
      closeChannel: bindOperation(this.operations.closeChannel, this.operations),
      createDeposit: bindOperation(this.operations.createDeposit, this.operations),
      createPayment: bindOperation(this.operations.createPayment, this.operations),
      getChannels: bindOperation(this.operations.getChannels, this.operations),
      getApiKey: bindOperation(this.operations.getApiKey, this.operations),
      getAvailableCallbacks: bindOperation(this.callbacks.getAvailableCallbacks, this.callbacks),
      listenCallback: bindOperation(this.callbacks.listenForCallback, this.callbacks),
      getTokens: bindOperation(this.luminoExplorer.getTokens, this.luminoExplorer),
    };
  }

}
