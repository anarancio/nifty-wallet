import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {connect} from 'react-redux'
import rifActions from '../../actions';
import LuminoNetworkItem from '../../components/LuminoNetworkItem';
import {pageNames} from '../names';
import {GenericTable} from '../../components';
import SearchLuminoNetworks from '../../components/searchLuminoNetworks';

const styles = {
  myLuminoNetwork: {
    title: 'lumino-table-title',
    table: 'n-table',
    tbodyTd: 'n-table-td',
    pagination: {
      body: 'n-table-pagination',
      buttonBack: 'n-table-pagination-back',
      indexes: '',
      activePageButton: 'n-table-pagination-active',
      inactivePageButton: 'n-table-pagination-inactive',
      buttonNext: 'n-table-pagination-next',
    },
  },
}

class LuminoHome extends Component {

  static propTypes = {
    getLuminoNetworks: PropTypes.func,
    currentAddress: PropTypes.string,
    navigateTo: PropTypes.func,
  }

  constructor (props) {
    super(props);
    this.state = {
      networks: {
        withChannels: [],
        withoutChannels: [],
      },
      filteredNetworks: {
        withChannels: [],
        withoutChannels: [],
      },
    }
  }

  async componentDidMount () {
    const {getLuminoNetworks, currentAddress} = this.props;
    const networks = await getLuminoNetworks(currentAddress);
    if (networks && networks.withChannels.length || networks.withoutChannels.length) {
      this.setState({
        networks,
        filteredNetworks: networks,
      });
    }
  }

  setFilteredNetworks = result => {
    const filteredNetworks = {
      withChannels: [],
      withoutChannels: [],
    }
    result.forEach(n => {
      if (n.userChannels) return filteredNetworks.withChannels.push(n);
      return filteredNetworks.withoutChannels.push(n);
    })
    return this.setState({filteredNetworks})
  }

  navigateToNetworkDetail = (network) => {
    const {navigateTo} = this.props;
    const {symbol, tokenAddress, name, tokenNetwork} = network;
    return navigateTo(symbol, tokenAddress, name, tokenNetwork)
  }

  getNetworkItems = networkArr => {
    return networkArr.map(network => {
      return {
        content: <LuminoNetworkItem key={network.symbol} userChannels={network.userChannels}
                                    symbol={network.symbol} nodes={network.nodes}
                                    channels={network.channels}
                                    onRightChevronClick={() => this.navigateToNetworkDetail(network)}/>,
      }
    });
  }

  render () {
    const {networks, filteredNetworks} = this.state;
    const myNetworks = this.getNetworkItems(filteredNetworks.withChannels)
    const otherNetworks = this.getNetworkItems(filteredNetworks.withoutChannels)
    const combinedNetworks = [...networks.withChannels, ...networks.withoutChannels];
    const quantityOfAllNetworks = networks.withoutChannels.length + networks.withoutChannels.length;
    const quantityOfFilteredNetworks = filteredNetworks.withoutChannels.length + filteredNetworks.withoutChannels.length;
    const itemsWereFiltered = quantityOfAllNetworks !== quantityOfFilteredNetworks;

    const columns = [{
      Header: 'Content',
      accessor: 'content',
    }];
    return (
      <div className="rif-home-body">
        <SearchLuminoNetworks data={combinedNetworks} setFilteredNetworks={this.setFilteredNetworks}/>
        {!itemsWereFiltered && <h2 className="page-title">Lumino networks directory</h2>}
        {itemsWereFiltered &&
        <div className="lumino-list-container">
          <GenericTable
            title={'Network Results'}
            classes={styles.myLuminoNetwork}
            columns={columns}
            data={[...myNetworks, ...otherNetworks]}
            paginationSize={3}/>
        </div>
        }
        {!itemsWereFiltered &&
        <div className="lumino-list-container">
          <GenericTable
            title={'My Lumino Networks'}
            classes={styles.myLuminoNetwork}
            columns={columns}
            data={myNetworks}
            paginationSize={3}/>
          <GenericTable
            title={'Lumino networks available'}
            classes={styles.myLuminoNetwork}
            columns={columns}
            data={otherNetworks}
            paginationSize={3}/>
        </div>
        }

      </div>
    );
  }
}

function mapStateToProps (state) {
  return {
    currentAddress: state.metamask.selectedAddress.toLowerCase(),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    getLuminoNetworks: (userAddress) => dispatch(rifActions.getLuminoNetworks(userAddress)),
    navigateTo: (networkSymbol, tokenAddress, networkName, tokenNetwork) => {
      dispatch(rifActions.navigateTo(pageNames.lumino.networkDetails, {
        networkSymbol,
        tokenAddress,
        networkName,
        tokenNetwork,
        tabOptions: {
          tabIndex: 1,
          showBack: true,
          showSearchbar: false,
        },
      }));
    },
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(LuminoHome)
