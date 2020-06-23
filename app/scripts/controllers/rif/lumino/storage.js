export class LuminoStorageHandler {
  constructor (props) {
    this.store = props.store;
    this.address = props.address
  }

  getLuminoData () {
    const unparsedData = this.store.getState()[`luminoData-${this.address}`];
    if (unparsedData) {
      return JSON.parse(unparsedData);
    }
    return null;
  }

  saveLuminoData (data) {
    if (data) {
      const state = this.store.getState();
      state[`luminoData-${this.address}`] = JSON.stringify(data);
      this.store.putState(state);
    }
  }
}
