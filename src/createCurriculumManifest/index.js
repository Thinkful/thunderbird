var path = require('path');

var through2 = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var _ = require('lodash');

var buildTree = require('./document-node');
var attachContent = require('./attach-content');
var setMetadata = require('./metadata');

const PLUGIN_NAME = 'gulp-create-curriculum-manifest';

module.exports = function(options) {
    options = options || {};
    options.withContent = options.withContent || true;
    options.filename = options.filename || "curriculum.json";

    return through2.obj(function(file, enc, done) {
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            return done(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
        }

        var operationsPerNode = options.withContent ?
            [setMetadata(), attachContent({"file": file})]
        :   [setMetadata()];

        var treePromise = buildTree(file, operationsPerNode);

        var rootDirectory = path.dirname(file.path);

        /*
            TODO include root node in content selection, excluding is a
                legacy concern needed to account for the inclusion of metadata
                as part of the structure.xml
         */
        // then we're done! Saves the file.
        var stream = this;
        treePromise.then(function(treeRoot) {
            stream.push(new gutil.File({
              path: path.resolve(rootDirectory, options.filename),
              contents: new Buffer(JSON.stringify(treeRoot.toJSON(), null, 4))
            }));

            done();
        }, function() {
            gutil.log.info("Tree building error! ");
            done(new PluginError(PLUGIN_NAME, 'Error building tree'));
        });
    });
};
