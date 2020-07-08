import web3Utils from 'web3-utils';
import {checkRequiredParameters, checksumAddresses} from '../utils/general';
import {isValidRNSDomain} from '../../../../../ui/app/rif/utils/parse';

export class LuminoOperations {

  constructor (props) {
    this.lumino = props.lumino;
    this.address = web3Utils.toChecksumAddress(props.address);
    this.configurationProvider = props.configurationProvider;
  }

  updateAddress (newAddress) {
    this.address = web3Utils.toChecksumAddress(newAddress);
  }

  onboarding () {
    console.debug('Onboarding Client');
    return new Promise((resolve, reject) => {
      this.lumino.get().actions.onboardingClient()
        .then(() => {
          resolve();
        }).catch(error => reject(error));
    });
  }

  getApiKey () {
    console.debug('Getting api key');
    return Promise.resolve(this.lumino.get().actions.getApiKey());
  }

  setApiKey (apiKey) {
    console.debug('Setting api key', apiKey);
    this.lumino.get().actions.setApiKey(apiKey);
    return Promise.resolve();
  }

  openChannel (partner, tokenAddress) {
    const errors = checkRequiredParameters({
      partner,
      tokenAddress,
    });
    if (errors.length > 0) {
      return Promise.reject(errors);
    }
    if (!isValidRNSDomain(partner)) {
      partner = web3Utils.toChecksumAddress(partner);
    }
    const params = {
      ...checksumAddresses({tokenAddress}),
      partner,
      settleTimeout: 500,
    };
    console.debug(`Request to open a channel with partner ${partner} on token ${tokenAddress}`);
    this.lumino.get().actions.openChannel(params);
    return Promise.resolve();
  }

  closeChannel (partner, tokenAddress, tokenNetworkAddress, channelIdentifier) {
    const errors = checkRequiredParameters({
      partner,
      tokenAddress,
      tokenNetworkAddress,
      channelIdentifier,
    });
    if (errors.length > 0) {
      return Promise.reject(errors);
    }
    if (!isValidRNSDomain(partner)) {
      partner = web3Utils.toChecksumAddress(partner);
    }
    const params = {
      ...checksumAddresses({tokenAddress, tokenNetworkAddress}),
      partner,
      address: this.address,
      channelIdentifier,
    };
    console.debug('Requesting to close channel', params);
    this.lumino.get().actions.closeChannel(params)
    return Promise.resolve();
  }

  deleteChannelFromSdk (channelIdentifier, tokenAddress) {
    const errors = checkRequiredParameters({
      channelIdentifier,
      tokenAddress,
    });
    if (errors.length > 0) {
      return Promise.reject(errors);
    }
    this.lumino.get().actions.deleteChannelFromSDK(channelIdentifier, tokenAddress);
    return Promise.resolve();
  }

  createDeposit (partner, tokenAddress, tokenNetworkAddress, channelIdentifier, netAmount) {
    const errors = checkRequiredParameters({
      partner,
      tokenAddress,
      tokenNetworkAddress,
      channelIdentifier,
      netAmount,
    });
    if (errors.length > 0) {
      return Promise.reject(errors);
    }
    const amount = web3Utils.toWei(netAmount);
    if (!isValidRNSDomain(partner)) {
      partner = web3Utils.toChecksumAddress(partner);
    }
    const address = this.address;
    const params = {
      ...checksumAddresses({tokenAddress, address, tokenNetworkAddress}),
      amount,
      partner,
      channelId: channelIdentifier,
    };
    console.debug(`Requested deposit of ${amount} on token ${tokenAddress} on channel ${channelIdentifier} with partner ${partner}`);
    this.lumino.get().actions.createDeposit(params);
    return Promise.resolve();
  }

  createPayment (partner, tokenAddress, netAmount) {
    const errors = checkRequiredParameters({
      partner,
      tokenAddress,
      netAmount,
    });
    if (errors.length > 0) {
      return Promise.reject(errors);
    }
    const amount = web3Utils.toWei(netAmount);
    if (!isValidRNSDomain(partner)) {
      partner = web3Utils.toChecksumAddress(partner);
    }
    const body = {
      ...checksumAddresses({token_address: tokenAddress}),
      partner,
      amount,
    };
    console.debug(`Sending payment of ${amount} on token ${tokenAddress} to ${partner}`);
    this.lumino.get().actions.createPayment(body);
    return Promise.resolve();
  }

  getChannels () {
    return Promise.resolve(this.lumino.get().actions.getChannels());
  }

  subscribeToCloseChannel (channelId, tokenNetworkAddress) {
    const configuration = this.configurationProvider.getConfigurationObject();
    this.subscribeToCloseChannelForNotifiers(configuration.notifier.availableNodes, channelId, tokenNetworkAddress);
    return Promise.resolve();
  }

  async subscribeToCloseChannelForNotifiers (urls, channelId, tokenNetworkAddress) {
    if (urls && urls.length > 0 && channelId && tokenNetworkAddress) {
      for (const url of urls) {
        await this.subscribeToCloseChannelForNotifier(url, channelId, tokenNetworkAddress);
      }
    }
  }

  async subscribeToCloseChannelForNotifier (url, channelId, tokenNetworkAddress) {
    const errors = checkRequiredParameters({
      url,
      channelId,
      tokenNetworkAddress,
    });
    if (errors.length > 0) {
      return Promise.reject(errors);
    }
    if (url && tokenNetworkAddress) {
      tokenNetworkAddress = web3Utils.toChecksumAddress(tokenNetworkAddress);
      await this.lumino.get().actions.subscribeToUserClosesChannelOnToken(url, tokenNetworkAddress);
      await this.lumino.get().actions.subscribeToPartnerClosesSpecificChannel(url, channelId, tokenNetworkAddress);
    }
  }

  async notifierInitialization (url) {
    if (url) {
      await this.lumino.get().actions.notifierRegistration(url);
      await this.lumino.get().actions.subscribeToOpenChannel(url);
    }
  }

  async notifiersInitialization (urls) {
    if (urls && urls.length > 0) {
      for (const url of urls) {
        await this.notifierInitialization(url);
      }
    }
  }
}
