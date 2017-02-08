var merge = require('lodash.merge')
var Logger = require('./logger_decorator')

var QueryStringParser = require('./query_string_parser')
var TruffleConfigLocator = require('./truffle_config_locator')
var TruffleConfig = require('truffle-config')

var BuildOptionNormalizer = {
  normalize: function (buildOpts, query) {
    let queryObj = QueryStringParser.parse(query)
    merge(buildOpts, queryObj || {})

    if (!buildOpts.network) {
      throw new Error('You must specify the network name to deploy to. (network)')
    }

    var truffleConfig = TruffleConfigLocator.find()
    if (truffleConfig) {
      var config = TruffleConfig.load(truffleConfig, buildOpts)
    } else {
      throw new Error('No Truffle Config file found!')
    }

    if (!config.migrations_directory) {
      throw new Error('You must specify the location of the Truffle migrations directory in the loader query string. (migrations_directory)')
    }

    if (!config.network_id) {
      config.network_id = '*'
      Logger.log("Setting network_id to '*' for compilation and contract provisioning")
    }

    return config
  }
}

module.exports = BuildOptionNormalizer
