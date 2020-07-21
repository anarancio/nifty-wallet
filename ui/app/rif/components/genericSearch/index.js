import React, {Component} from 'react';
import PropTypes from 'prop-types';

/**
 * This search bar has 3 ways of working <br>
 * Simple filter => Filter in an array by a string <br>
 * Object filter => Filter in an array of objects a property of X object <br>
 * Custom filter => Use a function that receives the typed value, may be asynchronous <br>
 * In the first 2 cases, the resultSetFunction must be called to receive the filtered data <br>
 * In the last case, the resultSetFunction is optional <br>
 */
class GenericSearch extends Component {

  static propTypes = {
    customFilterFunction: PropTypes.func,
    resultSetFunction: PropTypes.func,
    filterProperty: PropTypes.string,
    data: PropTypes.array,
    placeholder: PropTypes.string,
    onlyFilterOnEnter: PropTypes.bool,
  }

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    }
    this.handleOnChange = this.handleOnChange.bind(this)
    this.handleOnKeyDown = this.handleOnKeyDown.bind(this)
  }

  includesCriteria = (element, criteria) => {
    const lowerString = v => String(v).toLowerCase()
    const lowerElement = lowerString(element);
    const lowerCriteria = lowerString(criteria);
    return lowerElement.includes(lowerCriteria);
  }

  clear = () => {
    this.setState({value: ''})
    console.error('limpio');
  }

  handleOnChange = (e) => {
    const {value} = e.target;
    this.setState({value})
    const {onlyFilterOnEnter} = this.props;
    const enterPressed = e.key === 'Enter';

    if (!onlyFilterOnEnter && !enterPressed) {    debugger;

      this.filter(value)
    }
  }

  handleOnKeyDown = async (e) => {
    const {value} = e.target;
    const {onlyFilterOnEnter} = this.props;
    const enterPressed = e.key === 'Enter';
    if (onlyFilterOnEnter && enterPressed) {
      await this.filter(value);
      this.clear();
    }
  }

  filter = async (value) => {
      const {customFilterFunction, resultSetFunction} = this.props;

      if (customFilterFunction) {
        const result = await customFilterFunction(value);
        if (resultSetFunction) await resultSetFunction(result);
        return;
      }

      const {filterProperty, data} = this.props;
      // If we don't have a criteria, return the original data.
      if (!value) return resultSetFunction(data);
      // Simple filter in elements of array (no objects)
      if (!filterProperty) {
        const result = data.filter(element => this.includesCriteria(element, value));
        return resultSetFunction(result);
      }
      // Filter of 1st level, with the property to check
      const result = data.filter(element => this.includesCriteria(element[filterProperty], value));
      return resultSetFunction(result);
  }

  render () {
    const {placeholder, onlyFilterOnEnter} = this.props;
    const { value } = this.state;
    return (
      <div className="search-bar-container">
        <input
          placeholder={placeholder || ''}
          className={'search-bar'}
          onChange={this.handleOnChange}
          onKeyDown={this.handleOnKeyDown}
          value={value}
        />
      </div>
    )
  }
}

export default GenericSearch;
