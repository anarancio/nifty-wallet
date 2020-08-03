import React, {Component} from 'react';
import {connect} from 'react-redux';
import rifActions from '../../actions';
import PropTypes from 'prop-types';
import {ChannelStatusChip} from './index';
import {getStatusForChannel} from '../../utils/utils'

class ChannelChiplet extends Component {
  static propTypes = {
    address: PropTypes.string,
    balance: PropTypes.number,
    tokenSymbol: PropTypes.string,
    status: PropTypes.string,
    getDomainByAddress: PropTypes.func,
  }
  render () {
    const { address, balance, tokenSymbol, status } = this.props;
      return (<div className={'channels-info-chiplet'}>
        <div className={'channels-info-chiplet-text'}>
          <div className={'channels-info-chiplet-text-domain'}>{address}</div>
          <div className={'channels-info-chiplet-text-balance'}>{t('Your balance:')} <span>{balance} {tokenSymbol}</span></div>
        </div>
        <div className={'channels-info-chiplet-status'}>
          <div>{ChannelStatusChip(getStatusForChannel(status))}</div>
        </div>
      </div>)
  }
}

function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  return {
    dispatch: state.dispatch,
    ...params,
  }
}

module.exports = connect(mapStateToProps)(ChannelChiplet)
