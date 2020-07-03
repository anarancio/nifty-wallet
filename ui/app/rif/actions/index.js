import * as niftyActions from '../../actions';
import extend from 'xtend';
import _ from 'lodash';
import {lumino} from '../../../../app/scripts/controllers/rif/constants';
import {CallbackHandlers} from './callback-handlers';
import ethUtils from 'ethereumjs-util';
import {sumValuesOfArray} from '../utils/utils';
import {parseLuminoError} from '../utils/parse';
import web3Utils from 'web3-utils';

const rifActions = {
  SHOW_MODAL: 'SHOW_MODAL',
  SHOW_MENU: 'SHOW_MENU',
  NAVIGATE_TO: 'NAVIGATE_TO',
  RIF_LANDING_PAGE: 'RIF_LANDING_PAGE',
  LUMINO_CALLBACKS_RUNNING: 'LUMINO_CALLBACKS_RUNNING',
  setBackgroundConnection,
  // RNS
  checkDomainAvailable,
  getDomainDetails,
  setResolverAddress,
  getResolverAddress,
  getChainAddresses,
  setChainAddressForResolver,
  deletePendingChainAddress,
  requestDomainRegistration,
  canFinishRegistration,
  finishRegistration,
  getRegistrationCost,
  getUnapprovedTransactions,
  waitUntil,
  getSelectedAddress,
  showMenu,
  hideMenu,
  navigateTo,
  navigateBack,
  showModal,
  hideModal,
  getSubdomains,
  createSubdomain,
  isSubdomainAvailable,
  goToConfirmPageForLastTransaction,
  waitForTransactionListener,
  deleteSubdomain,
  getDomains,
  getDomain,
  updateDomains,
  getDomainByAddress,
  // Lumino
  onboarding,
  openChannel,
  closeChannel,
  deleteChannelFromSdk,
  getChannels,
  getChannelsGroupedByNetwork,
  getAvailableCallbacks,
  getTokensWithJoinedCheck,
  getLuminoNetworks,
  getLuminoNetworkData,
  getUserChannelsInNetwork,
  listenCallbacks,
  createPayment,
  createDeposit,
  getTokens,
  isLuminoNode,
  cleanStore,
  showRifLandingPage,
  setupDefaultLuminoCallbacks,
  luminoCallbacksRunning,
  createNetworkPayment,
  getDomainAddress,
  subscribeToCloseChannel,
  getConfiguration,
  setConfiguration,
  rifEnabled,
  walletUnlocked,
}

let background = null;
const navigationStack = [];
let backNavigated = false;

function setBackgroundConnection (backgroundConnection) {
  background = backgroundConnection;
}

function hideModal () {
  return {
    type: rifActions.SHOW_MODAL,
    currentModal: null,
  }
}

function showModal (opts, modalName = 'generic-modal') {
  const defaultOpts = {
    title: null,
    text: null,
    elements: null,
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    confirmButtonClass: 'btn-confirm',
    confirmCallback: () => {
    },
    closeAfterConfirmCallback: true,
    cancelButtonClass: 'btn-cancel',
    cancelCallback: () => {
    },
    closeAfterCancelCallback: true,
    validateConfirm: null,
    hideConfirm: false,
    hideCancel: false,
  };
  opts = extend(defaultOpts, opts);
  return {
    type: rifActions.SHOW_MODAL,
    currentModal: {
      name: modalName,
      message: {
        title: opts.title,
        body: opts.body ? opts.body : {
          elements: opts.elements,
          text: opts.text,
        },
        confirmLabel: opts.confirmLabel,
        confirmCallback: opts.confirmCallback,
        closeAfterConfirmCallback: opts.closeAfterConfirmCallback,
        cancelLabel: opts.cancelLabel,
        cancelCallback: opts.cancelCallback,
        closeAfterCancelCallback: opts.closeAfterCancelCallback,
        validateConfirm: opts.validateConfirm,
        hideConfirm: opts.hideConfirm,
        hideCancel: opts.hideCancel,
        confirmButtonClass: opts.confirmButtonClass,
        cancelButtonClass: opts.cancelButtonClass,
      },
    },
  }
}

function checkDomainAvailable (domainName) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication());
    return new Promise((resolve, reject) => {
      background.rif.rns.resolver.isDomainAvailable(domainName, (error, available) => {
        dispatch(niftyActions.hideLoadingIndication());
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(available);
      });
    });
  };
}

function getDomainDetails (domainName) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication());
    return new Promise((resolve, reject) => {
      background.rif.rns.resolver.getDomainDetails(domainName, (error, details) => {
        console.debug('This are the details bringed', details);
        dispatch(niftyActions.hideLoadingIndication());
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(details);
      });
    })
  }
}

/*
  TODO: rorolopetegui
   This action isn't used for now, but it resolves an address using reverse lookup
 */
function getDomainByAddress (address) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.rns.resolver.getAddressDomain(address, (error, domain) => {
        console.debug('this is the domain bringed', domain);
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(domain);
      });
    })
  }
}

function setResolverAddress (domainName, resolverAddress) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication());
    return new Promise((resolve, reject) => {
      background.rif.rns.resolver.setResolver(domainName, resolverAddress, (error, transactionListenerId) => {
        dispatch(niftyActions.hideLoadingIndication());
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(transactionListenerId);
      });
    })
  }
}

function getResolverAddress (domainName) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.rns.resolver.getResolver(domainName, (error, resolverAddress) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(resolverAddress);
      });
    })
  }
}

function setChainAddressForResolver (domainName, chain, chainAddress, subdomain = '', action = 'add') {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication());
    return new Promise((resolve, reject) => {
      background.rif.rns.resolver.setChainAddressForResolver(domainName, chain, chainAddress, subdomain, action, (error, result) => {
        dispatch(niftyActions.hideLoadingIndication());
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(result);
      });
    })
  }
}
function deletePendingChainAddress (chain, isSubdomain) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.rns.resolver.deletePendingChainAddress(chain, isSubdomain, (error, result) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(result);
      });
    });
  }
}

function getChainAddresses (domainName, subdomain = '') {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.rns.resolver.getChainAddressForResolvers(domainName, subdomain, (error, result) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(result);
      });
    })
  }
}

function requestDomainRegistration (domainName, yearsToRegister) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.rif.rns.register.requestRegistration(domainName, yearsToRegister, (error, result) => {
        dispatch(niftyActions.hideLoadingIndication());
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(result);
      });
    });
  };
}

function canFinishRegistration (commitmentHash) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.rif.rns.register.canFinishRegistration(commitmentHash, (error, result) => {
        dispatch(niftyActions.hideLoadingIndication());
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(result);
      });
    });
  };
}

function finishRegistration (domainName) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve) => {
      dispatch(niftyActions.hideLoadingIndication());
      background.rif.rns.register.finishRegistration(domainName, (error, transactionListenerId) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
        }
        return resolve(transactionListenerId);
      });
    });
  };
}

function getRegistrationCost (domainName, yearsToRegister) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      dispatch(niftyActions.hideLoadingIndication());
      background.rif.rns.register.getDomainCost(domainName, yearsToRegister, (error, result) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(result);
      });
    });
  };
}

function getUnapprovedTransactions () {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.rif.rns.register.getUnapprovedTransactions((error, transactions) => {
        dispatch(niftyActions.hideLoadingIndication());
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(transactions);
      });
    });
  };
}

function getSelectedAddress () {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.rif.rns.register.getSelectedAddress((error, selectedAddress) => {
        dispatch(niftyActions.hideLoadingIndication());
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(selectedAddress);
      });
    });
  };
}

/**
 * This is used only for specific cases where we can't do anything else to sync with the plugin state machine
 * rather than wait. We wait until the state machine get's the latest transactions.
 * @param time to wait in milliseconds
 * @returns a Promise that's resolved when the time is done.
 */
function waitUntil (time = 1000) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        dispatch(niftyActions.hideLoadingIndication());
        clearTimeout(timeout);
        return resolve();
      }, time);
    });
  }
}

function hideMenu () {
  return {
    type: rifActions.SHOW_MENU,
    data: null,
  }
}

function showMenu (data) {
  return {
    type: rifActions.SHOW_MENU,
    data: data,
  }
}

function navigateBack () {
  if (navigationStack && navigationStack.length > 0) {
    // we cleanup the last navigation since it was to the current page
    if (!backNavigated) {
      navigationStack.pop();
      backNavigated = true;
    }
    if (navigationStack.length > 0) {
      const navigation = navigationStack.pop();
      return navigateTo(navigation.params.tabOptions.screenName, navigation.params);
    }
  }
  // go to home since we don't have any other page to go to.
  return niftyActions.goHome();
}

function navigateTo (screenName, params, resetNavigation = false) {
  const defaultTabOptions = {
    screenTitle: screenName,
    showBack: true,
    showSearchbar: true,
    screenName,
  };
  if (!params) {
    params = {
      tabOptions: defaultTabOptions,
    };
  }
  if (params.tabOptions) {
    params.tabOptions = extend(defaultTabOptions, params.tabOptions);
  } else {
    params.tabOptions = defaultTabOptions;
  }
  if (params.tabOptions.showBack === false || resetNavigation) {
    // we reset the navigation since we can't go back in the next page or any other after that
    for (let index = 0; index <= navigationStack.length; index++) {
      navigationStack.pop();
    }
  }

  const currentNavigation = {
    type: rifActions.NAVIGATE_TO,
    params,
  }
  const alreadyNavigatedTo = navigationStack.find(navigation => navigation.params.tabOptions.screenName === screenName);
  if (!alreadyNavigatedTo) {
    navigationStack.push(currentNavigation);
  }
  backNavigated = false;
  return currentNavigation;
}

function getSubdomains (domainName) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      dispatch(niftyActions.hideLoadingIndication());
      background.rif.rns.register.getSubdomainsForDomain(domainName, (error, result) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(result);
      });
    });
  };
}

function waitForTransactionListener (transactionListenerId) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.rns.register.waitForTransactionListener(transactionListenerId, (error, transactionReceipt) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(transactionReceipt);
      });
    });
  };
}

function createSubdomain (domainName, subdomain, ownerAddress, parentOwnerAddress) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.rif.rns.register.createSubdomain(domainName, subdomain, ownerAddress, parentOwnerAddress, (error, transactionListenerId) => {
        dispatch(niftyActions.hideLoadingIndication());
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(transactionListenerId);
      });
    });
  };
}

function isSubdomainAvailable (domainName, subdomain) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      dispatch(niftyActions.hideLoadingIndication());
      background.rif.rns.register.isSubdomainAvailable(domainName, subdomain, (error, available) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(available);
      });
    });
  };
}

function goToConfirmPageForLastTransaction (afterApproval) {
  return (dispatch) => {
    dispatch(waitUntil()).then(() => {
      dispatch(getUnapprovedTransactions())
        .then(latestTransaction => {
          dispatch(niftyActions.showConfTxPage({
            id: latestTransaction.id,
            unapprovedTransactions: latestTransaction,
            afterApproval,
          }));
        });
    });
  }
}

function deleteSubdomain (domainName, subdomain) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.rif.rns.register.deleteSubdomain(domainName, subdomain, (error, transactionListenerId) => {
        dispatch(niftyActions.hideLoadingIndication());
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(transactionListenerId);
      });
    });
  };
}

function getDomain (domainName) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      dispatch(niftyActions.hideLoadingIndication());
      background.rif.rns.register.getDomain(domainName, (error, domain) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(domain);
      });
    });
  };
}

function getDomainAddress (domainName) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      dispatch(niftyActions.hideLoadingIndication());
      background.rif.rns.register.getDomainAddress(domainName, (error, domainAddress) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(domainAddress);
      });
    });
  };
}

function getDomains () {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      dispatch(niftyActions.hideLoadingIndication());
      background.rif.rns.register.getDomains((error, domains) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(domains);
      });
    });
  };
}

function updateDomains (domain) {
  return (dispatch) => {
    dispatch(niftyActions.showLoadingIndication())
    return new Promise((resolve, reject) => {
      dispatch(niftyActions.hideLoadingIndication());
      background.rif.rns.register.updateDomain(domain, (error) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

// Lumino

function onboarding (callbackHandlers = new CallbackHandlers()) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      if (callbackHandlers && callbackHandlers.requestHandler) {
        handleSdkCallback(lumino.callbacks.REQUEST_CLIENT_ONBOARDING, dispatch, callbackHandlers.requestHandler);
      }
      if (callbackHandlers && callbackHandlers.successHandler) {
        handleSdkCallback(lumino.callbacks.CLIENT_ONBOARDING_SUCCESS, dispatch, callbackHandlers.successHandler);
      }
      background.rif.lumino.onboarding((error) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

function handleSdkCallback (callbackName, dispatch, handler = null) {
  const handlerFunction = async (result) => {
    if (handler) {
      await handler(result);
    }
  };
  listenToSdkCallback(callbackName, dispatch)
    .then(result => handlerFunction(result))
    .catch(error => handlerFunction(error));
}

function handleSdkDefaultCallback (callbackName, dispatch, handler = null) {
  const handlerFunction = async (result) => {
    if (handler) {
      await handler(result);
    }
  };
  listenToSdkCallback(callbackName, dispatch)
    .then(result => {
      handlerFunction(result);
      handleSdkDefaultCallback(callbackName, dispatch, handler);
    })
    .catch(error => {
      handlerFunction(error);
      handleSdkDefaultCallback(callbackName, dispatch, handler);
    });
}

function listenToSdkCallback (callbackName) {
  return new Promise((resolve, reject) => {
    background.rif.lumino.listenCallback(callbackName, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
}

function listenCallbacks (callbackNames, callbackHandler) {
  return (dispatch) => {
    return new Promise(resolve => {
      if (callbackHandler && callbackNames && callbackNames.length > 0) {
        callbackNames.forEach(callbackName => {
          handleSdkCallback(callbackName, dispatch, callbackHandler);
        });
      }
      return resolve();
    });
  };
}

function getAvailableCallbacks () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.lumino.getAvailableCallbacks((error, callbackNames) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(callbackNames);
      });
    });
  };
}

function openChannel (partner, tokenAddress, callbackHandlers = new CallbackHandlers()) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      if (callbackHandlers && callbackHandlers.requestHandler) {
        handleSdkCallback(lumino.callbacks.REQUEST_OPEN_CHANNEL, dispatch, callbackHandlers.requestHandler);
      }
      if (callbackHandlers && callbackHandlers.successHandler) {
        handleSdkCallback(lumino.callbacks.OPEN_CHANNEL, dispatch, callbackHandlers.successHandler);
      }
      if (callbackHandlers && callbackHandlers.errorHandler) {
        handleSdkCallback(lumino.callbacks.FAILED_OPEN_CHANNEL, dispatch, callbackHandlers.errorHandler);
      }
      background.rif.lumino.openChannel(partner, tokenAddress, (error) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

function closeChannel (partner, tokenAddress, tokenNetworkAddress, channelIdentifier, callbackHandlers = new CallbackHandlers()) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      if (callbackHandlers && callbackHandlers.requestHandler) {
        handleSdkCallback(lumino.callbacks.REQUEST_CLOSE_CHANNEL, dispatch, callbackHandlers.requestHandler);
      }
      if (callbackHandlers && callbackHandlers.successHandler) {
        handleSdkCallback(lumino.callbacks.CLOSE_CHANNEL, dispatch, callbackHandlers.successHandler);
      }
      if (callbackHandlers && callbackHandlers.errorHandler) {
        handleSdkCallback(lumino.callbacks.FAILED_CLOSE_CHANNEL, dispatch, callbackHandlers.errorHandler);
      }
      background.rif.lumino.closeChannel(partner, tokenAddress, tokenNetworkAddress, channelIdentifier, (error) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

function deleteChannelFromSdk (channelIdentifier, tokenAddress) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.lumino.deleteChannelFromSDK(channelIdentifier, tokenAddress, (error) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

function createDeposit (partner, tokenAddress, tokenNetworkAddress, channelIdentifier, netAmount, callbackHandlers = new CallbackHandlers()) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      if (callbackHandlers && callbackHandlers.requestHandler) {
        handleSdkCallback(lumino.callbacks.REQUEST_DEPOSIT_CHANNEL, dispatch, callbackHandlers.requestHandler);
      }
      if (callbackHandlers && callbackHandlers.successHandler) {
        handleSdkCallback(lumino.callbacks.DEPOSIT_CHANNEL, dispatch, callbackHandlers.successHandler);
      }
      if (callbackHandlers && callbackHandlers.errorHandler) {
        handleSdkCallback(lumino.callbacks.FAILED_DEPOSIT_CHANNEL, dispatch, callbackHandlers.errorHandler);
        handleSdkCallback(lumino.callbacks.DEPOSIT_CHANNEL_VALUE_TOO_LOW, dispatch, callbackHandlers.errorHandler);
      }
      background.rif.lumino.createDeposit(partner, tokenAddress, tokenNetworkAddress, channelIdentifier, netAmount, (error) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

function createPayment (partner, tokenAddress, netAmount, callbackHandlers = new CallbackHandlers()) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      if (callbackHandlers && callbackHandlers.requestHandler) {
        handleSdkCallback(lumino.callbacks.SENT_PAYMENT, dispatch, callbackHandlers.requestHandler);
      }
      if (callbackHandlers && callbackHandlers.successHandler) {
        handleSdkCallback(lumino.callbacks.COMPLETED_PAYMENT, dispatch, (result) => {
          if (!result.isReceived) {
            console.debug('Payment Completed', result);
            dispatch(niftyActions.displayToast('Payment Completed'));
            callbackHandlers.successHandler(result);
          }
        });
      }
      if (callbackHandlers && callbackHandlers.errorHandler) {
        handleSdkCallback(lumino.callbacks.FAILED_CREATE_PAYMENT, dispatch, callbackHandlers.errorHandler);
        handleSdkCallback(lumino.callbacks.FAILED_PAYMENT, dispatch, callbackHandlers.errorHandler);
        handleSdkCallback(lumino.callbacks.EXPIRED_PAYMENT, dispatch, callbackHandlers.errorHandler);
      }
      background.rif.lumino.createPayment(partner, tokenAddress, netAmount, (error) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

function getChannels () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.lumino.getChannels((error, channels) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error)
        }
        return resolve(channels);
      });
    });
  };
}

function getChannelsGroupedByNetwork () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      dispatch(getChannels()).then(channelObject => {
        const arrayWithoutKeys = [];
        if (Object.keys(channelObject).length !== 0) {
          for (var key in channelObject) {
            if (channelObject.hasOwnProperty(key)) {
              const channel = channelObject[key];
              arrayWithoutKeys.push(channel);
            }
          }
        }
        const groupedBy = _.groupBy(arrayWithoutKeys, 'token_network_identifier');
        return resolve(groupedBy);
      }).catch(error => {
        dispatch(niftyActions.displayWarning(error));
        reject(error)
      });
    });
  };
}

function getTokens () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.lumino.getTokens((error, tokens) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(tokens);
      });
    });
  };
}

function isLuminoNode (address) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.lumino.isLuminoNode(address, (error, isLuminoNode) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(isLuminoNode);
      });
    });
  };
}

function getTokensWithJoinedCheck () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      dispatch(this.getTokens()).then(tokens => {
        const tokensJoined = [];
        dispatch(this.getChannels()).then(channelObject => {
          const channels = Object.keys(channelObject).map(channelKey => channelObject[channelKey]);
          tokens.map(token => {
            const tokenJoined = token;
            tokenJoined.openedChannels = channels.filter(channel => ethUtils.toChecksumAddress(channel.token_address) === ethUtils.toChecksumAddress(token.address) &&
              channel.sdk_status === 'CHANNEL_OPENED');
            tokenJoined.joined = !!channels.find(channel => ethUtils.toChecksumAddress(channel.token_address) === ethUtils.toChecksumAddress(token.address));
            tokenJoined.userBalance = sumValuesOfArray(tokenJoined.openedChannels, 'balance');
            tokensJoined.push(tokenJoined);
          });
          resolve(tokensJoined);
        }).catch(err => {
          // If you have 0 channels opened, it will go here, so we need to resolve with only the tokens
          console.debug('Couldn\'t get channels', err);
          resolve(tokens);
        })
      }).catch(err => {
        reject(err);
      })
    });
  };
}

function getLuminoNetworks (userAddress) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      dispatch(this.getTokens()).then(tokens => {
        const networks = {
          withChannels: [],
          withoutChannels: [],
        }
        tokens.forEach(token => {
          const network = {
            symbol: token.symbol,
            tokenAddress: token.address,
            name: token.name,
            tokenNetwork: token.network_address,
            channels: token.channels.length,
            nodes: 0,
            userChannels: 0,
          }
          if (network.channels) {
            const nodesMap = {};
            // We check for the unique nodes in the channels
            token.channels.forEach(channel => {
              const {from_address: from, to_address: to} = channel;
              nodesMap[from] = true
              // If the user is one of the participants, this is one of their channels
              const toLower = value => value.toLowerCase();
              const lowerUserAddress = toLower(userAddress);
              if (toLower(from) === lowerUserAddress || toLower(to) === lowerUserAddress) {
                network.userChannels += 1
              }
            })
            network.nodes = Object.keys(nodesMap).length;
          }
          // Here we put it in the has channel or not key
          if (network.userChannels) return networks.withChannels.push(network);
          return networks.withoutChannels.push(network)
        })
        return resolve(networks);
      }).catch(err => {
        reject(err);
      })
    });
  };
}

function getLuminoNetworkData (tokenAddress) {
  return dispatch => {
    return new Promise((resolve, reject) => {
      const emptyNetwork = {
        symbol: '???',
        tokenAddress: '0x',
        name: '???',
        tokenNetwork: '0x',
        channels: 0,
        nodes: 0,
        userChannels: 0,
      }
      dispatch(this.getTokens()).then(tokens => {
        const data = tokens.find(n => n.address.toLowerCase() === tokenAddress.toLowerCase());
        if (data) {
          const nodesMap = {};
          data.channels.forEach(c => {
            const {from_address: from, to_address: to} = c;
            nodesMap[from] = true;
            nodesMap[to] = true;
          })
          const network = {
            symbol: data.symbol,
            tokenAddress: data.address,
            name: data.name,
            tokenNetwork: data.network_address,
            channels: data.channels.length,
            nodes: Object.keys(nodesMap).length,
          }
          return resolve(network);
        }
        resolve(emptyNetwork)
      }).catch(err => reject(err))
    })
  }

}


function getUserChannelsInNetwork (tokenAddress) {
  return (dispatch) => new Promise((resolve, reject) => {
    background.rif.lumino.getChannels((error, channels) => {
      if (error) {
        dispatch(niftyActions.displayWarning(error));
        return reject(error);
      }
      if (channels) {
        // We get only the values, since these are the ones we care about
        const channelsArr = Object.values(channels).filter(ch => ch.token_address.toLowerCase() === tokenAddress.toLowerCase());
        return resolve(channelsArr);
      }
      return resolve([]);
    });
  });
}

function cleanStore () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.cleanStore((error) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

function showRifLandingPage () {
  return {
    type: rifActions.RIF_LANDING_PAGE,
    params: {
      tabOptions: {
        showBack: true,
        screenTitle: 'My Domains',
        showTitle: true,
        tabIndex: 0,
      },
    },
  }
}

function setupDefaultLuminoCallbacks () {
  return (dispatch) => {
    return new Promise(resolve => {
      handleSdkDefaultCallback(lumino.callbacks.SIGNING_FAIL, dispatch, (error) => {
        console.debug('Error Signing', error);
        const errorMessage = parseLuminoError(error);
        if (errorMessage) {
          this.props.showToast(errorMessage, false);
        } else {
          dispatch(niftyActions.displayToast('Error Signing!', false));
        }
      });
      handleSdkDefaultCallback(lumino.callbacks.REQUEST_CLIENT_ONBOARDING, dispatch, (result) => {
        console.debug('Requesting onboarding', result);
        dispatch(niftyActions.displayToast('Requesting onboard to Hub'));
      });
      handleSdkDefaultCallback(lumino.callbacks.CLIENT_ONBOARDING_SUCCESS, dispatch, (result) => {
        console.debug('Onboarding success', result);
        dispatch(niftyActions.displayToast('Onboarding completed successfully'));
      });
      handleSdkDefaultCallback(lumino.callbacks.CLIENT_ONBOARDING_FAILURE, dispatch, (result) => {
        console.debug('Onboarding failure', result);
        dispatch(niftyActions.displayToast('Onboarding failure'));
      });
      handleSdkDefaultCallback(lumino.callbacks.RECEIVED_PAYMENT, dispatch, (result) => {
        console.debug('Receiving a payment', result);
        dispatch(niftyActions.displayToast('Receiving a payment from ' + result.payments.partner));
      });
      handleSdkDefaultCallback(lumino.callbacks.COMPLETED_PAYMENT, dispatch, (result) => {
        if (result.isReceived) {
          console.debug('Payment received', result);
          dispatch(niftyActions.displayToast('Payment received from ' + result.partner));
        } else {
          console.debug('Payment Completed', result);
          dispatch(niftyActions.displayToast('Payment Completed'));
        }
      });
      handleSdkDefaultCallback(lumino.callbacks.OPEN_CHANNEL, dispatch, (result) => {
        console.debug('A channel has been opened', result);
        dispatch(niftyActions.displayToast('A channel has been opened!'));
      });
      dispatch(luminoCallbacksRunning(true));
      return resolve();
    });
  };
}

function luminoCallbacksRunning (running) {
  return {
    type: rifActions.LUMINO_CALLBACKS_RUNNING,
    data: running,
  }
}

function createNetworkPayment (network, destination, amountInWei) {
  // TODO: network is not being used for now because we can't switch the network just to make a payment, we should
  // TODO: think about the ui and maybe refactor this, for now it will only pay on RBTC
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      dispatch(getSelectedAddress()).then(selectedAddress => {
        const txData = {
          from: selectedAddress,
          value: web3Utils.toHex(amountInWei),
          to: destination,
        };
        global.ethQuery.sendTransaction(txData, (err, _data) => {
          if (err) {
            return dispatch(niftyActions.displayWarning(err.message))
          }
        });
        resolve();
      }).catch(error => reject(error));
    });
  };
}


function subscribeToCloseChannel (channelId, tokenNetworkAddress) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.lumino.subscribeToCloseChannel(channelId, tokenNetworkAddress, (error) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

function getConfiguration () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.getConfiguration((error, configuration) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(configuration);
      });
    });
  };
}

function setConfiguration (configuration) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.setConfiguration(configuration, (error) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

function rifEnabled () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.enabled((error, enabled) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(enabled);
      });
    });
  };
}

function walletUnlocked () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rif.walletUnlocked((error, enabled) => {
        if (error) {
          dispatch(niftyActions.displayWarning(error));
          return reject(error);
        }
        return resolve(enabled);
      });
    });
  };
}


module.exports = rifActions
