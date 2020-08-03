import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import rifActions from '../../../actions';
import {CallbackHandlers} from '../../../actions/callback-handlers';
import niftyActions from '../../../../actions';
import {parseLuminoError} from '../../../utils/parse';
import {withTranslation} from "react-i18next";

class CloseChannel extends Component {

  static propTypes = {
    buttonLabel: PropTypes.string,
    partner: PropTypes.string.isRequired,
    tokenAddress: PropTypes.string.isRequired,
    tokenNetworkAddress: PropTypes.string.isRequired,
    tokenName: PropTypes.string.isRequired,
    channelIdentifier: PropTypes.number.isRequired,
    showToast: PropTypes.func,
    showPopup: PropTypes.func,
    closeChannel: PropTypes.func,
    afterCloseChannel: PropTypes.func,
    afterCloseChannelRequest: PropTypes.func,
    subscribeToCloseChannel: PropTypes.func,
    t: PropTypes.func
  }

  closeChannelModal () {
    const {t, channelIdentifier, partner, tokenName} = this.props;
    this.props.showPopup('Close Channel', {
      text: t(`Are you sure you want to close channel {{channelIdentifier}} with partner {{partner}} for token {{tokenName}}?`, {channelIdentifier, partner, tokenName}),
      confirmCallback: async () => {
        const callbackHandlers = new CallbackHandlers();
        callbackHandlers.requestHandler = async (result) => {
          console.debug('CLOSE CHANNEL REQUESTED', result);
          this.props.showToast(t('Requesting Close Channel'));
          if (this.props.afterCloseChannelRequest) {
            this.props.afterCloseChannelRequest(result);
          }
        };
        callbackHandlers.successHandler = async (result) => {
          console.debug('CLOSE CHANNEL DONE', result);
          if (this.props.afterCloseChannel) {
            this.props.afterCloseChannel(result);
          }
          this.props.showToast(t('Channel Closed Successfully!'));
        };
        callbackHandlers.errorHandler = (error) => {
          console.debug('CLOSE CHANNEL ERROR', error);
          const errorMessage = parseLuminoError(error);
          this.props.showToast(errorMessage || t('Unknown Error trying to close channel!'), false);
        };
        await this.props.closeChannel(this.props.partner, this.props.tokenAddress, this.props.tokenNetworkAddress, this.props.channelIdentifier, callbackHandlers);
      },
    });
  }

  render () {
    const {t} = this.props;
    return (
      <div className="d-flex mx-auto">
        <button className="btn-primary btn-primary-outlined ml-auto"
                onClick={() => this.closeChannelModal()}>{this.props.buttonLabel ? this.props.buttonLabel : t('Close')}</button>
      </div>
    );
  }
}

function mapDispatchToProps (dispatch) {
  return {
    closeChannel: (partner, tokenAddress, tokenNetworkAddress, channelIdentifier, callbackHandlers) =>
      dispatch(rifActions.closeChannel(partner, tokenAddress, tokenNetworkAddress, channelIdentifier, callbackHandlers)),
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    showPopup: (title, opts) => {
      dispatch(rifActions.showModal({
        title,
        ...opts,
      }));
    },
  };
}

module.exports = withTranslation('translations')(connect(null, mapDispatchToProps)(CloseChannel))
