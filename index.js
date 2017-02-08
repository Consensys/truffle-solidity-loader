/* External Module Dependencies */
var TruffleContractCompiler = require('truffle/lib/contracts')
var TruffleContractMigrator = require('truffle/lib/commands/migrate')
var SolidityParser = require('solidity-parser')

/* Internal Module Dependencies */
var Logger = require('./lib/logger_decorator')
var BuildOptionNormalizer = require('./lib/build_option_normalizer')

/* Native Node Imports */
var path = require('path')
var fs = require('fs')

// Synchronus file existence check helper
function compiledContractExists (filePath) {
  try {
    fs.statSync(filePath)
  } catch (err) {
    if (err.code === 'ENOENT') return false
  }
  return true
}

// Read the contract source file and pass it to the `compilationFinished` callback
function returnContractAsSource (filePath, compilationFinished) {
  fs.readFile(filePath, 'utf8', function (err, solJSON) {
    if (err) {
      Logger.error(err)
      return compilationFinished(err, null)
    }

    compilationFinished(err, solJSON)
  })
}

// This acts as a mutex to prevent multiple compilation runs
var isCompilingContracts = false

module.exports = function (source) {
  this.cacheable && this.cacheable()

  var buildOpts = {}
  buildOpts.logger = Logger
  buildOpts = BuildOptionNormalizer.normalize(buildOpts, this.query)

  var buildPath = buildOpts.contracts_build_directory
  var compilationFinished = this.async()
  var contractPath = this.context
  var contractFilePath = this.resourcePath
  var contractFileName = path.basename(contractFilePath)
  var contractName = contractFileName.charAt(0).toUpperCase() + contractFileName.slice(1, contractFileName.length - 4)
  var compiledContractPath = path.resolve(buildPath, contractName + '.json')

  var imports = SolidityParser.parseFile(contractFilePath, 'imports')

  imports.forEach(function (solidityImport) {
    var dependencyPath = path.resolve(contractPath, solidityImport)
    this.addDependency(dependencyPath)

    if (compiledContractExists(compiledContractPath)) {
      fs.unlinkSync(compiledContractPath)
    }
  }.bind(this))

  function waitForContractCompilation () {
    setTimeout(function () {
      if (compiledContractExists(compiledContractPath)) {
        returnContractAsSource(compiledContractPath, compilationFinished)
      } else {
        waitForContractCompilation()
      }
    }, 500)
  }

  if (!isCompilingContracts) {
    Logger.log(`Writing contract build artifacts to ${buildPath}`)
    isCompilingContracts = true

    // var compilerOpts = buildOpts
    buildOpts.all = false // Compile all sources found

    TruffleContractCompiler.compile(buildOpts, function (err, contracts) {
      if (err) {
        Logger.error(err)
        return compilationFinished(err, null)
      }

      isCompilingContracts = false
      Logger.log('COMPILATION FINISHED')
      Logger.log('RUNNING MIGRATIONS')

      buildOpts.reset = true  // Force the migrations to re-run

      // Once all of the contracts have been compiled, we know we can immediately
      // try to run the migrations safely.
      TruffleContractMigrator.run(buildOpts, function (err) {
        if (err) {
          Logger.error(err)
          return compilationFinished(err, null)
        }

        // Finally return the contract source we were originally asked for.
        returnContractAsSource(compiledContractPath, compilationFinished)
      })
    })

    return
  }

  if (compiledContractExists(compiledContractPath)) {
    returnContractAsSource(compiledContractPath, compilationFinished)
  } else {
    waitForContractCompilation()
  }
}
