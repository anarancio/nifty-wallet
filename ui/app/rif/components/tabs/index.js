import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

class Tabs extends Component {

  static propTypes = {
    tabs: PropTypes.array.isRequired,
    initialTabIndex: PropTypes.number,
    onChange: PropTypes.func,
    showBack: PropTypes.bool,
    backAction: PropTypes.func,
    classes: PropTypes.any,
  }

  constructor (props) {
    super(props);
    this.state = {
      activeTabIndex: props.initialTabIndex ? props.initialTabIndex : 0,
    }
  }

  selectTab (tab) {
    this.setState({
      activeTabIndex: tab.index,
    });
    if (this.props.onChange) {
      this.props.onChange(tab);
    }
  }

  sortTabs (tab1, tab2) {
    if (tab1.index > tab2.index) {
      return 1;
    } else if (tab1.index < tab2.index) {
      return -1;
    } else {
      return 0;
    }
  }

  getTabBarItems () {
    const { classes } = this.props;
    const styles = classes || {};
    let tabs = this.props.tabs;
    tabs = tabs.sort(this.sortTabs);
    const tabComponents = [];
    if (this.props.showBack) {
      tabComponents.push(<li key="-1" className={styles.backButton || 'rif-tabs-back-button'}>
                           <i onClick={(event) => {
                              this.props.backAction();
                            }} className={styles.chevron || 'fa fa-chevron-left cursor-pointer'}/>
                         </li>);
    }
    tabComponents.push(...tabs.map(tab => {
      const active = tab.index === this.state.activeTabIndex;
      const className = (styles.barItem || 'rif-tabs-bar-item ') + (active ? (styles.activeItem || 'rif-tabs-bar-item-active') : '');
      return (
        <li key={tab.index}
            className={className}
            onClick={(event) => this.selectTab(tab)}>{tab.title}</li>
      );
    }));
    return tabComponents;
  }

  getActiveTabContent () {
    return (this.props.tabs[this.state.activeTabIndex].component);
  }

  render () {
    const { classes } = this.props;
    const styles = classes || {};
    return (
      <div className={styles.tabs || 'rif-tabs'}>
        <ul className={styles.tabsBar || 'rif-tabs-bar'}>
          {this.getTabBarItems()}
        </ul>
        <div className={styles.tabsContent || 'rif-tabs-content'}>
          {this.getActiveTabContent()}
        </div>
      </div>
    );
  }
}

module.exports = connect()(Tabs)
