import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {connect} from 'react-redux'
import rifActions from '../../actions';
import LuminoNetworkItem from '../../components/LuminoNetworkItem';
import {pageNames} from '../names';
import {GenericTable, OpenChannel} from '../../components';
import SearchLuminoNetworks from '../../components/searchLuminoNetworks';
import {withTranslation} from 'react-i18next';
import {getBlockUiMessage} from '../../utils/components';

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
    notFound: 'not-found-info',
  },
}

class LuminoHome extends Component {

  static propTypes = {
    getLuminoNetworks: PropTypes.func,
    currentAddress: PropTypes.string,
    navigateTo: PropTypes.func,
    t: PropTypes.func,
    isUsingHardwareWallet: PropTypes.bool,
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

  componentDidMount () {
    this.getLuminoNetworks();
  }

  async getLuminoNetworks () {
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
                                    onClick={() => this.navigateToNetworkDetail(network)}/>,
      }
    });
  }

  render () {
    const {networks, filteredNetworks} = this.state;
    const {t, isUsingHardwareWallet} = this.props;
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

    const hardwareMessage = isUsingHardwareWallet ? getBlockUiMessage(t('Not supported feature using hardware wallet')) : null;

    return (
      <div className={'rif-home-body' + (isUsingHardwareWallet ? ' block-ui' : '')}>
        {hardwareMessage}
        <SearchLuminoNetworks data={combinedNetworks} setFilteredNetworks={this.setFilteredNetworks}/>
        {!itemsWereFiltered && <h2 className="page-title">{t('Lumino networks directory')}</h2>}
        {itemsWereFiltered &&
        <div className="lumino-list-container">
          <GenericTable
            title={t('Network Results')}
            classes={styles.myLuminoNetwork}
            columns={columns}
            data={[...myNetworks, ...otherNetworks]}
            paginationSize={3}/>
        </div>
        }
        {!itemsWereFiltered &&
        <div className="lumino-list-container">
          <GenericTable
            title={t('My Lumino Networks')}
            classes={styles.myLuminoNetwork}
            columns={columns}
            data={myNetworks}
            paginationSize={3}/>
          <GenericTable
            title={t('Lumino networks available')}
            classes={styles.myLuminoNetwork}
            columns={columns}
            data={otherNetworks}
            paginationSize={3}/>
        </div>
        }
        <div className="lumino-list-container">
          <OpenChannel
            reloadChannels={() => this.getLuminoNetworks()}
            afterChannelCreated={() => this.getLuminoNetworks()}
          />
        </div>
      </div>
    );
  }
}

function mapStateToProps (state) {
  return {
    currentAddress: state.metamask.selectedAddress.toLowerCase(),
    isUsingHardwareWallet: state.appState.isUsingHardwareWallet,
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

module.exports = withTranslation('translations')(connect(mapStateToProps, mapDispatchToProps)(LuminoHome))
