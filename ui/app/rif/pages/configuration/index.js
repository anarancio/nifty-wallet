import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import rifActions from '../../actions';
import niftyActions from '../../../actions';

class RifConfiguration extends Component {

  static propTypes = {
    updateConfiguration: PropTypes.func,
    getConfiguration: PropTypes.func,
    goToSettings: PropTypes.func,
    showToast: PropTypes.func,
  }

  constructor (props) {
    super(props);
    this.state = {
      configuration: null,
      loading: true,
      notifierNode: null,
    };
    this.props.getConfiguration()
      .then(configuration => {
        this.setState({
          configuration,
          loading: false,
        });
      });
  }

  updateLuminoHubConfiguration (event) {
    const luminoHubEndpoint = event.target.value;
    const configuration = this.state.configuration;
    configuration.lumino.hub.endpoint = luminoHubEndpoint;
    this.setState({
      configuration,
    });
  }

  updateExplorerConfiguration (event) {
    const explorerEndpoint = event.target.value;
    const configuration = this.state.configuration;
    configuration.lumino.explorer.endpoint = explorerEndpoint;
    this.setState({
      configuration,
    });
  }

  updateNotifierNodeToAdd (event) {
    const endpoint = event.target.value;
    this.setState({
      notifierNode: endpoint,
    });
  }

  saveNotifierNode () {
    const configuration = this.state.configuration;
    configuration.notifier.availableNodes.push(this.state.notifierNode);
    this.setState({
      configuration,
      notifierNode: null,
    });
  }

  getNotifierInputs () {
    const configuration = this.state.configuration;
    const notifierInputs = [];
    configuration.notifier.availableNodes.forEach((availableNode, index) => {
      notifierInputs.push(<li className="d-flex">
                            <input onChange={(event) => this.updateNotifierNode(event, index)} value={availableNode} placeholder="Notifier Endpoint" />
                            <span className="btn-remove" onClick={() => this.deleteNotifierNode(index)}>
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="12" y1="0.707107" x2="0.707108" y2="12" stroke="#ffffff" stroke-linecap="round"/>
                                <line x1="0.707107" y1="1" x2="12" y2="12.2929" stroke="#ffffff" stroke-linecap="round"/>
                              </svg>
                            </span>
                          </li>);
    });
    if (this.state.notifierNode) {
      notifierInputs.push(<li className="d-flex">
                            <input onChange={(event) => this.updateNotifierNodeToAdd(event)} placeholder="Notifier Endpoint" />
                            <span className="btn-check" onClick={() => this.saveNotifierNode()}>
                              <svg width="14" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                <path fill="#ffffff" d="M413.505 91.951L133.49 371.966l-98.995-98.995c-4.686-4.686-12.284-4.686-16.971 0L6.211 284.284c-4.686 4.686-4.686 12.284 0 16.971l118.794 118.794c4.686 4.686 12.284 4.686 16.971 0l299.813-299.813c4.686-4.686 4.686-12.284 0-16.971l-11.314-11.314c-4.686-4.686-12.284-4.686-16.97 0z">
                                </path>
                              </svg>
                            </span>
                          </li>);
    }
    return notifierInputs;
  }

  addNotifierInput () {
    this.setState({
      notifierNode: true,
    });
  }

  updateContractAddress (contractKey, event) {
    const address = event.target.value;
    const configuration = this.state.configuration;
    if (contractKey && configuration) {
      configuration.rns.contracts[contractKey] = address;
      this.setState({
        configuration,
      });
    }
  }

  updateNotifierNode (event, index) {
    const configuration = this.state.configuration;
    const endpoint = event.target.value;
    if (index !== undefined && configuration) {
      configuration.notifier.availableNodes.push(endpoint);
      this.setState({
        configuration,
      });
    }
  }

  deleteNotifierNode (index) {
    const configuration = this.state.configuration;
    if (index !== undefined && configuration) {
      configuration.notifier.availableNodes.splice(index, 1);
      this.setState({
        configuration,
      });
    }
  }

  saveConfiguration () {
    const configuration = this.state.configuration;
    this.props.updateConfiguration(configuration)
      .then(done => {
        this.props.goToSettings();
      }).catch(error => {
        this.props.showToast('Error trying to update configuration: ' + error.message, false);
    });
  }

  render () {
    if (this.state.loading) {
      return (<div>Loaing Configuration...</div>);
    }
    const notifierInputs = this.getNotifierInputs();
    return (
      <div className="settings-body">
        <ul>
          <li>
            <label>Lumino HUB</label>
            <input value={this.state.configuration.lumino.hub.endpoint} onChange={(event) => this.updateLuminoHubConfiguration(event)} placeholder="Lumino Hub Endpoint" />
          </li>
          <li>
            <label>Explorer</label>
            <input value={this.state.configuration.lumino.explorer.endpoint} onChange={(event) => this.updateExplorerConfiguration(event)} placeholder="Explorer Endpoint" />
          </li>
        </ul>
        <hr className="horizontal-line"/>
        <ul className="notifier-list">
          <li className="text-right">
            <button className="btn-primary" onClick={() => this.addNotifierInput()}>
              <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.6 5.96H5.52V10.26H4.07V5.96H0.01V4.61H4.07V0.34H5.52V4.61H9.6V5.96Z" fill="#fff"/>
              </svg>
              Notifier
            </button>
          </li>
          {notifierInputs}
        </ul>
        <hr className="horizontal-line"/>
        <ul className="rns-list">
          <li >
            <h3 className="config-title">RNS</h3>
          </li>
          <li>
            <label>RNS Contract Address</label>
            <input value={this.state.configuration.rns.contracts.rns} onChange={(event) => this.updateContractAddress('rns', event)} placeholder="RNS Contract Address" />
          </li>
          <li>
            <label>Public Resolver Contract Address</label>
            <input value={this.state.configuration.rns.contracts.publicResolver} onChange={(event) => this.updateContractAddress('publicResolver', event)} placeholder="Public Resolver Contract Address" />
          </li>
          <li>
            <label>MultiChain Contract Address</label>
            <input value={this.state.configuration.rns.contracts.multiChainResolver} onChange={(event) => this.updateContractAddress('multiChainResolver', event)} placeholder="MultiChain Contract Address" />
          </li>
          <li>
            <label>RIF Contract Address</label>
            <input value={this.state.configuration.rns.contracts.rif} onChange={(event) => this.updateContractAddress('rif', event)} placeholder="RIF Contract Address" />
          </li>
          <li>
            <label>IFSAddress Registrar Contract Address</label>
            <input value={this.state.configuration.rns.contracts.fifsAddrRegistrar} onChange={(event) => this.updateContractAddress('fifsAddrRegistrar', event)} placeholder="FIFSAddress Registrar Contract Address" />
          </li>
          <li>
            <label>RSK Owner</label>
            <input value={this.state.configuration.rns.contracts.rskOwner} onChange={(event) => this.updateContractAddress('rskOwner', event)} placeholder="RSK Owner" />
          </li>
          <li className="mt-2"><button className="btn-primary w-100" onClick={() => this.saveConfiguration()}>Save Configuration</button></li>
        </ul>
      </div>
    );
  }
}

function mapDispatchToProps (dispatch) {
  return {
    getConfiguration: () => dispatch(rifActions.getConfiguration()),
    updateConfiguration: (configuration) => dispatch(rifActions.setConfiguration(configuration)),
    goToSettings: () => dispatch(niftyActions.showConfigPage()),
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
  }
}
module.exports = connect(null, mapDispatchToProps)(RifConfiguration)
