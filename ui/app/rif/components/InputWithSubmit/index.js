import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withTranslation} from "react-i18next";

class InputWithSubmit extends Component {

  static propTypes = {
    hiddenValue: PropTypes.any,
    submit: PropTypes.func,
    classes: PropTypes.string,
    placeholderText: PropTypes.string,
    textInput: PropTypes.string,
    t: PropTypes.func
  }

  constructor (props) {
    super(props);
    this.state = {
      value: props.textInput || '',
    }
  }

  onChange = e => this.setState({value: e.target.value})

  onSubmit = (e) => {
    e.preventDefault();
    const {submit} = this.props;
    const {value} = this.state;
    if (this.props.hiddenValue) {
      submit(value, this.props.hiddenValue);
    } else {
      submit(value);
    }

  }

  render = () => {
    const {classes, placeholderText} = this.props
    const {value} = this.state;

    return <div className={classes}>
      <input onChange={this.onChange} value={value} placeholder={placeholderText} />
      <button onClick={this.onSubmit} className="btn-primary">{t('Change')}</button>
    </div>;
  }
}

export default withTranslation('translates')(InputWithSubmit);
