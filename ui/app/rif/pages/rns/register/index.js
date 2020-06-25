import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import rifActions from '../../../actions';
import niftyActions from '../../../../actions';
import {registrationTimeouts} from '../../../constants';
import {pageNames} from '../../index';
import extend from 'xtend';

class DomainRegisterScreen extends Component {

  static propTypes = {
    domainName: PropTypes.string,
    requestRegistration: PropTypes.func,
    getCost: PropTypes.func,
    showThis: PropTypes.func,
    dispatch: PropTypes.func,
    currentStep: PropTypes.string,
    yearsToRegister: PropTypes.number,
    costInRif: PropTypes.number,
    commitment: PropTypes.string,
    getUnapprovedTransactions: PropTypes.func,
    showTransactionConfirmPage: PropTypes.func,
    completeRegistration: PropTypes.func,
    canCompleteRegistration: PropTypes.func,
    waitForListener: PropTypes.func,
    getDomain: PropTypes.func,
    updateDomains: PropTypes.func,
    domain: PropTypes.object,
    isDomainAvailable: PropTypes.func,
    showToast: PropTypes.func,
    showDomainList: PropTypes.func,
    tabOptions: PropTypes.object,
    showLoading: PropTypes.func,
  }

  componentDidMount () {
    this.props.showLoading();
    this.initialize().then(() => {
      this.props.showLoading(false);
    });
  }

  async initialize () {
    const {domain, domainName, currentStep} = this.props;
    if (domain && !currentStep) {
      if (domain.registration) {
        if (domain.registration.readyToRegister) {
          // domain not available, that means is pending or is already registered.
          this.showReadyToRegister();
        } else {
          // domain not available, that means is pending or is already registered.
          this.showWaitingForRegister();
        }
      } else {
        this.props.showToast('Domain already registered!', false);
        this.props.showDomainList();
      }
    } else if (!currentStep) {
      // otherwise is available and ready for register
      const available = this.props.isDomainAvailable(domainName);
      if (!available) {
        // is not available for registration so we redirect to domain list with a warning
        this.props.showToast('Domain not available, can not be registered!', false);
        this.props.showDomainList();
      } else {
        await this.calculateAndFillCost(domainName, 1);
      }
    }
  }

  async calculateAndFillCost (domainName, yearsToRegister) {
    const costInWei = await this.props.getCost(domainName, yearsToRegister);
    const costInRif = costInWei / 1e18;
    this.props.showThis(extend(this.props, {
      yearsToRegister,
      costInRif,
    }));
  }

  async getUpdatedDomain () {
    return await this.props.getDomain(this.props.domainName);
  }

  async changeDomainStatus (status) {
    const domain = await this.getUpdatedDomain();
    domain.status = status;
    await this.props.updateDomains(domain);
  }

  showWaitingForRegister () {
    this.props.showThis(extend(this.props, {
      currentStep: 'waitingForRegister',
      tabOptions: {
        showBack: false,
      },
    }));
  }

  showWaitingForConfirmation () {
    this.props.showThis({
      ...this.props,
      currentStep: 'waitingForConfirmation',
      tabOptions: {
        showBack: false,
      },
    });
  }

  showReadyToRegister () {
    this.props.showThis({
      ...this.props,
      currentStep: 'readyToRegister',
      tabOptions: {
        showBack: false,
      },
    });
  }

  async requestDomain () {
    const result = await this.props.requestRegistration(this.props.domainName, this.props.yearsToRegister);
    this.props.waitForListener(result.transactionListenerId)
      .then(transactionReceipt => {
        this.showWaitingForRegister();
      });
    this.props.showTransactionConfirmPage({
      action: () => this.showWaitingForConfirmation(),
    });
  }

  async completeRegistration () {
    const transactionListenerId = await this.props.completeRegistration(this.props.domainName);
    this.props.waitForListener(transactionListenerId)
      .then(transactionReceipt => {
        this.afterRegistration();
      });
    this.props.showTransactionConfirmPage({
      action: () => this.afterRegistrationSubmit(),
    });
  }

  async afterRegistration () {
    await this.changeDomainStatus('active');
    this.props.showThis({
      ...this.props,
      currentStep: 'registered',
    });
  }

  afterRegistrationSubmit () {
    this.props.showThis({
      ...this.props,
      currentStep: 'waitingForConfirmation',
    });
  }

  async changeYearsToRegister (yearsToRegister) {
    if (yearsToRegister && yearsToRegister > 0) {
      const costInWei = await this.props.getCost(this.props.domainName, yearsToRegister);
      const costInRif = costInWei / 1e18;
      this.props.showThis({
        ...this.props,
        currentStep: 'setupRegister',
        yearsToRegister: yearsToRegister,
        costInRif: costInRif,
      });
    }
  }

  getTitle (currentStep) {
    if (currentStep !== 'registered') {
      return (<h3 className="buying-name">Buying {this.props.domainName}</h3>);
    }
    return null;
  }

  getBody (currentStep) {
    const partials = {
      setupRegister: (
        <div className="domainRegisterInitiate">
          <div className="d-flex number-years-to-buy">
            <span className="title-years">Number of years:</span>
            <div className="qty-years">
              <span className="hand-over btn-minus"
                    onClick={() => this.changeYearsToRegister(this.props.yearsToRegister - 1)}>
                <svg width="8" height="2" viewBox="0 0 8 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 1L8 0.999999" stroke="#602A95"/>
                </svg>
              </span>
              <span className="qty-number">{this.props.yearsToRegister}</span>
              <span className="hand-over btn-plus"
                    onClick={() => this.changeYearsToRegister(this.props.yearsToRegister + 1)}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.48 5.168H5.216V8.608H4.056V5.168H0.808V4.088H4.056V0.672H5.216V4.088H8.48V5.168Z"
                        fill="#602A95"/>
                </svg>
              </span>
            </div>
            <small className="discount-msg">
              <span>50% discount per year</span> from the third year
            </small>
          </div>
          <div className="d-flex domain-cost">
            <span>Cost</span><span className="cost-number">{this.props.costInRif} <small>RIF</small></span>
          </div>
          <div className="domain-register-disclaimer">
            You will be asked to confirm the first of two transactions required (request & register)
            to buy your domain.
          </div>
        </div>
      ),
      waitingForRegister: (
        <div className="waiting-for-register text-center">
          <h4 className="waiting-for-register__title">Confirming transaction</h4>
          <div className="app-loader"/>
          <p className="waiting-for-register__text">Wait until the domain is requested then click Register to buy the
            domain.</p>
        </div>
      ),
      readyToRegister: (
        <div className="ready-to-register">
          <div className="ready-to-register__msg">
            <svg width="38" height="23" viewBox="0 0 38 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.09302 10.5L12.9674 21L37.2326 1" stroke="#602A95" strokeWidth="2"/>
            </svg>
            <span>Your domain has been requested</span>
          </div>
          <p className="ready-to-register__text">Click Register to buy the domain.</p>
        </div>
      ),
      waitingForConfirmation: (
        <div className="waiting-for-confirm text-center">
          <h4 className="waiting-for-confirm__title">Confirming transaction</h4>
          <div className="app-loader"/>
        </div>
      ),
      registered: (
        <div className="domain-registered text-center">
          <h4 className="domain-registered__title">Congrats!</h4>
          <p className="domain-registered__name">{this.props.domainName} is yours</p>
          <p className="domain-registered__text">Check it in the explorer</p>
        </div>
      ),
    };
    if (currentStep === 'waitingForRegister') {
      const timeout = setTimeout(() => {
        this.getUpdatedDomain().then(domain => {
          if (domain.registration && domain.registration.readyToRegister) {
            this.showReadyToRegister();
          } else {
            this.showWaitingForRegister();
          }
          clearTimeout(timeout);
        });
      }, registrationTimeouts.secondsToCheckForCommitment * 1000);
    }
    return partials[currentStep];
  }

  getButtons (currentStep) {
    const partials = {
      setupRegister: (
        <div className="button-container">
          <button className="btn-primary btn-register" onClick={() => this.requestDomain()}>Request Domain</button>
        </div>
      ),
      waitingForRegister: (
        <div className="button-container">
          <button className="btn-primary btn-register" disabled={true}>Register</button>
        </div>
      ),
      readyToRegister: (
        <div className="button-container">
          <button className="btn-primary btn-register" onClick={() => this.completeRegistration()}>Register</button>
        </div>
      ),
      registered: (
        <div className="button-container">
          <button className="btn-primary-outlined" onClick={() => this.props.showDomainList()}>My Domains</button>
        </div>
      ),
    };
    return partials[currentStep];
  }

  render () {
    const currentStep = this.props.currentStep ? this.props.currentStep : 'setupRegister';
    const title = this.getTitle(currentStep);
    const body = this.getBody(currentStep);
    const buttons = this.getButtons(currentStep);
    return (
      <div className="body">
        {title}
        {body}
        {buttons}
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

const mapDispatchToProps = dispatch => {
  return {
    dispatch: dispatch,
    showThis: (data) => dispatch(rifActions.navigateTo(pageNames.rns.domainRegister, {
      tabOptions: {
        screenTitle: 'Domain Register',
      },
      ...data,
    })),
    getCost: (domainName, yearsToRegister) => dispatch(rifActions.getRegistrationCost(domainName, yearsToRegister)),
    requestRegistration: (domainName, yearsToRegister) => dispatch(rifActions.requestDomainRegistration(domainName, yearsToRegister)),
    getUnapprovedTransactions: () => dispatch(rifActions.getUnapprovedTransactions()),
    showTransactionConfirmPage: (afterApproval) => dispatch(rifActions.goToConfirmPageForLastTransaction(afterApproval)),
    completeRegistration: (domainName) => dispatch(rifActions.finishRegistration(domainName)),
    canCompleteRegistration: (commitment) => dispatch(rifActions.canFinishRegistration(commitment)),
    waitForListener: (transactionListenerId) => dispatch(rifActions.waitForTransactionListener(transactionListenerId)),
    getDomain: (domainName) => dispatch(rifActions.getDomain(domainName)),
    updateDomains: (domain) => dispatch(rifActions.updateDomains(domain)),
    showToast: (text, success) => dispatch(niftyActions.displayToast(text, success)),
    isDomainAvailable: (domainName) => dispatch(rifActions.checkDomainAvailable(domainName)),
    showDomainList: () => dispatch(rifActions.navigateTo(pageNames.rns.domains, {
      tabOptions: {
        showBack: false,
      },
    })),
    showLoading: (loading = true, message) => loading ? dispatch(niftyActions.showLoadingIndication(message)) : dispatch(niftyActions.hideLoadingIndication()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(DomainRegisterScreen)
