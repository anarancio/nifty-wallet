import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import Select from 'react-select';
import {DEFAULT_ICON} from '../../constants';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

class TokensDropdownOption extends Select.Option {
  render () {
    const {option} = this.props;
    const icon = option.icon ? option.icon : DEFAULT_ICON;
    return (
      <div
        className="tokens-dropdown-option"
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
        <div>
          <FontAwesomeIcon className="add-new-multicrypto-select-value-icon" icon={icon.icon} color={icon.color}/>
          <span className="tokens-dropdown-item-text">{option.name}</span>
        </div>
      </div>
    )
  }
}

class TokensDropdownOptionSelected extends Component {
  static propTypes = {
    value: PropTypes.object,
  }

  render () {
    const {value} = this.props;
    const icon = value.icon ? value.icon : DEFAULT_ICON;
    return (
      <div className="tokens-dropdown-item">
        <FontAwesomeIcon icon={icon.icon} color={icon.color}/>
        <span className="tokens-dropdown-item-text">{value.name}</span>
      </div>
    )
  }
}

class TokensDropdown extends Component {

  static propTypes = {
    onSelectedToken: PropTypes.func,
    defaultSelectedToken: PropTypes.object,
    tokens: PropTypes.array,
  }

  constructor (props) {
    super(props);
    this.state = {};
    if (props.defaultSelectedToken) {
      this.state.selectedToken = props.defaultSelectedToken;
    }
    if (props.tokens) {
      this.state.tokens = props.tokens;
    }
  }

  onSelectedNetwork = (selectedToken) => {
    this.setState({selectedToken: selectedToken});
    this.props.onSelectedToken(selectedToken);
  }

  render () {
    return (
      <div id="tokenDropDown" className="tokens-dropdown-container">
        <Select
          searchable={false}
          arrowRenderer={() => <div className="combo-selector-triangle"/>}
          onChange={this.onSelectedNetwork}
          optionComponent={TokensDropdownOption}
          options={this.state.tokens}
          clearable={false}
          value={this.state.selectedToken}
          valueComponent={TokensDropdownOptionSelected}
        />
      </div>
    );
  }
}

module.exports = connect()(TokensDropdown)
