import React from 'react';
import { faCoins, faCheckCircle, faBolt, faArchive } from '@fortawesome/free-solid-svg-icons';
import { faConnectdevelop } from '@fortawesome/free-brands-svg-icons';

export const DEFAULT_ICON = {
  color: '#000080',
  icon: faCoins,
}

export const DEFAULT_ICON_SVG = 'coinstack.svg'

export const domainIconProps = {
  color: '#000080',
  icon: faCheckCircle,
}

export const luminoNodeIconProps = {
  color: '#508871',
  icon: faBolt,
}

export const rifStorageIconProps = {
  color: '#AD3232',
  icon: faArchive,
}

export const brandConnections = {
  color: '#AD3232',
  icon: faConnectdevelop,
}

export const tokenIcons = {
  rif: {
    name: 'RIF',
    icon: 'rif.png',
  },
  doc: {
    name: 'DOC',
    icon: 'doc.png',
  },
}

export const SVG_PLUS = (
  <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.6 5.96H5.52V10.26H4.07V5.96H0.01V4.61H4.07V0.34H5.52V4.61H9.6V5.96Z" fill="#602A95"/>
  </svg>)
