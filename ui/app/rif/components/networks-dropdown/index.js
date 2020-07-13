import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import Select from 'react-select';
import {DEFAULT_ICON} from '../../constants';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

class NetworkDropdownOption extends Select.Option {
  render () {
    const {option} = this.props;
    const icon = option.icon ? option.icon : DEFAULT_ICON;
    return (
      <div
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          this.props.onSelect(option, event);
        }}
        onMouseEnter={(event) => this.props.onFocus(option, event)}
        onMouseMove={(event) => {
          if (this.props.isFocused) return;
          this.props.onFocus(option, event)
        }}
      >
        <FontAwesomeIcon className="add-new-multicrypto-select-value-icon" icon={icon.icon} color={icon.color}/>
        <span className="label-spacing-left">{option.name}</span>
      </div>
    )
  }
}

class NetworkDropdownOptionSelected extends Component {
  static propTypes = {
    value: PropTypes.object,
  }

  render () {
    const {value} = this.props;
    const icon = value.icon ? value.icon : DEFAULT_ICON;
    return (
      <div className="networks-dropdown-item  d-flex">
        <FontAwesomeIcon className="add-new-multicrypto-select-value-icon" icon={icon.icon} color={icon.color}/>
        <span className="networks-dropdown-item-text">{value.name}</span>
      </div>
    )
  }
}

class NetworksDropdown extends Component {

  static propTypes = {
    onSelectedNetwork: PropTypes.func,
    defaultSelectedNetwork: PropTypes.object,
    networks: PropTypes.array,
  }

  constructor (props) {
    super(props);
    this.state = {};
    if (props.defaultSelectedNetwork) {
      this.state.selectedNetwork = props.defaultSelectedNetwork;
    }
    if (props.networks) {
      this.state.networks = props.networks;
    }
  }

  onSelectedNetwork = (selectedNetwork) => {
    this.setState({selectedNetwork: selectedNetwork});
    this.props.onSelectedNetwork(selectedNetwork);
  }

  render () {
    return (
      <div id="comboChainAddresses" className="networks-dropdown-container">
        <Select
          searchable={false}
          arrowRenderer={() => <div className="combo-selector-triangle"/>}
          onChange={this.onSelectedNetwork}
          optionComponent={NetworkDropdownOption}
          options={this.state.networks}
          clearable={false}
          value={this.state.selectedNetwork}
          valueComponent={NetworkDropdownOptionSelected}
        />
      </div>
    );
  }
}

module.exports = connect()(NetworksDropdown)
