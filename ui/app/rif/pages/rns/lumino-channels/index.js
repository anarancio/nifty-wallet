import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {connect} from 'react-redux'
import { CloseChannel, DepositOnChannel, Tabs } from '../../../components';

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
    /*
      TODO Rodrigo
      Call the action when the user wants to pay.
      Add checks for the input (Or put a regex to only put numbers)
     */
    const payTab = {
      index: 1,
      title: 'Pay',
      component: (
        <div>
          <input type="text" onChange={(e) => this.setState({paymentInput: e.target.value})} />
          <button>Pay</button>
        </div>
      ),
    };
    tabs.push(payTab);
    return tabs;
  }
  render () {
    const { channel } = this.props;
    const tabs = this.buildTabs();
    return (
      <div>
        <CloseChannel
          partner={channel.partner_address}
          buttonLabel="Close"
          tokenAddress={channel.token_address}
          tokenNetworkAddress={channel.token_network_identifier}
          tokenName={channel.token_name}
          channelIdentifier={channel.channel_identifier}
        />
        <div id="description">
          <span>{channel.state}</span>
          <span>{channel.total_deposit} {channel.token_symbol}</span>
          {
            /*
            TODO Rodrigo
            This rns domain needs to be getted from background
            */
          }
          <span>pixel.rsk</span>
        </div>
        <Tabs tabs={tabs} classes={styles}/>
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
  return {}
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(LuminoChannels)
