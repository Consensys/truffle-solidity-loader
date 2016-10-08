/* External Module Dependencies */
var TruffleContractCompiler = require('truffle/lib/contracts')
var TruffleContractMigrator = require('truffle/lib/migrate')
var Pudding                 = require('ether-pudding')
var Web3                    = require('web3')

/* Internal Module Dependencies */
var Logger                  = require('./lib/logger_decorator')
var BuildOptionNormalizer   = require('./lib/build_option_normalizer')
var ScratchDir              = require('./lib/scratch_dir')

/* Native Node Imports */
var path                    = require('path')
var fs                      = require('fs')


// Synchronus file existence check helper
function compiledContractExists( filePath ) {
  try{
    fs.statSync( filePath );
  }catch(err){
    if( err.code == 'ENOENT' ) return false;
  }
  return true;
}

// Read the contract source file and pass it to the `compilationFinished` callback
function returnContractAsSource( filePath, compilationFinished ) {
  fs.readFile( filePath, 'utf8', function( err, solJsFile ) {
    if( err ) {
      Logger.error( err );
      return compilationFinished( err, null );
    }

    compilationFinished( err, solJsFile )
  })
}

// This acts as a mutex to prevent multiple compilation runs
var isCompilingContracts = false;

module.exports = function ( source ) {
  this.cacheable && this.cacheable()

  var compilationFinished = this.async()
  var contractPath        = this.context
  var contractFilePath    = this.resourcePath
  var contractFileName    = path.basename(contractFilePath)
  var contractName        = contractFileName.charAt(0).toUpperCase() + contractFileName.slice( 1, contractFileName.length-4 )

  var buildOpts    = {}
  buildOpts.logger = Logger
  buildOpts        = BuildOptionNormalizer.normalize( buildOpts, this.query )

  var scratchPath = new ScratchDir()
  scratchPath.createIfMissing()

  var buildPath = scratchPath.path()
  var compiledContractPath = path.resolve( buildPath, contractFileName+'.js' )

  function waitForContractCompilation() {
    setTimeout( function() {
      if( compiledContractExists( compiledContractPath ) ) {
        returnContractAsSource( compiledContractPath, compilationFinished )
      } else {
        waitForContractCompilation()
      }
    }.bind( this ), 500)
  }

  if( !isCompilingContracts ) {
    Logger.log( `Writing temporary contract build artifacts to ${buildPath}` )
    isCompilingContracts = true

    var compilerOpts = {};
    compilerOpts.contracts_directory       = contractPath
    compilerOpts.contracts_build_directory = buildPath
    compilerOpts.network                   = buildOpts.network
    compilerOpts.network_id                = buildOpts.network_id
    compilerOpts.logger                    = Logger
    compilerOpts.all                       = false

    var provisionOpts = {}
    provisionOpts.provider                  = new Web3.providers.HttpProvider( buildOpts.web3_rpc_uri )
    provisionOpts.contracts_build_directory = buildPath

    TruffleContractCompiler.compile( compilerOpts, function( err, contracts ) {
      isCompilingContracts = false
      Logger.log( "COMPILATION FINISHED" )
      Logger.log( "RUNNING MIGRATIONS" )

      var migrationOpts = {}
      migrationOpts.migrations_directory      = buildOpts.migrations_directory
      migrationOpts.contracts_build_directory = buildPath
      migrationOpts.provider                  = provisionOpts.provider
      migrationOpts.network                   = compilerOpts.network
      migrationOpts.network_id                = compilerOpts.network_id
      migrationOpts.logger                    = Logger

      // Once all of the contracts have been compiled, we know we can immediately
      // try to run the migrations safely.
      TruffleContractMigrator.run( migrationOpts, function( err, result ) {
        if( err ) {
          Logger.error( err );
          return compilationFinished( err, null );
        }

        // Finally return the contract source we were originally asked for.
        returnContractAsSource( compiledContractPath, compilationFinished )
      })
    })

    return
  }

  if( compiledContractExists( compiledContractPath ) ) {
    returnContractAsSource( compiledContractPath, compilationFinished )
  } else {
    waitForContractCompilation()
  }
}
