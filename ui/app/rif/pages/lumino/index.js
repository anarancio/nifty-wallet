import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {connect} from 'react-redux'
import rifActions from '../../actions';
import LuminoNetworkItem from '../../components/LuminoNetworkItem';
import {pageNames} from '../names';

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
    }
  }

  async componentDidMount () {
    const {getLuminoNetworks, currentAddress} = this.props;
    const networks = await getLuminoNetworks(currentAddress);
    if (networks && networks.withChannels.length || networks.withoutChannels.length) this.setState({networks});
  }

  render () {
    const {networks} = this.state;
    const {navigateTo} = this.props;
    // TODO: Replace .map with instances of the <GenericTable /> from other branches
    return (
      <div className="body">
        <div>My Lumino networks available</div>
        {networks.withChannels.map(n => <LuminoNetworkItem key={n.symbol} userChannels={n.userChannels}
                                                           symbol={n.symbol} nodes={n.nodes}
                                                           channels={n.channels}
                                                           onRightChevronClick={() => navigateTo(n.symbol)}/>,
        )}
        <div>Lumino networks available</div>
        {networks.withoutChannels.map(n => <LuminoNetworkItem key={n.symbol} symbol={n.symbol} nodes={n.nodes}
                                                              channels={n.channels}
                                                              onRightChevronClick={() => navigateTo(n.symbol)}/>,
        )}
      </div>
    );
  }
}

function mapStateToProps (state) {
  // params is the params value or object passed to rifActions.navigateTo('pageName', params)
  // const params = state.appState.currentView.params;
  return {
    currentAddress: state.metamask.selectedAddress.toLowerCase(),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    getLuminoNetworks: (userAddress) => dispatch(rifActions.getLuminoNetworks(userAddress)),
    navigateTo: (networkSymbol) => {
      dispatch(rifActions.navigateTo(pageNames.lumino.networkDetails, {
        networkSymbol,
        tabOptions: {
          tabIndex: 1,
        },
      }));
    },
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(LuminoHome)