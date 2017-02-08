## truffle-solidity-loader

A Webpack loader allows importing a solidity contract that return a truffle artifact json object. This allows you to develop your contracts with Hot Reloading support, and have your migrations automatically re-run on change. When you run a production build, the contracts will be bundled into your main bundle for easy deployment.

## Example

```javascript
var provider = new Web3.providers.HttpProvider("http://localhost:8545");
var contract = require("truffle-contract");

// Instead of including a built json file
import metacoin_artifacts from '../build/contracts/MyContract.json'
var MyContract = contract(metacoin_artifacts)

//You can import the solidity contract directly
import metacoin_artifacts from '../contracts/MyContract.sol'
var MyContract = contract(metacoin_artifacts)

MyContract.setProvider(provider);
```

You can see this plugin in operation in the [Truffle+Webpack Demo App](https://github.com/ConsenSys/truffle-webpack-demo). The demo is for truffle 2.0.

A project by ConsenSys and @johnmcdowall.

## Installation

`$ npm install --save-dev truffle-solidity-loader json-loader`

Add the appropriate config to your `loaders` section of your Webpack 2 config:

```javascript
{
  test: /\.sol/,
  use: [
    { loader: 'json-loader' },
    { loader: 'truffle-solidity-loader?network=development' }
  ]
}
```

Webpack applies loaders [right to left](https://webpack.js.org/api/loaders/#pitching-loader), therefore the output of `truffle-solidity-loader` goes into `json-loader`. The `network` parameter must be set, otherwise you get an error.


### `truffle.js` integration

The loader will detect a `truffle.js` (or `truffle-config.js` for Windows users) config file in your project and use that for configuration.

Importantly, you will need to specify the location of your `migrations` directory in the `truffle.js` file like so:

`"migrations_directory": "./migrations"`

You can also override the Truffle config using a loader querystring as outlined below:

```javascript
{
  test: /\.sol/,
  use: [
    { loader: 'json-loader' },
    { loader: 'truffle-solidity-loader?migrations_directory=' + path.resolve(__dirname, './migrations') + '&network=development' }
  ]
}
```

If you don't want to set query parameters, you can provide a `json` object.

```javascript
{
  test: /\.sol/,
  use: [
    { loader: 'json-loader' },
    { loader: 'truffle-solidity-loader',
      options: {
        migrations_directory=path.resolve(__dirname, './migrations'),
        network: 'development'
      }
    }
  ]
}
```


### Loader Query string config

  - `migrations_directory`: The path to a directory containing your Truffle migrations
  - `network`: A network name to use
  - `network_id`: A network id to use

## Contributing

- Write issue in the Issue Tracker.
- Submit PRs.
- Respect the project coding style: StandardJS.

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## License
Copyright (c) Consensys LLC, and authors.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
