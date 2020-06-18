import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { domainIconProps, luminoNodeIconProps, rifStorageIconProps} from '../../constants'

const DomainIcon = ({ className }) => (<FontAwesomeIcon icon={domainIconProps.icon} color={domainIconProps.color} className={className ? className : 'default-icon'}/>)
const LuminoNodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="10" fill="#139CD9"/>
    <path d="M14 4H9.33333L7 10.5806H9.33333L7.38889 16L13.6111 8.25806H10.8889L14 4Z" fill="white"/>
  </svg>
)
const RifStorageIcon = ({ className }) => (<FontAwesomeIcon icon={rifStorageIconProps.icon} color={rifStorageIconProps.color} className={className ? className : 'default-icon'}/>)


export {
    DomainIcon,
    LuminoNodeIcon,
    RifStorageIcon,
}
