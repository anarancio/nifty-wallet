## How to configure RIF Services for local development.

When you run RConnect on Regtest with a local node you need to set up all the 
neccesary infrastructure to allow the wallet to work with RIF Services. 
To do so you need to configure some API parameters that allow
us to access those services.

Take a look at the RConnect General Architecture Diagram [here](../README.md#rconnect-general-architecture).

There we have 1 RSK Node, 1 Lumino Explorer, 1 Lumino Hub and several Notifiers.
All these are running APIs, so we need to specify where they are in order to let the wallet access them.

The file that lets us configure this is [`index.js`.](../app/scripts/controllers/rif/configuration/index.js)
This is a JS file which defines a particular set of functions. We need to change the `getInitialConfigStructure` function because it is the one that does the initial setup.
This function looks similar to this:

```js
  getInitialConfigStructure (chainId) {
    // ... some other code
      case global.networks.reg: // RSK Regtest
        return {
          lumino: {
            explorer: {
              endpoint: '',
            },
          },
          notifier: {
            availableNodes: [],
          },
          rns: {
            contracts: {
              rns: '',
              publicResolver: '',
              multiChainResolver: '',
              rif: '',
              fifsAddrRegistrar: '',
              rskOwner: '',
            },
          },
        };
    }
  }
```
**Note: We only show the important piece of code here.**

As you can see we have a structure like this:

```json5
{
  lumino: {
    explorer: {
      endpoint: '',
    },
  },
  notifier: {
    availableNodes: [],
  },
  rns: {
    contracts: {
      rns: '',
      publicResolver: '',
      multiChainResolver: '',
      rif: '',
      fifsAddrRegistrar: '',
      rskOwner: '',
    },
  },
}
```

Now we need to fill in those empty fields. Here are references about what those fields are:

```json5
{
  lumino: {
    explorer: {
      endpoint: 'endpoint URL for the Lumino Explorer API; e.g. http://localhost:8080/api/v1',
    },
  },
  notifier: {
    availableNodes: [
      // This is an array of notifier endpoints, you need at least 3.
      'Notifier 1 running API endpoint, e.g.: http://localhost:8081/',
      'Notifier 2 running API endpoint, e.g.: http://localhost:8082/',
      'Notifier 3 running API endpoint, e.g.: http://localhost:8083/'
    ],
  },
  rns: {
    contracts: {
      // All these values can be retrieved from the RNS Suite (https://github.com/rnsdomains/rns-suite) deployment summary.
      rns: 'The RNS Contract Address',
      publicResolver: 'The Public Resolver Contract Address',
      multiChainResolver: 'The Multi-chain Resolver Contract Address',
      rif: 'The RIF Token Address',
      fifsAddrRegistrar: 'The FIFSAddrRegistrar Contract Address',
      rskOwner: 'The RSK Owner Contract Address',
    },
  },
}
```

As you can see we need to set up some endpoints (for Lumino Explorer and RIF Notifiers) and then RNS Suite Smart Contract addresses.
Lumino Hub data doesn't need to be included here since the Lumino Explorer provides that for us in runtime, so we're OK in that regard.

Here is an example of a local configuration:

```json5
{
  lumino: {
    explorer: {
      endpoint: 'http://localhost:8080/api/v1',
    },
  },
  notifier: {
    availableNodes: [
      'http://localhost:8081/',
      'http://localhost:8082/',
      'http://localhost:8083/',
    ],
  },
  rns: {
    contracts: {
      rns: '0x83C5541A6c8D2dBAD642f385d8d06Ca9B6C731ee',
      publicResolver: '0xE0825f57Dd05Ef62FF731c27222A86E104CC4Cad',
      multiChainResolver: '0x73ec81da0C72DD112e06c09A6ec03B5544d26F05',
      rif: '0x1Af2844A588759D0DE58abD568ADD96BB8B3B6D8',
      fifsAddrRegistrar: '0x8921BF2f074b5470c02Cc7473F17282576111591',
      rskOwner: '0x79bbC6403708C6578B0896bF1d1a91D2BB2AAa1c',
    },
  },
}
```

**IMPORTANT: These parameters are only initial parameters, the wallet needs to be
removed and installed again on the browser if they are changed. No changes will be reflected without a re-installation.**
