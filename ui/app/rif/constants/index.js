// import icons for each token
import { faBitcoin, faEthereum } from '@fortawesome/free-brands-svg-icons'
import { faCoins, faCheckCircle, faBolt, faArchive } from '@fortawesome/free-solid-svg-icons'
/**
 * Add the icon to the array with this structure
 *   name: icon,
*/
export const cryptos = {
    bitcoin: {
        name: 'Bitcoin',
        color: '#FFA500',
        icon: faBitcoin,
    },
    ethereum: {
        name: 'Ethereum',
        color: '#065535',
        icon: faEthereum,
    },
    rsk: {
        name: 'RSK',
        color: '#003366',
        icon: faCoins,
    },
}

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

export const registrationTimeouts = {
  // number of seconds to wait before updating the page for the clock waiting.
  registering: 4,
  // number of seconds to wait before showing the confirmation message, this is to wait for the confirmation operation.
  registerConfirmation: 6,
}
/** TODO: Rodrigo
 * Both of this consts need to be moved to a config file, or something better than this solution
 * @type {string[]}
 */
const RESOLVERS_MAINNET = [
  {
    name: 'Multicrypto',
    address: '0xfE87342112c26fbF2Ae30031FE84860793b495B9',
  },
]
const RESOLVERS_TEST = [
  {
    name: 'Multi-Chain',
    address: '0xfE87342112c26fbF2Ae30031FE84860793b495B9',
  },
]

export function GET_RESOLVERS (env) {
  if (env === 'dev') {
    return RESOLVERS_TEST;
  } else {
    return RESOLVERS_MAINNET;
  }
}
