// Slip-0044 https://github.com/satoshilabs/slips/blob/master/slip-0044.md
/**
 * This class is used to retrieve networks from logs
 * @attribute chain: hexa code of the chain, given in slip-0044
 * @attribute address: Address of the network
 */
export default class ChainAddress {
  constructor(chain, address, action) {
    this.chain = chain;
    this.address = address;
    this.action = action;
  }
}
