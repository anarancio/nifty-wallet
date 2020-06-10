/**
 * Returns the domain name cleared ready to use, with the .rsk suffix and to lowercase.
 * @param domainName the domain name to clear.
 * @returns the cleared domain name
 */
function cleanDomainName (domainName) {
  const toLowerCaseDomainName = domainName ? domainName.toLowerCase() : domainName;
  return (toLowerCaseDomainName && toLowerCaseDomainName.indexOf('.rsk') === -1) ? (toLowerCaseDomainName + '.rsk') : toLowerCaseDomainName;
}

function isValidRNSDomain (value) {
  if (!value) {
    return false;
  }
  return value.match('.*\\.rsk');
}

export {
  cleanDomainName,
  isValidRNSDomain,
}
