import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import { GenericTable } from './index';
import rifActions from '../actions';
import ItemWithActions from './item-with-actions';
import { faCoins } from '@fortawesome/free-solid-svg-icons';

class LuminoNetworkChannels extends Component {

  static propTypes = {
    paginationSize: PropTypes.number,
    getChannelsGroupedByNetwork: PropTypes.func,
    getChannel: PropTypes.func,
    classes: PropTypes.any,
  }

  constructor (props) {
    super(props);
    this.state = {
      networkChannels: [],
    };
  }

  getData () {
    const {classes} = this.props;
    if (this.state.networkChannels) {
      return this.state.networkChannels.map(networkChannel => {
        const item = <ItemWithActions leftIcon={{icon: faCoins, color: '#05836D'}} contentClasses={classes.content} actionClasses={classes.contentActions}
                                      text={networkChannel.token_symbol} enableRightChevron={true}/>
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
      for (let key of Object.keys(networkChannels)) {
        const network = {
          token_network_identifier: key,
          token_symbol: networkChannels[key][0].token_symbol,
          channels: networkChannels[key],
        }
        arrayNetworks.push(network);
      }
      this.setState({
        networkChannels: arrayNetworks,
      });
    });
  }

  render () {
    const { paginationSize, classes } = this.props;
    const data = this.getData();
    return (
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
    getChannelsGroupedByNetwork: () => dispatch(rifActions.getChannelsGroupedByNetwork()),
    getChannel: () => {},
  }
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(LuminoNetworkChannels);
