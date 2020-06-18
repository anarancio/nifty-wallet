import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {connect} from 'react-redux'
import rifActions from '../../../actions';
import LuminoChannelItem from '../../../components/luminoChannelItem';
import OpenChannel from '../../../components/lumino/open-channel';
import {GenericTable} from '../../../components';

class LuminoNetworkDetails extends Component {

  static propTypes = {
    networkSymbol: PropTypes.string,
    tokenNetwork: PropTypes.string,
    getUserChannels: PropTypes.func,
    getNetworkData: PropTypes.func,
    tokenAddress: PropTypes.string,
    networkName: PropTypes.string,
  }

  constructor (props) {
    super(props);
    this.state = {
      loading: true,
      networkData: {
        channels: 0,
        nodes: 0,
      },
      userChannels: [],
    }
  }

  reloadChannelsData = async () => {
    const {getUserChannels, tokenAddress, getNetworkData} = this.props;
    const userChannels = await getUserChannels(tokenAddress);
    if (userChannels && userChannels.length) this.setState({userChannels, loading: false})
    const networkData = await getNetworkData(tokenAddress);
    if (networkData) this.setState({networkData})
  }


  async componentDidMount () {
    await this.reloadChannelsData();
    // TODO: Run again a function to resolve addresses to RNS domains
    return this.setState({loading: false})
  }

  getChannelItems = channels => {
    const {networkSymbol} = this.props;
    return channels.map(c => {
      return {
        content: <LuminoChannelItem key={c.channel_identifier} partnerAddress={c.partner_address}
                                    balance={c.balance}
                                    state={c.state} tokenSymbol={networkSymbol}
                                    onRightChevronClick={() => console.warn(c)}/>,
      };
    });
  }

  render () {
    const {networkSymbol, networkName, tokenNetwork, tokenAddress} = this.props;
    const {userChannels, loading, networkData} = this.state;
    const channelItems = this.getChannelItems(userChannels);
    const columns = [{
      Header: 'Content',
      accessor: 'content',
    }];
    return (
      <div className="body">
        <div>{networkSymbol} Network</div>
        <div>
          <div>
            <img height={15} width={15} src="images/rif/node.svg"/>
            {networkData.nodes} nodes
          </div>
          <div>
            <img height={15} width={15} src="images/rif/node.svg"/>
            {networkData.channels} channels
          </div>

        </div>
        <button>Leave</button>
        {loading && <div>Loading data</div>}
        {!loading && <div>
          {!!userChannels.length &&
          <GenericTable
            title={`My channels in ${networkSymbol} network`}
            columns={columns}
            data={channelItems}
            paginationSize={3}/>
          }
          {!userChannels.length && <div>
            <div>
              No channels yet
            </div>
            <div>Add a channel to join the {networkSymbol} network</div>
          </div>
          }
        </div>
        }
        <OpenChannel
          tokenAddress={tokenAddress}
          tokenNetworkAddress={tokenNetwork}
          tokenName={networkName}
          afterChannelCreated={this.reloadChannelsData}
          afterDepositCreated={this.reloadChannelsData}
          tokenSymbol={networkSymbol}/>
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
    tokenNetwork: params.tokenNetwork,
    tokenAddress: params.tokenAddress,
    networkName: params.networkName,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    getUserChannels: tokenAddress => dispatch(rifActions.getUserChannelsInNetwork(tokenAddress)),
    getNetworkData: tokenAddress => dispatch(rifActions.getLuminoNetworkData(tokenAddress)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(LuminoNetworkDetails)
