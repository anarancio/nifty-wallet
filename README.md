# RConnect Browser Extension

RConnect is a browser extension to operate with RSK blockchain and Lumino Payments. 
It's a fork of the Metamask-based wallet [Nifty Wallet](https://github.com/poanetwork/nifty-wallet).
This wallet lets you make payments using Lumino, manage your RNS domains and operate over RSK blockchain networks.

### How to use
You can use RConnect by simply adding a generated build of this plugin into your
browser. To do so you need to build the plugin first, and for this you need to follow the 
steps under [How to build](#how-to-build) section.

After you successfully generate a build then you need to add that build to your browser,
you can do that following the steps depending on what browser are you working on:

* [Chrome](docs/add-to-chrome.md)
* [Firefox](docs/add-to-firefox.md)

### How to Build

 - Clone this repo if you didn't already
 - Install [Node.js](https://nodejs.org/en/) version 10.x.x
   - If you are using [nvm](https://github.com/nvm-sh/nvm#installation) (recommended) running `nvm install 10` will automatically choose the right node version for you.
   - If you don't use nvm then you need to install npm globally: ```npm install -g npm@6.9.0```
 - Clone Lumino Light Client SDK from [here](https://github.com/rsksmart/lumino-light-client-sdk.git).
   - The SDK repository folder needs to be at the same level as the RConnect folder in order to work properly.
   - You need to go to the SDK folder and run `npm install && npm run build` to generate the SDK build.
 - Go to the parent root folder of the project on your terminal
 - Install dependencies: ```npm install```
 - Install gulp globally with `npm install -g gulp-cli`.
 - Build the project to the `./dist/` folder with `gulp build`.
 - Optionally, to rebuild on file changes, run `gulp dev`.
 - To package .zip files for distribution, run `gulp zip`, or run the full build & zip with `gulp dist`.

 Uncompressed builds can be found in `/dist`, compressed builds can be found in `/builds` once they're built.

### Running Tests

Requires `mocha` installed. Run `npm install -g mocha`.

Then just run `npm test`.

You can also test with a continuously watching process, via `npm run watch`.

You can run the linter by itself with `gulp lint`.

## Architecture
RConnect Internal Architecture:

[![Architecture Diagram](./docs/architecture.png)][1]

RConnect General Architecture:

![General Diagram](./docs/general-rconnect-architecture.png)


## Build for Development

Execute this in the terminal:
```bash
npm install
npm start
```
After you see something like this the plugin is ready and watching changes.
```bash
[18:13:40] Starting 'manifest:chrome'...
[18:13:40] Finished 'manifest:chrome' after 24 ms
[18:13:40] Starting 'manifest:opera'...
[18:13:40] Finished 'manifest:opera' after 6.87 ms
[18:13:40] Finished 'dev:copy' after 51 s
[18:13:40] Finished 'dev:extension:js:ui' after 48 s
[18:13:40] Finished 'dev:extension:js' after 51 s
```

## Build for Publishing

Execute this on a terminal:
```bash
npm run dist
```
When you see something like this `Finished 'dist' after 1.15 min` you can kill gulp, the build is ready.

## Multi Language Support
You can add new translations to support new languages. To do this you need to follow some
steps:

- First you need to check the folder languages inside the project root to see if your 
language isn't already there, if the language it's there you should add the translation.
- If your language file is not there you should:
    - Create a json file inside the folder languages with the name as the language 
    key code (ex: on english language we use en.json)
    - Add a content similar to this on the new file:
    ```json
    {
      "name": "The language name to display (ex: English)",
      "key": "The language key code (ex: en)",
      "translations": {
        "key in default language that's english": "translation on the language that we want"
      }
    }
    ```
    - Next you need to add the translations for your language in this file removing the example translation. 
    You can do that by just taking other language file by example. Translations should be 
    added in the translations object inside the language json file as a key value map.
    - Now as the last step you need to add your file into the languages/index.js file like a
    javascript module and exported as the language key. Here we have an example for English and Spanish:
    ```javascript
      import en from './en.json';
      import es from './es.json';
      
      export default {
        en,
        es,
      }
    ```
    
#### Writing Browser Tests

To write tests that will be run in the browser using QUnit, add your test files to `test/integration/lib`.

## Other Docs

- [How to develop a live-reloading UI](./docs/ui-dev-mode.md)
- [How to develop an in-browser mocked UI](./docs/ui-mock-mode.md)
- [How to live reload on local dependency changes](./docs/developing-on-deps.md)
- [How to manage notices that appear when the app starts up](./docs/notices.md)
- [How to use the TREZOR emulator](./docs/trezor-emulator.md)
- [How to generate a visualization of this repository's development](./docs/development-visualization.md)
- [More](docs)

[1]: http://www.nomnoml.com/#view/%5B%3Cactor%3Euser%5D%0A%0A%5Bmetamask-ui%7C%0A%20%20%20%5Btools%7C%0A%20%20%20%20%20react%0A%20%20%20%20%20redux%0A%20%20%20%20%20thunk%0A%20%20%20%20%20ethUtils%0A%20%20%20%20%20jazzicon%0A%20%20%20%5D%0A%20%20%20%5Bcomponents%7C%0A%20%20%20%20%20app%0A%20%20%20%20%20account-detail%0A%20%20%20%20%20accounts%0A%20%20%20%20%20locked-screen%0A%20%20%20%20%20restore-vault%0A%20%20%20%20%20identicon%0A%20%20%20%20%20config%0A%20%20%20%20%20info%0A%20%20%20%5D%0A%20%20%20%5Breducers%7C%0A%20%20%20%20%20app%0A%20%20%20%20%20metamask%0A%20%20%20%20%20identities%0A%20%20%20%5D%0A%20%20%20%5Bactions%7C%0A%20%20%20%20%20%5BaccountManager%5D%0A%20%20%20%5D%0A%20%20%20%5Bcomponents%5D%3A-%3E%5Bactions%5D%0A%20%20%20%5Bactions%5D%3A-%3E%5Breducers%5D%0A%20%20%20%5Breducers%5D%3A-%3E%5Bcomponents%5D%0A%5D%0A%0A%5Bweb%20dapp%7C%0A%20%20%5Bui%20code%5D%0A%20%20%5Bweb3%5D%0A%20%20%5Bmetamask-inpage%5D%0A%20%20%0A%20%20%5B%3Cactor%3Eui%20developer%5D%0A%20%20%5Bui%20developer%5D-%3E%5Bui%20code%5D%0A%20%20%5Bui%20code%5D%3C-%3E%5Bweb3%5D%0A%20%20%5Bweb3%5D%3C-%3E%5Bmetamask-inpage%5D%0A%5D%0A%0A%5Bmetamask-background%7C%0A%20%20%5Bprovider-engine%5D%0A%20%20%5Bhooked%20wallet%20subprovider%5D%0A%20%20%5Bid%20store%5D%0A%20%20%0A%20%20%5Bprovider-engine%5D%3C-%3E%5Bhooked%20wallet%20subprovider%5D%0A%20%20%5Bhooked%20wallet%20subprovider%5D%3C-%3E%5Bid%20store%5D%0A%20%20%5Bconfig%20manager%7C%0A%20%20%20%20%5Brpc%20configuration%5D%0A%20%20%20%20%5Bencrypted%20keys%5D%0A%20%20%20%20%5Bwallet%20nicknames%5D%0A%20%20%5D%0A%20%20%0A%20%20%5Bprovider-engine%5D%3C-%5Bconfig%20manager%5D%0A%20%20%5Bid%20store%5D%3C-%3E%5Bconfig%20manager%5D%0A%5D%0A%0A%5Buser%5D%3C-%3E%5Bmetamask-ui%5D%0A%0A%5Buser%5D%3C%3A--%3A%3E%5Bweb%20dapp%5D%0A%0A%5Bmetamask-contentscript%7C%0A%20%20%5Bplugin%20restart%20detector%5D%0A%20%20%5Brpc%20passthrough%5D%0A%5D%0A%0A%5Brpc%20%7C%0A%20%20%5Bethereum%20blockchain%20%7C%0A%20%20%20%20%5Bcontracts%5D%0A%20%20%20%20%5Baccounts%5D%0A%20%20%5D%0A%5D%0A%0A%5Bweb%20dapp%5D%3C%3A--%3A%3E%5Bmetamask-contentscript%5D%0A%5Bmetamask-contentscript%5D%3C-%3E%5Bmetamask-background%5D%0A%5Bmetamask-background%5D%3C-%3E%5Bmetamask-ui%5D%0A%5Bmetamask-background%5D%3C-%3E%5Brpc%5D%0A
