import extend from 'xtend';
import ObservableStore from 'obs-store';
import {isRskNetwork} from '../utils/general';
import {global} from '../constants';

export class RifConfigurationProvider {

  constructor (props) {
    this.networkController = props.networkController;
    this.preferencesController = props.preferencesController;
    const initConfiguration = {};
    Object.keys(global.networks).forEach(key => {
      initConfiguration[global.networks[key]] = null;
    });
    const initState = extend({
      configuration: initConfiguration,
    }, props.initState);
    this.store = new ObservableStore(initState);
  }

  /**
   * This loads the default configuration on the store if it's not there already. If the configuration
   * it's there we validate that all the values are there and are not empty strings.
   * @param chainId the chainId used to load the configuration
   * @returns {boolean} true if the configuration was loaded and it's a valid configuration, false otherwise
   */
  loadConfiguration (chainId) {
    const actualState = this.store.getState();
    if (!actualState.configuration[chainId]) {
      actualState.configuration[chainId] = this.getInitialConfigStructure(chainId);
      this.store.putState(actualState);
      return true;
    } else {
      const configuration = actualState.configuration[chainId];
      return this.validateConfiguration(configuration);
    }
  }

  /**
   * Validates that the configuration is correct and every required value it's there.
   * @param configuration
   * @returns {boolean}
   */
  validateConfiguration (configuration) {
    return !!(configuration &&
      configuration.lumino &&
      configuration.lumino.explorer &&
      configuration.lumino.explorer.endpoint &&
      configuration.notifier &&
      configuration.notifier.availableNodes &&
      configuration.notifier.availableNodes.length >= 3 &&
      configuration.rns &&
      configuration.rns.contracts &&
      configuration.rns.contracts.rns &&
      configuration.rns.contracts.publicResolver &&
      configuration.rns.contracts.multiChainResolver &&
      configuration.rns.contracts.rif &&
      configuration.rns.contracts.fifsAddrRegistrar &&
      configuration.rns.contracts.rskOwner);
  }

  /**
   * Get's the default configuration by chainId for RSK
   * @param chainId to use to get the configuration
   * @returns the configuration object
   */
  getInitialConfigStructure (chainId) {
    switch (chainId) {
      case global.networks.main: // RSK Mainnet
        return {
          lumino: {
            explorer: {
              endpoint: 'http://206.189.182.241:8080/api/v1',
            },
          },
          notifier: {
            availableNodes: [
              'http://206.189.200.203:8080',
              'http://167.99.232.42:8080',
              'http://167.99.233.117:8080',
            ],
          },
          rns: {
            contracts: {
              rns: '0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5',
              publicResolver: '0x4efd25e3d348f8f25a14fb7655fba6f72edfe93a',
              multiChainResolver: '0x99a12be4C89CbF6CFD11d1F2c029904a7B644368',
              rif: '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5',
              fifsAddrRegistrar: '0xd9c79ced86ecf49f5e4a973594634c83197c35ab',
              rskOwner: '0x45d3e4fb311982a06ba52359d44cb4f5980e0ef1',
            },
          },
        };
      case global.networks.test: // RSK Testnet
        return {
          lumino: {
            explorer: {
              endpoint: 'http://localhost:8080/api/v1', // FIXME we dont have explorer on testnet
            },
          },
          notifier: {
            availableNodes: [ // FIXME we dont have notifiers on testnet
              'http://localhost:8081/',
              'http://localhost:8082/',
              'http://localhost:8083/',
            ],
          },
          rns: {
            contracts: {
              rns: '0x7d284aaac6e925aad802a53c0c69efe3764597b8',
              publicResolver: '0x1e7ae43e3503efb886104ace36051ea72b301cdf',
              multiChainResolver: '0x404308f2a2eec2cdc3cb53d7d295af11c903414e',
              rif: '0x19f64674D8a5b4e652319F5e239EFd3bc969a1FE',
              fifsAddrRegistrar: '0x90734bd6bf96250a7b262e2bc34284b0d47c1e8d',
              rskOwner: '0xca0a477e19bac7e0e172ccfd2e3c28a7200bdb71',
            },
          },
        };
      case global.networks.reg: // RSK Regtest
        return {
          lumino: {
            explorer: {
              endpoint: '',
            },
          },
          notifier: {
            availableNodes: [
              '',
              '',
              '',
            ],
          },
          rns: {
            contracts: {
              rns: '',
              publicResolver: '',
              multiChainResolver: '',
              rif: '',
              fifsAddrRegistrar: '',
              rskOwner: '',
            },
          },
        };
    }
  }

  /**
   * Exposes the get configuration object method to be used on the ui or outside the manager
   * @returns a Promise with the configuration object.
   */
  getConfiguration () {
    return Promise.resolve(this.getConfigurationObject());
  }

  /**
   * Exposes the set configuration object method to be used outside the manager
   * @param configuration to be set.
   * @returns Promise that resolves if the configuration is set successfully or rejects otherwise.
   */
  setConfiguration (configuration) {
    try {
      this.setConfigurationObject(configuration);
    } catch (error) {
      return Promise.reject(error);
    }
    this.preferencesController.setPreference('rnsConfiguration', configuration);
    return Promise.resolve();
  }

  getConfigurationObject () {
    return this.store.getState().configuration[this.network ? this.network.id : global.networks.main];
  }

  setConfigurationObject (configuration) {
    const actualState = this.store.getState();
    if (this.validateConfiguration(configuration)) {
      actualState.configuration[this.network ? this.network.id : global.networks.main] = configuration;
      this.store.putState(actualState);
    } else {
      throw new Error('Invalid configuration provided');
    }
  }

  /**
   * Method to be overwritten by a child class to control the event when we change the address.
   * @param network the new network.
   */
  onNetworkChanged (network) {
    this.network = network;
    this.loadConfiguration(network.id)
  }

  /**
   * This operation is executed when the user unlocks the wallet
   */
  onUnlock () {
    if (isRskNetwork(this.network.id)) {
      this.loadConfiguration(this.network.id);
    }
  }
}
