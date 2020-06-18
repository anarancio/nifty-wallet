import DomainsScreen from './domainsPage/domainsPage';
import DomainsDetailScreen from './domainsDetailPage/domainsDetailPage';
import DomainsDetailConfigurationScreen from './domainsDetailPage/domainDetailActive/domainDetailActiveConfig';
import Subdomains from './rns/subdomains';
import Exchange from './rns/exchange';
import LuminoChannels from './rns/lumino-channels';
import Pay from './rns/pay';
import Renew from './rns/renew';
import SellOnMKP from './rns/sell-on-mkp';
import Transfer from './rns/transfer';
import DomainRegisterScreen from './rns/register';
import LuminoTokensPage from './lumino/tokensPage/tokensPage';
import LuminoTokenDetailPage from './lumino/tokenDetailPage/tokenDetailPage';
import React from 'react';
import SearchDomains from '../components/searchDomains';
import rifActions from '../actions';
import {tabDefinitions} from './tab-definitions';
import Tabs from '../components/tabs';
import ToastComponent from '../../../../old-ui/app/components/toast';
import ErrorComponent from '../../../../old-ui/app/components/error';
import LuminoHome from './lumino/index';
import LuminoNetworkDetails from './lumino/luminoNetworkDetails/index';
import {pageNames} from './names';
import RifConfiguration from './configuration';
import niftyActions from '../../actions';

function getSearchBarComponent (show) {
  if (!show) {
    return null;
  }
  return (<SearchDomains/>);
}

function getTabTitleComponent (title, hideTitle) {
  if (!title || hideTitle) {
    return null;
  }
  return (
    <h2 className="page-title">{title}</h2>
  );
}

function buildTabs (screenName, tabOptions) {
  const tabs = [];

  tabDefinitions.forEach((tabDefinition, index) => {
    let tabTitle = tabDefinition.defaultScreenTitle;
    let tabComponent = getPageComponent(tabDefinition.defaultScreenName);
    let showSearchbar = tabDefinition.showSearchbar;
    const tabIndex = tabOptions.tabIndex;
    if (screenName && tabDefinition.index === tabIndex) {
      tabTitle = tabOptions.screenTitle;
      tabComponent = getPageComponent(screenName);
      showSearchbar = tabOptions.showSearchbar;
    }
    const tab = {
      index,
      title: tabDefinition.title,
      component: (
        <div className="rif-tab-content__inside">
          {getSearchBarComponent(showSearchbar)}
          {getTabTitleComponent(tabTitle, tabOptions.hideTitle)}
          {tabComponent}
        </div>
      ),
    };
    tabs.push(tab);
  });

  return tabs;
}

function buildTabScreen (screenName, context, dispatch) {
  if (screenName === pageNames.configuration) {
    return (<div>
      <ToastComponent/>
      <RifConfiguration/>
    </div>);
  }
  // check if rif it's available
  dispatch(rifActions.rifEnabled())
    .then(enabled => {
      if (!enabled) {
        // if not available we redirect to home
        dispatch(niftyActions.goHome());
      }
    });
  const tabOptions = context.params.tabOptions;
  const tabs = buildTabs(screenName, tabOptions, dispatch);
  const onTabChange = (tab) => {
    // we can use this to trigger on change tab actions
    console.debug('Selected tab', tab);
    const tabDefinition = tabDefinitions.find(definition => definition.index === tab.index);
    dispatch(rifActions.navigateTo(tabDefinition.defaultScreenName, {
      tabOptions: {
        showSearchbar: tabDefinition.showSearchbar,
        screenTitle: tabDefinition.defaultScreenTitle,
        tabIndex: tabDefinition.index,
      },
    }, true));
  }
  return (
    <div className="rif-app-container">
      <ToastComponent/>
      <ErrorComponent/>
      <Tabs tabs={tabs}
            onChange={(tab) => onTabChange(tab)}
            showBack={tabOptions.showBack}
            backAction={() => dispatch(rifActions.navigateBack())}/>
    </div>
  );
}

function getLandingPage (context, dispatch) {
  return buildTabScreen(null, context, dispatch);
}

function getPage (context, dispatch) {
  const tabOptions = context.params.tabOptions;
  return buildTabScreen(tabOptions.screenName, context, dispatch);
}

function getPageComponent (screenName) {
  switch (screenName) {
    case pageNames.rns.domains:
      return (<DomainsScreen/>);
    case pageNames.rns.domainsDetail:
      return (<DomainsDetailScreen/>);
    case pageNames.rns.subdomains:
      return (<Subdomains/>);
    case pageNames.rns.exchange:
      return (<Exchange/>);
    case pageNames.rns.luminoChannels:
      return (<LuminoChannels/>);
    case pageNames.rns.pay:
      return (<Pay/>);
    case pageNames.rns.renew:
      return (<Renew/>);
    case pageNames.rns.sellOnMKP:
      return (<SellOnMKP/>);
    case pageNames.rns.transfer:
      return (<Transfer/>);
    case pageNames.rns.domainRegister:
      return (<DomainRegisterScreen/>);
    case pageNames.rns.luminoTokensPage:
      return (<LuminoTokensPage/>);
    case pageNames.rns.luminoTokenDetailPage:
      return (<LuminoTokenDetailPage/>);
    case pageNames.lumino.home:
      return (<LuminoHome/>);
    case pageNames.lumino.networkDetails:
      return (<LuminoNetworkDetails/>);
    case pageNames.rns.domainsDetailConfiguration:
      return (<DomainsDetailConfigurationScreen/>);
  }
}

export {
  getPage,
  pageNames,
  getLandingPage,
}
