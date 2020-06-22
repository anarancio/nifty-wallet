import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import rifActions from '../../../actions';
import {CallbackHandlers} from '../../../actions/callback-handlers';
import niftyActions from '../../../../actions';

class CloseChannel extends Component {

  static propTypes = {
    buttonLabel: PropTypes.string,
    partner: PropTypes.string.isRequired,
    tokenAddress: PropTypes.string.isRequired,
    tokenNetworkAddress: PropTypes.string.isRequired,
    tokenName: PropTypes.string.isRequired,
    channelIdentifier: PropTypes.string.isRequired,
    showToast: PropTypes.func,
    showPopup: PropTypes.func,
    closeChannel: PropTypes.func,
    deleteChannelFromSdk: PropTypes.func,
    afterCloseChannel: PropTypes.func,
    subscribeToCloseChannel: PropTypes.func,
  }

  closeChannelModal () {
    this.props.showPopup('Close Channel', {
      text: `Are you sure you want to close channel ${this.props.channelIdentifier} with partner ${this.props.partner} for token ${this.props.tokenName}?`,
      confirmCallback: async () => {
        const callbackHandlers = new CallbackHandlers();
        callbackHandlers.requestHandler = async (result) => {
          console.debug('CLOSE CHANNEL REQUESTED', result);
          this.props.showToast('Requesting Close Channel');
          await this.props.subscribeToCloseChannel(this.props.channelIdentifier, this.props.tokenAddress);
        };
        callbackHandlers.successHandler = async (result) => {
          console.debug('CLOSE CHANNEL DONE', result);
          await this.props.deleteChannelFromSdk(this.props.channelIdentifier, this.props.tokenAddress);
          if (this.props.afterCloseChannel) {
            this.props.afterCloseChannel(result);
          }
          this.props.showToast('Channel Closed Successfully!');
        };
        callbackHandlers.errorHandler = (result) => {
          console.debug('CLOSE CHANNEL ERROR', result);
          const errorMessage = result.response.data.errors;
          if (errorMessage) {
            this.props.showToast(errorMessage, false);
          } else {
            this.props.showToast('Unknown Error trying to close channel!', false);
          }
        };
        await this.props.closeChannel(this.props.partner, this.props.tokenAddress, this.props.tokenNetworkAddress, this.props.channelIdentifier, callbackHandlers);
      },
    });
  }

  render () {
    return (
      <div className="d-flex mb-1">
        <button className="btn-primary btn-primary-outlined ml-auto" onClick={() => this.closeChannelModal()}>{this.props.buttonLabel ? this.props.buttonLabel : 'Close'}</button>
      </div>
    );
  }
}

function mapDispatchToProps (dispatch) {
  return {
    closeChannel: (partner, tokenAddress, tokenNetworkAddress, channelIdentifier, callbackHandlers) =>
      dispatch(rifActions.closeChannel(partner, tokenAddress, tokenNetworkAddress, channelIdentifier, callbackHandlers)),
    deleteChannelFromSdk: (channelIdentifier, tokenAddress) => dispatch(rifActions.deleteChannelFromSdk(channelIdentifier, tokenAddress)),
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    showPopup: (title, opts) => {
      dispatch(rifActions.showModal({
        title,
        ...opts,
      }));
    },
    subscribeToCloseChannel: (channelIdentifier, tokenAddress) => dispatch(rifActions.subscribeToCloseChannel(channelIdentifier, tokenAddress)),
  };
}

module.exports = connect(null, mapDispatchToProps)(CloseChannel)
