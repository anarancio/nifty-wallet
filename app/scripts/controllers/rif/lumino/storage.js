export class LuminoStorageHandler {
  constructor (props) {
    this.store = props.store;
    this.address = props.address;
    this.chainId = props.chainId;
    this.initializeStore();
  }

  initializeStore () {
    const storeState = this.store.getState();
    if (!storeState[this.chainId]) {
      storeState[this.chainId] = {};
    }
    if (!storeState[this.chainId][`LUMINO_SDK_DATA_${this.address}`]) {
      storeState[this.chainId][`LUMINO_SDK_DATA_${this.address}`] = '{}';
    }
    this.store.putState(storeState);
  }

  getLuminoData () {
    const storeState = this.getStoreState();
    if (storeState) {
      return JSON.parse(storeState);
    }
    return null;
  }

  saveLuminoData (data) {
    if (data) {
      this.setStoreState(JSON.stringify(data));
    }
  }

  getStoreState () {
    const storeState = this.store.getState();
    return storeState[this.chainId][`LUMINO_SDK_DATA_${this.address}`];
  }

  setStoreState (data) {
    const storeState = this.store.getState();
    storeState[this.chainId][`LUMINO_SDK_DATA_${this.address}`] = data;
    this.store.putState(storeState);
  }

  onNetworkChanged (network) {
    if (network) {
      this.chainId = network.id;
      this.initializeStore();
    }
  }

  onAddressChanged (address) {
    if (address) {
      this.address = address;
      this.initializeStore();
    }
  }
}
