var path                    = require('path')
var fs                      = require('fs')

/* ScratchDir - Handles the creation and path resolution of the
 * webpack loader build artifacts directory.
 */
var ScratchDir = function ScratchDir (scratchDir, context) {
  this.scratchDir = scratchDir
  this.context = context
}

ScratchDir.prototype = {
  createIfMissing: function() {
    if(!this.dirExists()) {
      fs.mkdirSync(this.path());
    }
  },

  dirExists: function() {
    return this.isDirSync( this.path() )
  },

  contractPath: function() {
    var result = ''
    var cwd = process.cwd()
    var contextHead = this.context.slice(0, cwd.length)
    var contextTail = this.context.slice(cwd.length)
    var explodedTail = contextTail.split(path.sep)
    var contextTailHasLeadingSlash = explodedTail[0] === ''
    var contextIsSubdirOfCwd = (contextHead === cwd)
    if(contextIsSubdirOfCwd) {
      if(contextTailHasLeadingSlash) {
        result = explodedTail.slice(1).join(path.sep)
      } else {
        result = explodedTail.join(path.sep)
      }
    }
    return result;
  },

  path: function() {
    var cwd = process.cwd()
    return path.resolve( cwd, this.scratchDir, this.contractPath())
  },

  isDirSync: function(aPath) {
    try {
      return fs.statSync(aPath).isDirectory();
    } catch (e) {
      if (e.code === 'ENOENT') {
        return false;
      } else {
        throw e;
      }
    }
  }
}

module.exports = ScratchDir
