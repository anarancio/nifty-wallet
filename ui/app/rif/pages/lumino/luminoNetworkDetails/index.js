import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {connect} from 'react-redux'
import rifActions from '../../../actions';
import LuminoChannelItem from '../../../components/luminoChannelItem';

class LuminoNetworkDetails extends Component {

  static propTypes = {
    networkSymbol: PropTypes.string,
    networkAddress: PropTypes.string,
    getUserChannels: PropTypes.func,
  }

  constructor (props) {
    super(props);
    this.state = {
      loading: false,
      networkData: {
        channels: 0,
        nodes: 0,
      },
      userChannels: [],
    }
  }


  async componentDidMount () {
    const {getUserChannels} = this.props;
    const userChannels = await getUserChannels();
    if (userChannels && userChannels.length) return this.setState({userChannels})
    // TODO: Run again a function to resolve addresses to RNS domains
  }

  render () {
    const {networkSymbol} = this.props;
    const {userChannels} = this.state;
    return (
      <div className="body">
        <div>{networkSymbol} Network</div>
        <button>Leave</button>
        <div>
          {userChannels.map(c => <LuminoChannelItem key={c.channel_identifier} partnerAddress={c.partner_address}
                                                    balance={c.balance}
                                                    state={c.state} tokenSymbol={networkSymbol}
                                                    onRightChevronClick={() => console.warn(c)}/>)}
        </div>

      </div>
    );
  }
}

function mapStateToProps (state) {
  // params is the params value or object passed to rifActions.navigateTo('pageName', params)
  const params = state.appState.currentView.params;
  return {
    currentAddress: state.metamask.selectedAddress.toLowerCase(),
    networkSymbol: params.networkSymbol,
    networkAddress: params.networkAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    getUserChannels: networkAddress => dispatch(rifActions.getUserChannelsInNetwork(networkAddress)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(LuminoNetworkDetails)
