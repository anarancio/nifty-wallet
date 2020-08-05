import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import rifActions from '../../../actions';
import niftyActions from '../../../../actions';
import {registrationTimeouts} from '../../../constants';
import {pageNames} from '../../index';
import extend from 'xtend';
import AbstractPage from '../../abstract-page';
import {withTranslation, Trans} from "react-i18next";

class DomainRegisterScreen extends AbstractPage {

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
    t: PropTypes.func
  }

  constructor (props) {
    super(props);
    this.timeouts = [];
  }

  componentDidMount () {
    this.props.showLoading();
    this.initialize().then(() => {
      this.props.showLoading(false);
    });
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (prevProps.domainName !== this.props.domainName) {
      this.props.showLoading();
      this.initialize().then(() => {
        this.props.showLoading(false);
      });
    }
  }

  componentWillUnmount () {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
  }

  async initialize () {
    const {domain, domainName, currentStep} = this.props;
    if (domain && !currentStep) {
      if (domain.registration) {
        if (domain.registration.status === 'finishing') {
          this.showWaitingForConfirmation();
        } else if (domain.registration.status === 'ready') {
          // domain not available, that means is pending or is already registered.
          this.showReadyToRegister();
        } else {
          // domain not available, that means is pending or is already registered.
          this.showWaitingForRegister();
        }
      }
    } else if (!currentStep) {
      // otherwise is available and ready for register
      const available = this.props.isDomainAvailable(domainName);
      if (!available) {
        // is not available for registration so we redirect to domain list with a warning
        this.props.showToast(t('Domain not available, can not be registered!'), false);
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
    }));
  }

  showWaitingForConfirmation () {
    this.props.showThis({
      ...this.props,
      currentStep: 'waitingForConfirmation',
    });
  }

  showReadyToRegister () {
    this.props.showThis({
      ...this.props,
      currentStep: 'readyToRegister',
    });
  }

  requestDomain () {
    super.setLoading(true);
    this.props.requestRegistration(this.props.domainName, this.props.yearsToRegister)
      .then(result => {
        const transactionListenerId = result.transactionListenerId;
        this.props.showTransactionConfirmPage({
          afterApproval: {
            action: () => {
              this.showWaitingForConfirmation()
              this.props.waitForListener(transactionListenerId)
                .then(transactionReceipt => {
                  this.showWaitingForRegister();
                });
            },
          },
        });
      }).catch(error => {
        console.error(error);
        this.setLoading(false);
    });
  }

  completeRegistration () {
    super.setLoading(true);
    this.props.completeRegistration(this.props.domainName)
      .then(transactionListenerId => {
        this.props.showTransactionConfirmPage({
          afterApproval: {
            action: () => {
              this.afterRegistrationSubmit()
              this.props.waitForListener(transactionListenerId)
                .then(transactionReceipt => {
                  this.afterRegistration();
                });
            },
          },
        });
      }).catch(error => {
        console.error(error);
        super.setLoading(false);
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
    const {t, domainName} = this.props;
    if (currentStep !== 'registered') {
      return (<h3 className="buying-name">{t('Buying {{domainName}}', domainName)}</h3>);
    }
    return null;
  }

  getBody (currentStep) {
    const {t} = this.props;
    const partials = {
      setupRegister: (
        <div className="domainRegisterInitiate">
          <div className="d-flex number-years-to-buy">
            <span className="title-years">{t('Number of years:')}</span>
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
              <Trans t={t}>
                <span>50% discount per year</span> from the third year
              </Trans>
            </small>
          </div>
          <div className="d-flex domain-cost">
            <span>{t('Cost')}</span><span className="cost-number">{this.props.costInRif} <small>RIF</small></span>
          </div>
          <div className="domain-register-disclaimer">
            {t('You will be asked to confirm the first of two transactions required (request & register)' +
              'to buy your domain.')}
          </div>
        </div>
      ),
      waitingForRegister: (
        <div className="waiting-for-register text-center">
          <h4 className="waiting-for-register__title">{t('Confirming transaction')}</h4>
          <div className="app-loader"/>
          <p className="waiting-for-register__text">{t('Wait until the domain is requested then click Register to buy the domain.')}</p>
        </div>
      ),
      readyToRegister: (
        <div className="ready-to-register">
          <div className="ready-to-register__msg">
            <svg width="38" height="23" viewBox="0 0 38 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.09302 10.5L12.9674 21L37.2326 1" stroke="#602A95" strokeWidth="2"/>
            </svg>
            <span>{t('Your domain has been requested')}</span>
          </div>
          <p className="ready-to-register__text">{t('Click Register to buy the domain.')}</p>
        </div>
      ),
      waitingForConfirmation: (
        <div className="waiting-for-confirm text-center">
          <h4 className="waiting-for-confirm__title">{t('Confirming transaction')}</h4>
          <div className="app-loader"/>
        </div>
      ),
      registered: (
        <div className="domain-registered text-center">
          <h4 className="domain-registered__title">{t("Congrats!")}</h4>
          <p className="domain-registered__name">{t('{{domainName}} is yours', {domainName: this.props.domainName})}</p>
          <p className="domain-registered__text">{t('Check it in the explorer')}</p>
        </div>
      ),
    };
    if (currentStep === 'waitingForRegister') {
      const timeout = setTimeout(() => {
        this.getUpdatedDomain().then(domain => {
          if (domain.registration && domain.registration.status === 'ready') {
            this.showReadyToRegister();
          } else {
            this.showWaitingForRegister();
          }
          clearTimeout(timeout);
          this.timeouts = this.timeouts.filter(timeoutRunning => timeoutRunning !== timeout);
        });
      }, registrationTimeouts.secondsToCheckForCommitment * 1000);
      this.timeouts.push(timeout);
    } else if (currentStep === 'waitingForConfirmation') {
      const timeout = setTimeout(() => {
        this.getUpdatedDomain().then(domain => {
          if (domain.registration && domain.registration.status === 'finishing') {
            this.showWaitingForConfirmation();
          } else if (domain.registration && domain.registration.status === 'finished') {
            this.afterRegistration();
          }
          clearTimeout(timeout);
          this.timeouts = this.timeouts.filter(timeoutRunning => timeoutRunning !== timeout);
        });
      }, registrationTimeouts.secondsToCheckForCommitment * 1000);
      this.timeouts.push(timeout);
    }
    return partials[currentStep];
  }

  getButtons (currentStep) {
    const {t} = this.props;
    const partials = {
      setupRegister: (
        <div className="button-container">
          <button className="btn-primary btn-register" onClick={() => this.requestDomain()}>{t('Request Domain')}</button>
        </div>
      ),
      waitingForRegister: (
        <div className="button-container">
          <button className="btn-primary btn-register" disabled={true}>{t('Register')}</button>
        </div>
      ),
      readyToRegister: (
        <div className="button-container">
          <button className="btn-primary btn-register" onClick={() => this.completeRegistration()}>{t('Register')}</button>
        </div>
      ),
      registered: (
        <div className="button-container">
          <button className="btn-primary-outlined" onClick={() => this.props.showDomainList()}>{t('My Domains')}</button>
        </div>
      ),
    };
    return partials[currentStep];
  }

  renderPage () {
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
      ...data,
      tabOptions: {
        showBack: true,
        screenTitle: 'Domain Register',
      },
    })),
    getCost: (domainName, yearsToRegister) => dispatch(rifActions.getRegistrationCost(domainName, yearsToRegister)),
    requestRegistration: (domainName, yearsToRegister) => dispatch(rifActions.requestDomainRegistration(domainName, yearsToRegister)),
    getUnapprovedTransactions: () => dispatch(rifActions.getUnapprovedTransactions()),
    showTransactionConfirmPage: (callbacks) => dispatch(rifActions.goToConfirmPageForLastTransaction(callbacks)),
    completeRegistration: (domainName) => dispatch(rifActions.finishRegistration(domainName)),
    canCompleteRegistration: (commitment) => dispatch(rifActions.canFinishRegistration(commitment)),
    waitForListener: (transactionListenerId) => dispatch(rifActions.waitForTransactionListener(transactionListenerId)),
    getDomain: (domainName) => dispatch(rifActions.getDomain(domainName)),
    updateDomains: (domain) => dispatch(rifActions.updateDomains(domain)),
    showToast: (text, success) => dispatch(niftyActions.displayToast(text, success)),
    isDomainAvailable: (domainName) => dispatch(rifActions.checkDomainAvailable(domainName)),
    showDomainList: () => dispatch(rifActions.navigateTo(pageNames.rns.domains, {
      tabOptions: {
        showBack: true,
        showTitle: true,
        screenTitle: 'My Domains',
        },
      },
      true)),
    showLoading: (loading = true, message) => loading ? dispatch(niftyActions.showLoadingIndication(message)) : dispatch(niftyActions.hideLoadingIndication()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(withTranslation('translations')(DomainRegisterScreen))
