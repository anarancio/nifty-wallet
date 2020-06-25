import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {GenericTable, OpenChannel} from './index';
import rifActions from '../actions';
import ItemWithActions from './item-with-actions';
import {faCoins} from '@fortawesome/free-solid-svg-icons';
import {pageNames} from '../pages';

class LuminoNetworkChannels extends Component {

  static propTypes = {
    pageName: PropTypes.string.isRequired,
    isOwner: PropTypes.bool,
    paginationSize: PropTypes.number,
    getChannelsGroupedByNetwork: PropTypes.func,
    showNetworkDetails: PropTypes.func,
    classes: PropTypes.any,
    tabIndex: PropTypes.number,
  }

  constructor (props) {
    super(props);
    this.state = {
      networkChannels: [],
    };
  }

  getData () {
    const {tabIndex, classes} = this.props;
    if (this.state.networkChannels) {
      return this.state.networkChannels.map(networkChannel => {
        const item = (<ItemWithActions
          leftIcon={{icon: faCoins, color: '#05836D'}}
          contentClasses={classes.content}
          actionClasses={classes.contentActions}
          text={networkChannel.symbol}
          enableRightChevron={true}
          onRightChevronClick={() => this.props.showNetworkDetails({
            networkSymbol: networkChannel.symbol,
            tokenAddress: networkChannel.address,
            tokenNetwork: networkChannel.tokenNetwork,
            networkName: networkChannel.name,
            tabIndex: tabIndex,
          })}
        />)
        return {
          content: item,
        }
      });
    }
    return [];
  }

  componentDidMount () {
    this.loadChannels();
  }

  loadChannels () {
    this.props.getChannelsGroupedByNetwork().then(networkChannels => {
      const arrayNetworks = [];
      for (const key of Object.keys(networkChannels)) {
        const channels = networkChannels[key];
        const network = {
          tokenNetwork: channels[0].token_network_identifier,
          address: channels[0].token_address,
          symbol: channels[0].token_symbol,
          name: channels[0].token_name,
          channels: channels,
        }
        arrayNetworks.push(network);
      }
      this.setState({
        networkChannels: arrayNetworks,
      });
    });
  }

  render () {
    const {isOwner, paginationSize, classes} = this.props;
    const data = this.getData();
    return (
      <div>
        {
          data.length > 0 &&
          <div>
            <GenericTable
              title={'Lumino Channels'}
              columns={[
                {
                  Header: 'Content',
                  accessor: 'content',
                },
              ]}
              data={data}
              paginationSize={paginationSize || 3}
              classes={classes}
            />
          </div>
        }
        {
          data.length === 0 &&
          <div>
            <span className={classes.title}>Lumino Channels</span>
            <span className={classes.notFound}>No channels found</span>
          </div>
        }
        {isOwner &&
        <OpenChannel afterChannelCreated={() => this.loadChannels()}/>
        }
      </div>
    );
  }
}

function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  return {
    ...params,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showNetworkDetails: (params) => dispatch(rifActions.navigateTo(pageNames.lumino.networkDetails, {
      ...params,
      tabOptions: {
        showSearchbar: false,
        showBack: true,
        tabIndex: params.tabIndex,
      },
    })),
    getChannelsGroupedByNetwork: () => dispatch(rifActions.getChannelsGroupedByNetwork()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(LuminoNetworkChannels);
