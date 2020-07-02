import web3Utils from 'web3-utils';

const RIF_NOTIFIER_ONBOARDING_REGISTER = '/users';
const RIF_NOTIFIER_ONBOARDING_SUBSCRIBE = '/subscribe';
const RIF_NOTIFIER_TOPIC_SUBSCRIBE = '/subscribeToTopic';
const RIF_NOTIFIER_GET_RNS_EVENTS = '/getRnsEvents';

export class NotifierOperations {

  constructor (props) {
    this.signingHandler = props.signingHandler;
    this.address = web3Utils.toChecksumAddress(props.address);
    this.configurationProvider = props.configurationProvider;
  }

  updateAddress (newAddress) {
    this.address = web3Utils.toChecksumAddress(newAddress);
  }

  onboarding () {
    return new Promise(async (resolve, reject) => {
      const notifierEndpoint = this.configurationProvider.getConfigurationObject().notifier.availableNodes[0];
      const signedAddress = await this.signingHandler.offChainSign(this.address);
      fetch(notifierEndpoint + RIF_NOTIFIER_ONBOARDING_REGISTER + '?address=' + this.address, {
        method: 'POST',
        body: signedAddress,
        headers: {
          'Content-Type': 'text/plain',
        }})
        .then(response => {
          return response.json();
        })
        .then(response => {
          resolve(response.data.apiKey);
        }).catch(err => reject(err));
    });
  }
  subscribe (apiKey) {
    return new Promise(async (resolve, reject) => {
      const notifierEndpoint = this.configurationProvider.getConfigurationObject().notifier.availableNodes[0];
      fetch(notifierEndpoint + RIF_NOTIFIER_ONBOARDING_SUBSCRIBE, {
        method: 'POST',
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/json',
        }})
        .then(response => {
          return response.json();
        })
        .then(response => {
          resolve();
        }).catch(err => reject(err));
    });
  }
  subscribeToTopic (apiKey, topic) {
    return new Promise(async (resolve, reject) => {
      const notifierEndpoint = this.configurationProvider.getConfigurationObject().notifier.availableNodes[0];
      fetch(notifierEndpoint + RIF_NOTIFIER_TOPIC_SUBSCRIBE, {
        method: 'POST',
        body: JSON.stringify(topic),
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/json',
        }})
        .then(response => {
          return response.json();
        })
        .then(response => {
          const data = JSON.parse(response.data);
          resolve(data.topicId);
        }).catch(err => reject(err));
    });
  }
  getRnsEvents (apiKey, nodehash = '', eventName = '') {
    return new Promise(async (resolve, reject) => {
      const notifierEndpoint = this.configurationProvider.getConfigurationObject().notifier.availableNodes[0];
      const endpointParams =
        (nodehash || eventName ? '?' : '') // If we got a param, lets put the ? for initialize the params
        + (nodehash ? 'nodehash=' + nodehash + (eventName ? '&' : '') : '') // If we got nodehash (And checks if eventname comes too, so it puts the &)
        + (eventName ? 'eventName=' + eventName : ''); // If we got eventName, put the param
      fetch(notifierEndpoint + RIF_NOTIFIER_GET_RNS_EVENTS + endpointParams, {
        method: 'GET',
        headers: {
          'apiKey': apiKey,
        }})
        .then(response => {
          return response.json();
        })
        .then(response => {
          resolve(response.data);
        }).catch(err => reject(err));
    });
  }
}
