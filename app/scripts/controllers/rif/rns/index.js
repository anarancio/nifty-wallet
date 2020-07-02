import RnsRegister from './register'
import RnsResolver from './resolver'
import RnsTransfer from './transfer'
import RNS from './abis/RNS.json'
import RIF from './abis/RIF.json'
import extend from 'xtend'
import {RnsContainer} from './container';
import {AbstractManager} from '../abstract-manager';
import {isRskNetwork} from '../utils/general';

/**
 * This class encapsulates all the RNS operations, it initializes and call to all the delegates and exposes their operations.
 *
 * Props:
 *   preferenceController and networkController: this is passed only to have more access on the delegates to the config.
 *   web3: a web3 instance to make the contract calls.
 */
export default class RnsManager extends AbstractManager {
  constructor (props) {
    const initState = extend({
      register: {},
      resolver: {},
      transfer: {},
    }, props.initState);
    super(props, initState);
    const configuration = this.configurationProvider.getConfigurationObject();
    this.rnsContractInstance = this.web3.eth.contract(RNS).at(configuration.rns.contracts.rns);
    this.rifContractInstance = this.web3.eth.contract(RIF).at(configuration.rns.contracts.rif);

    const register = new RnsRegister({
      web3: this.web3,
      preferencesController: this.preferencesController,
      networkController: this.networkController,
      transactionController: this.transactionController,
      rnsContractInstance: this.rnsContractInstance,
      rifContractInstance: this.rifContractInstance,
      address: this.address,
      store: this.store,
      configurationProvider: this.configurationProvider,
    });
    const resolver = new RnsResolver({
      web3: this.web3,
      preferencesController: this.preferencesController,
      networkController: this.networkController,
      transactionController: this.transactionController,
      rnsContractInstance: this.rnsContractInstance,
      rifContractInstance: this.rifContractInstance,
      address: this.address,
      store: this.store,
      configurationProvider: this.configurationProvider,
      notifierManager: this.notifierManager,
    });
    const transfer = new RnsTransfer({
      web3: this.web3,
      preferencesController: this.preferencesController,
      networkController: this.networkController,
      transactionController: this.transactionController,
      rnsContractInstance: this.rnsContractInstance,
      rifContractInstance: this.rifContractInstance,
      address: this.address,
      store: this.store,
      configurationProvider: this.configurationProvider,
    });
    this.container = new RnsContainer({
      register,
      resolver,
      transfer,
    });
  }

  /**
   * This updates all the addresses used by the manager and it's delegates.
   * @param address the new address.
   */
  onAddressChanged (address) {
    super.onAddressChanged(address);
    this.container.register.address = address;
    this.container.resolver.address = address;
    this.container.transfer.address = address;
  }

  onNetworkChanged (network) {
    if (isRskNetwork(network.id)) {
      const configuration = this.configurationProvider.getConfigurationObject();
      this.reloadConfiguration(configuration);
    }
  }

  onConfigurationUpdated (configuration) {
    this.reloadConfiguration(configuration);
  }

  reloadConfiguration (configuration) {
    this.rnsContractInstance = this.web3.eth.contract(RNS).at(configuration.rns.contracts.rns);
    this.rifContractInstance = this.web3.eth.contract(RIF).at(configuration.rns.contracts.rif);
    this.container.register.rnsContractInstance = this.rnsContractInstance;
    this.container.register.rifContractInstance = this.rifContractInstance;
    this.container.resolver.rnsContractInstance = this.rnsContractInstance;
    this.container.resolver.rifContractInstance = this.rifContractInstance;
    this.container.transfer.rnsContractInstance = this.rnsContractInstance;
    this.container.transfer.rifContractInstance = this.rifContractInstance;
    this.container.register.onConfigurationUpdated(configuration);
    this.container.resolver.onConfigurationUpdated(configuration);
    this.container.transfer.onConfigurationUpdated(configuration);
  }

  /**
   * It binds all the operations to be accessed from the outside.
   * @returns an object like { operationName: function bind}
   */
  bindApi () {
    return {
      register: this.container.register.buildApi(),
      resolver: this.container.resolver.buildApi(),
      transfer: this.container.transfer.buildApi(),
    }
  }
}
