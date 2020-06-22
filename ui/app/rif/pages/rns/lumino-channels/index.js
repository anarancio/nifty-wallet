import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { CloseChannel, DepositOnChannel, Tabs } from '../../../components';
import rifActions from '../../../actions';
import {CallbackHandlers} from '../../../actions/callback-handlers';
import niftyActions from '../../../../actions';
import {validateDecimalAmount} from '../../../utils/validations';
import {getBalanceInEth} from '../../../utils/parse';

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
  }
  constructor (props) {
    super(props);
    this.state = {
      paymentInput: 0,
    };
  }
  buildTabs () {
    const { channel } = this.props;
    const tabs = [];
    const addFundsTab = {
      index: 0,
      title: 'Add funds',
      component: (
        <DepositOnChannel
          destination={channel.partner_address}
          channelIdentifier={channel.channel_identifier}
          tokenAddress={channel.token_address}
          tokenNetworkAddress={channel.token_network_identifier}
          tokenName={channel.token_name}
          tokenSymbol={channel.token_symbol}
        />
      ),
    };
    tabs.push(addFundsTab);
    const payTab = {
      index: 1,
      title: 'Pay',
      component: (
        <div>
          <input
            type="text"
            onKeyDown={event => this.validateAmount(event)}
            onChange={(e) => this.setState({paymentInput: e.target.value})}
          />
          <button onClick={() => this.sendLuminoPayment()}>Pay</button>
        </div>
      ),
    };
    tabs.push(payTab);
    return tabs;
  }

  validateAmount (event) {
    return validateDecimalAmount(event, this.state.amount);
  }

  sendLuminoPayment () {
    const { channel } = this.props;
    const callbackHandlers = new CallbackHandlers();
    callbackHandlers.requestHandler = (result) => {
      console.debug('PAYMENT REQUESTED', result);
      this.props.showToast('Payment Sent');
    };
    callbackHandlers.successHandler = (result) => {
      console.debug('PAYMENT DONE', result);
      this.props.showToast('Payment Delivered');
    };
    callbackHandlers.errorHandler = (error) => {
      console.debug('PAYMENT ERROR', error);
      this.props.showToast('Error trying to pay!', false);
    };
    this.props.showPopup('Pay', {
      text: 'Are you sure you want to pay ' + this.state.paymentInput + ' tokens to partner ' + channel.partner_address + '?',
      confirmLabel: 'Pay',
      confirmCallback: async () => {
        if (this.state.paymentInput) {
          this.props.sendLuminoPayment(channel.token_address, channel.partner_address, this.state.paymentInput, callbackHandlers);
        } else {
          this.props.showToast('You need to put the amount first.', false);
        }
      },
    });
  }
  getStatus (sdkStatus) {
    let retVal;
    switch (sdkStatus) {
      case 'CHANNEL_OPENED':
        retVal = (
          <span>Open</span>
        )
        break;
      default:
        retVal = (
          <span>Close</span>
        )
    }
    return retVal;
  }
  render () {
    const { channel } = this.props;
    const tabs = this.buildTabs();
    return (
      <div>
        {channel.sdk_status === 'CHANNEL_OPENED' &&
          <CloseChannel
            partner={channel.partner_address}
            buttonLabel="Close"
            tokenAddress={channel.token_address}
            tokenNetworkAddress={channel.token_network_identifier}
            tokenName={channel.token_name}
            channelIdentifier={channel.channel_identifier}
          />
        }
        <div id="description">
          {
            this.getStatus(channel.sdk_status)
          }
          <span><span>$</span>{getBalanceInEth(channel.total_deposit)} {channel.token_symbol}</span>
          <span>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.4838 11.7778H0.516217C0.745698 8.25555 3.38061 5.55554 6.5 5.55554C9.61939 5.55554 12.2543 8.25555 12.4838 11.7778Z" stroke="#602A95"/>
              <circle cx="6.50022" cy="2.88889" r="2.38889" stroke="#602A95"/>
            </svg>
            {channel.partner_address}
          </span>
        </div>
        {channel.sdk_status === 'CHANNEL_OPENED' &&
          <Tabs tabs={tabs} classes={styles}/>
        }
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
  }
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(LuminoChannels)
