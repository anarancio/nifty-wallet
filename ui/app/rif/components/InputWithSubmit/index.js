import React, {Component} from 'react';
import PropTypes from 'prop-types';


class InputWithSubmit extends Component {

  static propTypes = {
    hiddenValue: PropTypes.any,
    submit: PropTypes.func,
    classes: PropTypes.string,
    placeholderText: PropTypes.string,
    textInput: PropTypes.string,
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
      <button onClick={this.onSubmit} className="btn-primary">Change</button>
    </div>;
  }
}

export default InputWithSubmit;
