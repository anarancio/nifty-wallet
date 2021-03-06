import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {CloseChannel, DepositOnChannel, Tabs} from '../../../components';
import rifActions from '../../../actions';
import {CallbackHandlers} from '../../../actions/callback-handlers';
import niftyActions from '../../../../actions';
import {validateAmountValue, validateDecimalAmount} from '../../../utils/validations';
import {getBalanceInEth, parseLuminoError} from '../../../utils/parse';
import {getLoader} from '../../../utils/components';
import {lumino} from '../../../../../../app/scripts/controllers/rif/constants';
import {getStatus} from '../../../utils/utils';
import {withTranslation} from "react-i18next";

const styles = {
  tabs: '',
  tabsBar: '',
  tabsContent: '',
  backButton: '',
  chevron: '',
  barItem: '',
  activeItem: '',
}

class LuminoChannels extends Component {
  static propTypes = {
    channel: PropTypes.object,
    sendLuminoPayment: PropTypes.func,
    showPopup: PropTypes.func,
    showToast: PropTypes.func,
    startListening: PropTypes.func,
    getChannels: PropTypes.func,
    t: PropTypes.func
  }

  constructor (props) {
    super(props);
    const {t} = this.props;
    this.state = {
      paymentInput: 0,
      isOpen: props.channel.sdk_status === 'CHANNEL_OPENED',
      channelStatus: this.getStatus(props.channel.sdk_status),
      loading: false,
      currentSdkStatus: props.channel.sdk_status,
      loadingMessage: t('Please Wait...'),
      balance: getBalanceInEth(props.channel.offChainBalance),
    };
    this.startListeningToEvents();
  }

  startListeningToEvents () {
    this.props.startListening([lumino.callbacks.COMPLETED_PAYMENT, lumino.callbacks.DEPOSIT_CHANNEL], (result) => {
      this.updateChannelState();
      this.startListeningToEvents();
    });
  }

  updateChannelState () {
    this.props.getChannels(this.props.channel.token_address).then(channels => {
      const channel = channels
        // we make sure that channel_identifier is there and it's valid, for some reason the sdk gets the channel_identifier as
        // strings or sometimes it's undefined
        .filter(ch => !isNaN(ch.channel_identifier))
        .find(ch => parseInt(ch.channel_identifier.toString()) === parseInt(this.props.channel.channel_identifier.toString()));
      const balance = getBalanceInEth(channel.offChainBalance);
      const isOpen = channel.sdk_status === 'CHANNEL_OPENED';
      const channelStatus = this.getStatus(channel.sdk_status);
      const currentSdkStatus = channel.sdk_status;
      this.setState({
        balance,
        isOpen,
        currentSdkStatus,
        channelStatus,
      })
      ;
    });
  }

  buildTabs () {
    const {channel, t} = this.props;
    const tabs = [];
    const addFundsTab = {
      index: 0,
      title: t('Add funds'),
      component: (
        <DepositOnChannel
          destination={channel.partner_address}
          channelIdentifier={channel.channel_identifier}
          tokenAddress={channel.token_address}
          tokenNetworkAddress={channel.token_network_identifier}
          tokenName={channel.token_name}
          tokenSymbol={channel.token_symbol}
          afterDepositCreated={(result) => this.updateChannelState()}
        />
      ),
    };
    tabs.push(addFundsTab);
    const payTab = {
      index: 1,
      title: t('Pay'),
      component: this.state.loading ? getLoader(this.state.loadingMessage) : (
        <div>
          <div className="form-segment">
            <input
              className="amount-input"
              type="text"
              placeholder={t('{{tokenSymbol}} Amount', {tokenSymbol: this.props.channel.token_symbol})}
              onKeyDown={event => this.validateAmount(event)}
              onChange={(e) => this.setState({paymentInput: e.target.value})}
            />
          </div>
          <div className="form-segment">
            <button disabled={!(this.state.paymentInput > 0)} className="btn-primary"
                    onClick={() => this.sendLuminoPayment()}>{t('Pay')}
            </button>
          </div>
        </div>
      ),
    };
    tabs.push(payTab);
    return tabs;
  }

  validateAmount (event) {
    return validateDecimalAmount(event, this.state.paymentInput);
  }

  sendLuminoPayment () {
    const {channel, t} = this.props;
    const callbackHandlers = new CallbackHandlers();
    callbackHandlers.requestHandler = (result) => {
      console.debug('PAYMENT REQUESTED', result);
      this.props.showToast(t('Payment Sent'));
    };
    callbackHandlers.successHandler = (result) => {
      this.setState({
        loading: false,
      });
      console.debug('PAYMENT DONE', result);
      this.props.showToast(t('Payment Delivered'));
      this.updateChannelState();
    };
    callbackHandlers.errorHandler = (error) => {
      this.setState({
        loading: false,
      });
      console.debug('PAYMENT ERROR', error);
      const errorMessage = parseLuminoError(error);
      this.props.showToast(errorMessage || t('Unknown Error trying to pay!'), false);
      this.updateChannelState();
    };
    this.props.showPopup(t('Pay'), {
      text: t('¿Are you sure you want to pay {{paymentInput}} tokens to partner {{partnerAddress}}?', {paymentInput: this.state.paymentInput, partnerAddress: channel.partner_address}),
      confirmLabel: t('Pay'),
      confirmCallback: async () => {
        if (!validateAmountValue(this.state.paymentInput)) {
          this.props.showToast(t('Invalid deposit amount, should be greater than 0'), false);
          return;
        }
        this.setState({
          loading: true,
          loadingMessage: t('Paying...'),
        });
        this.props.sendLuminoPayment(channel.token_address, channel.partner_address, this.state.paymentInput, callbackHandlers);
      },
    });
  }

  getStatus (sdkStatus) {
    let retVal;
    const statusText = getStatus(sdkStatus);
    switch (sdkStatus) {
      case 'CHANNEL_OPENED':
        retVal = (
          <div className="lumino-channel-open d-flex mx-auto align-items-center">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5 12C9.53757 12 12 9.53757 12 6.5C12 3.46243 9.53757 1 6.5 1" stroke="#59A42A"/>
              <path d="M6.5 1C3.46243 1 0.999999 3.46243 1 6.5C1 9.53757 3.46243 12 6.5 12" stroke="#59A42A"/>
              <path d="M4 6.375L5.09091 7.5L8.5 5" stroke="#59A42A"/>
            </svg>
            {statusText}
          </div>
        );
        break;
      case 'CHANNEL_WAITING_FOR_CLOSE':
        retVal = (
          <div className="lumino-channel-close mb-1">{statusText}</div>
        );
        break;
      default:
        retVal = (
          <div className="lumino-channel-close mb-1">{statusText}</div>
        );
    }
    return retVal;
  }

  closingMessage = () => {
    // eslint-disable-next-line camelcase
    const {currentSdkStatus} = this.state;
    const {t} = this.props;
    const messages = {
      'CHANNEL_WAITING_FOR_CLOSE': t('Closing channel\nPlease wait, this operation could take around 4 minutes'),
      'CHANNEL_CLOSED': t('Channel has been closed\nThe settlement will take around 2 hours'),
    }
    return messages[currentSdkStatus] || t('Closing channel\nPlease wait, this operation could take around 4 minutes');
  }

  render () {
    const {channel, t} = this.props;
    const {isOpen, channelStatus} = this.state;
    const tabs = this.buildTabs();
    return (
      <div className="lumino-channel-detail">
        <div className="d-flex align-items-center justify-center">
          {channelStatus}
          <div className="lumino-channel-detail__amount mx-auto">
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.291 11.041C4.599 11.013 4.86967 10.9477 5.103 10.845C5.33633 10.7377 5.53233 10.6023 5.691 10.439C5.85433 10.2757 5.97567 10.0867 6.055 9.872C6.139 9.65267 6.181 9.41233 6.181 9.151C6.181 8.91767 6.13667 8.717 6.048 8.549C5.964 8.381 5.84733 8.23633 5.698 8.115C5.54867 7.989 5.37367 7.884 5.173 7.8C4.97233 7.71133 4.75767 7.62967 4.529 7.555L4.291 11.041ZM4.06 2.949C3.75667 2.977 3.493 3.03767 3.269 3.131C3.04967 3.22433 2.86767 3.341 2.723 3.481C2.57833 3.621 2.471 3.77967 2.401 3.957C2.331 4.12967 2.296 4.31167 2.296 4.503C2.296 4.727 2.33567 4.923 2.415 5.091C2.49433 5.25433 2.604 5.399 2.744 5.525C2.884 5.651 3.04733 5.76067 3.234 5.854C3.42067 5.94733 3.62367 6.03133 3.843 6.106L4.06 2.949ZM4.613 6.351C4.949 6.45833 5.28033 6.57267 5.607 6.694C5.93367 6.81533 6.22767 6.97167 6.489 7.163C6.75033 7.35433 6.96033 7.59467 7.119 7.884C7.28233 8.16867 7.364 8.52567 7.364 8.955C7.364 9.375 7.294 9.76933 7.154 10.138C7.014 10.5067 6.80867 10.831 6.538 11.111C6.272 11.391 5.943 11.6197 5.551 11.797C5.16367 11.9697 4.72033 12.0723 4.221 12.105L4.137 13.33C4.13233 13.4187 4.09733 13.4957 4.032 13.561C3.96667 13.631 3.885 13.666 3.787 13.666H3.325L3.43 12.091C2.86533 12.035 2.34967 11.895 1.883 11.671C1.421 11.4423 1.022 11.153 0.686 10.803L1.064 10.229C1.10133 10.1777 1.148 10.1357 1.204 10.103C1.26 10.0703 1.32067 10.054 1.386 10.054C1.47467 10.054 1.575 10.0983 1.687 10.187C1.799 10.2757 1.93667 10.376 2.1 10.488C2.268 10.6 2.464 10.7097 2.688 10.817C2.91667 10.9243 3.18967 10.9967 3.507 11.034L3.759 7.317C3.43233 7.219 3.11033 7.10933 2.793 6.988C2.48033 6.86667 2.198 6.70567 1.946 6.505C1.69867 6.30433 1.498 6.05467 1.344 5.756C1.19467 5.45733 1.12 5.08167 1.12 4.629C1.12 4.28833 1.18533 3.957 1.316 3.635C1.45133 3.30833 1.64733 3.019 1.904 2.767C2.16067 2.515 2.47567 2.30967 2.849 2.151C3.22233 1.98767 3.64933 1.89667 4.13 1.878L4.2 0.87C4.20467 0.781333 4.23733 0.701999 4.298 0.631999C4.36333 0.562 4.44733 0.527 4.55 0.527H5.012L4.921 1.906C5.40633 1.96667 5.82633 2.09267 6.181 2.284C6.54033 2.47533 6.85767 2.70867 7.133 2.984L6.832 3.446C6.73867 3.586 6.63133 3.656 6.51 3.656C6.44467 3.656 6.363 3.628 6.265 3.572C6.17167 3.51133 6.05733 3.44133 5.922 3.362C5.79133 3.28267 5.635 3.20567 5.453 3.131C5.27567 3.05633 5.07267 3.00033 4.844 2.963L4.613 6.351Z"
                fill="#602A95"/>
            </svg>
            <span>&nbsp;{this.state.balance}</span>&nbsp;<small>{channel.token_symbol}</small>
          </div>
          {isOpen &&
          <CloseChannel
            partner={channel.partner_address}
            buttonLabel={t("Close")}
            tokenAddress={channel.token_address}
            tokenNetworkAddress={channel.token_network_identifier}
            tokenName={channel.token_name}
            channelIdentifier={channel.channel_identifier}
            afterCloseChannel={() => this.updateChannelState()}
            afterCloseChannelRequest={() => this.updateChannelState()}
          />
          }
        </div>
        <div id="description" className="lumino-channel-detail__description">
          <div className="channel-partner-address d-inline-flex align-items-center">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12.4838 11.7778H0.516217C0.745698 8.25555 3.38061 5.55554 6.5 5.55554C9.61939 5.55554 12.2543 8.25555 12.4838 11.7778Z"
                stroke="#602A95"/>
              <circle cx="6.50022" cy="2.88889" r="2.38889" stroke="#602A95"/>
            </svg>
            <span>{channel.partner_address}</span>
          </div>
        </div>
        {isOpen &&
        <Tabs tabs={tabs} classes={styles}/>
        }
        {!isOpen && <div className="mt-2">{getLoader(this.closingMessage())}</div>}
      </div>
    );
  }
}

function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  return {
    channel: params.channel,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    sendLuminoPayment: (token, destination, amount, callbackHandlers) => {
      return dispatch(rifActions.createPayment(destination, token, amount, callbackHandlers));
    },
    showPopup: (title, opts) => {
      dispatch(rifActions.showModal({
        title,
        ...opts,
      }));
    },
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    startListening: (callbackNames, callbackHandler) => dispatch(rifActions.listenCallbacks(callbackNames, callbackHandler)),
    getUserChannelsInNetwork: (tokenAddress) => dispatch(rifActions.getUserChannelsInNetwork(tokenAddress)),
    getChannels: (tokenAddress) => dispatch(rifActions.getUserChannelsInNetwork(tokenAddress)),
  }
}

module.exports = withTranslation('translations')(connect(mapStateToProps, mapDispatchToProps)(LuminoChannels))
