import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import { GenericTable } from './index';
import rifActions from '../actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import {withTranslation} from "react-i18next";

class TokenNetworkChannels extends Component {

  static propTypes = {
    paginationSize: PropTypes.number,
    getChannels: PropTypes.func,
    getChannel: PropTypes.func,
    classes: PropTypes.any,
    t: PropTypes.func
  }

  constructor (props) {
    super(props);
    this.state = {
      channelsData: [],
    };
  }

  loadData () {
    const { classes } = this.props;
    this.getChannels().then(channels => {
      channels.map((channelJson) => {
        const channel = channelJson[Object.keys(channelJson)[0]];
        const tableRow = {};
        tableRow.content =(
          <div className={classes.content}>
            <span>{channel.partner_address}</span>
          </div>
        )
        tableRow.actions = (
          <div className={classes.contentActions}>
            <FontAwesomeIcon icon={faChevronRight} onClick={() => this.props.getChannel()}/>
          </div>
        )
        this.setState({
          channelsData: [...this.state.channelsData, tableRow],
        });
      });
    });
  }

  componentDidMount () {
    this.loadData();
  }

  async getChannels () {
    return await this.props.getChannels();
  }

  render () {
    const { paginationSize, classes,t } = this.props;
    const { channelsData } = this.state;
    return (
      <GenericTable
        title={t('Lumino Channels')}
        columns={[
          {
            Header: 'Content',
            accessor: 'content',
          },
          {
            Header: 'actions',
            accessor: 'actions',
          },
        ]}
        data={channelsData}
        paginationSize={paginationSize || 3}
        className={classes}
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
module.exports = withTranslation('translations')(connect(mapStateToProps, mapDispatchToProps)(TokenNetworkChannels));
