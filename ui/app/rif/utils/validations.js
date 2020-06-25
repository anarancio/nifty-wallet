/**
 * This function is used on input events to validate the amount input of the user
 * @param event the input event including the value inside.
 * @param currentValue the current value to check
 * @param decimalSeparator the decimal separator
 * @returns {boolean} true if it's a valid input or false otherwise
 */
export function validateDecimalAmount (event, currentValue, decimalSeparator = '.') {
  const keyCode = event.keyCode;
  const key = event.key;
  const isValidNumber = key === decimalSeparator ||
    (keyCode >= 96 && keyCode <= 105) || // numpad numbers
    (keyCode >= 48 && keyCode <= 59) || // keyboard numbers
    keyCode === 8; // backspace
  if (!isValidNumber) {
    // if it's not a valid number we block
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  if (key === decimalSeparator) {
    const currentAmount = currentValue || '';
    // if we have already a decimal separator we block
    if (currentAmount.indexOf(decimalSeparator) !== -1) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }
  return true;
}

/**
 * This function validates that an amount value is a valid value greater than 0 and a number value
 * @param amount to validate
 * @returns true if the amount it's valid or false otherwise.
 */
export function validateAmountValue (amount) {
  return amount && !isNaN(amount) && amount > 0;
}
