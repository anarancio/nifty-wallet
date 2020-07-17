import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import { GenericTable } from './index';
import rifActions from '../actions';
import ItemWithActions from './item-with-actions';

class LuminoChannels extends Component {

  static propTypes = {
    paginationSize: PropTypes.number,
    getChannels: PropTypes.func,
    getChannel: PropTypes.func,
    classes: PropTypes.any,
  }

  constructor (props) {
    super(props);
    this.state = {
      channels: [],
    };
  }

  getData () {
    const {classes} = this.props;
    if (this.state.channels) {
      return this.state.channels.map((channel) => {
        const item = <ItemWithActions contentClasses={classes.content} actionClasses={classes.contentActions}
                                      text={channel.partner_address} enableRightChevron={true}/>
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
    this.props.getChannels().then(channels => {
      channels.map(channelJson => {
        const channel = channelJson[Object.keys(channelJson)[0]];
        this.setState({
          channels: [...this.state.channels, channel],
        });
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
    getChannels: () => dispatch(rifActions.getChannels()),
    getChannel: () => {},
  }
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(LuminoChannels);
