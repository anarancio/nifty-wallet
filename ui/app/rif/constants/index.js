import { DEFAULT_ICON, DEFAULT_ICON_SVG, domainIconProps, luminoNodeIconProps, rifStorageIconProps, tokenIcons, SVG_PLUS} from './icons';

export const registrationTimeouts = {
  // number of seconds to wait before updating the page for the clock waiting.
  secondsToCheckForCommitment: 4,
}

export const domainsScreen = {
  // timout in seconds to refresh the domain list
  timeoutToRefresh: 1,
}

export function GET_RESOLVERS (configuration) {
  return ([
    {
      name: 'Multi-Chain',
      address: configuration.rns.contracts.multiChainResolver,
      isMultiChain: true,
    },
    {
      name: 'Public Resolver',
      address: configuration.rns.contracts.publicResolver,
      isMultiChain: false,
    },
  ]);
}
const PATH_TO_RIF_IMAGES = '/images/rif/';

const JOINED_TEXT = 'JOINED';

const UNJOINED_TEXT = 'NOT JOINED';

const PAGINATION_DEFAULT_SIZE = 3;

export {
  DEFAULT_ICON,
  DEFAULT_ICON_SVG,
  domainIconProps,
  luminoNodeIconProps,
  rifStorageIconProps,
  tokenIcons,
  PATH_TO_RIF_IMAGES,
  SVG_PLUS,
  JOINED_TEXT,
  UNJOINED_TEXT,
  PAGINATION_DEFAULT_SIZE,
}
