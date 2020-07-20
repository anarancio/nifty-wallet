import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { GET_RESOLVERS } from '../../../../constants';
import niftyActions from '../../../../../actions';
import rifActions from '../../../../actions';
import {pageNames} from '../../../names';
import {WAIT_FOR_CONFIRMATION_DEFAULT} from '../../../../../constants/common';

class DomainsDetailConfigurationScreen extends Component {
  static propTypes = {
    domainName: PropTypes.string.isRequired,
    showToast: PropTypes.func,
    waitForListener: PropTypes.func,
    setNewResolver: PropTypes.func,
    showTransactionConfirmPage: PropTypes.func,
    showDomainConfigPage: PropTypes.func,
    getConfiguration: PropTypes.func,
    getResolver: PropTypes.func,
    resolver: PropTypes.object,
  }

  constructor (props) {
    super(props);
    this.props.getConfiguration()
      .then(configuration => {
        const resolvers = Object.assign([], GET_RESOLVERS(configuration));
        this.setState({
          resolvers,
          configuration,
        });
      });
    this.timeouts = [];
    this.state = {
      resolvers: [],
      configuration: null,
      resolver: {},
      disableSelect: true,
      reloadResolver: false,
    };
  }

  getDefaultSelectedValue (resolvers, selectedResolverAddress) {
    const selectedResolver = resolvers.find(resolver => resolver.address.toLowerCase() === selectedResolverAddress.toLowerCase());
    if (selectedResolver) {
      return selectedResolver.name;
    }
    return this.state.configuration.rns.contracts.publicResolver;
  }

  componentDidMount () {
    this.loadResolver();
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevProps.resolver.address !== this.props.resolver.address) {
      this.timeoutToLoadResolver();
    }
  }

  timeoutToLoadResolver = () => setTimeout(async () => {
    let resolver = await this.props.getResolver(this.props.domainName);
    if (resolver.pending) {
      this.timeouts.push(this.timeoutToLoadResolver());
    } else {
      this.setState({
        resolver: resolver,
        disableSelect: resolver.pending,
      });
    }
  }, WAIT_FOR_CONFIRMATION_DEFAULT);

  componentWillUnmount () {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
  }

  loadResolver () {
    this.props.getResolver(this.props.domainName)
      .then(resolver => {
        this.setState({
          resolver: resolver,
          disableSelect: resolver.pending,
        });
      });
  }

  async onChangeComboResolvers (e) {
    for (const resolverItem of e.target.children) {
      if (resolverItem.value === e.target.value) {
        const address = resolverItem.getAttribute('data-address');
        const transactionListenerId = await this.props.setNewResolver(this.props.domainName, address);
        this.props.showTransactionConfirmPage({
          afterApproval: {
            action: () => {
              this.props.showDomainConfigPage({
                ...this.props,
              });
              this.props.showToast('Waiting Confirmation');
              this.props.waitForListener(transactionListenerId)
                .then(transactionReceipt => {
                  setTimeout(() => {
                    this.props.showDomainConfigPage({
                      ...this.props,
                      resolver: {
                        pending: false,
                        address: address,
                      },
                    });
                  }, 2000);
                });
            },
          },
        });
        return;
      }
    }
  }

  render () {
    const { disableSelect, resolver, configuration } = this.state;

    if (!configuration) {
      return (<div>Loading...</div>);
    }

    return (
      <div className="resolver-setting-container">
        <h3 className="resolver-setting__title">Resolver</h3>
        <p className="resolver-setting__text">The Resolver is a Smart Contract responsible for the process of translating names into addresses. You can select a public resolver or a custom resolver.</p>
        <div id="selectResolver">
          <select id="comboResolvers"
                  onChange={this.onChangeComboResolvers.bind(this)}
                  disabled={disableSelect}
                  value={disableSelect ? 'pending' : this.getDefaultSelectedValue(this.state.resolvers, resolver.address.toLowerCase())}
          >
            <option disabled value={this.state.configuration.rns.contracts.publicResolver} hidden> Select Resolver </option>
            <option disabled={!disableSelect} value={'pending'} hidden={!disableSelect}> Pending... </option>
            {
              this.state.resolvers.map((resolver, index) => {
                return (<option
                  key={index}
                  value={resolver.name}
                  data-address={resolver.address}
                >{resolver.name}</option>)
              })
            }
          </select>
        </div>
      </div>
    );
  }
}

function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  const domain = params.domain;
  const details = domain.details || params.details;
  return {
    domain: domain,
    dispatch: state.dispatch,
    status: details.status,
    domainName: details.name,
    resolver: params.resolver || {},
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    waitForListener: (transactionListenerId) => dispatch(rifActions.waitForTransactionListener(transactionListenerId)),
    setNewResolver: (domainName, resolverAddress) => dispatch(rifActions.setResolverAddress(domainName, resolverAddress)),
    showTransactionConfirmPage: (callbacks) => dispatch(rifActions.goToConfirmPageForLastTransaction(callbacks)),
    showDomainConfigPage: (props) => dispatch(rifActions.navigateTo(pageNames.rns.domainsDetailConfiguration, props)),
    getConfiguration: () => dispatch(rifActions.getConfiguration()),
    getResolver: (domainName) => dispatch(rifActions.getResolver(domainName)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(DomainsDetailConfigurationScreen)
