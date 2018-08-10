const path = require('path')
const fs = require('fs')
const { getOptions } = require('loader-utils')
const validateOptions = require('schema-utils')
const truffleMigrator = require('truffle-core/lib/commands/migrate')

const Logger = require('./lib/logDecorator')
const genBuildOptions = require('./lib/genBuildOptions')


function parseContractName (resourcePath) {
  var contractFileName = path.basename(resourcePath)
  return contractFileName.charAt(0).toUpperCase() + contractFileName.slice(1, contractFileName.length - 4)
}

function returnContractAsSource (filePath, callback) {
  return fs.readFile(filePath, 'utf8', function (err, solJSON) {
    if (err) {
      Logger.error(err)
      return callback(err, null)
    }
    let { abi, compiler, networks, schemaVersion, updatedAt } = JSON.parse(solJSON)
    callback(null, JSON.stringify({ abi, compiler, networks, schemaVersion, updatedAt }))
  })
}

const schema = {
  'type': 'object',
  'required': ['migrations_directory', 'network', 'contracts_build_directory'],
  'properties': {
    'migrations_directory': {
      'type': 'string',
    },
    'network': {
      'type': 'string'
    },
    'contracts_build_directory': {
      'type': 'string'
    }
  },
  'additionalProperties': false
};


module.exports = function (source, map, meta) {
  let WebpackOptions = getOptions(this) || {}
  validateOptions(schema, WebpackOptions, 'truffle-solidity-loader')

  let buildOpts = genBuildOptions(WebpackOptions)
  let contractName = parseContractName(this.resourcePath)
  let contractJsonPath = path.resolve(buildOpts.contracts_build_directory, contractName + '.json')
  // this.addDependency(contractJsonPath); // NOTE adding dependency causes this to run twice

  if(this.debug) {
    Logger.debugger(`contractName = ${contractName}`)
    Logger.debugger(`contracts_build_directory = ${buildOpts.contracts_build_directory}`)
    Logger.debugger(`contractJsonPath = ${contractJsonPath}`)
  }

  let callback = this.async();
  return truffleMigrator.run(buildOpts, function(err, data) {
    if(err) {
      this.emitError(err)
    } else {
      return returnContractAsSource(contractJsonPath, callback)
    }
  })
}
