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
    options.filename = options.filename || "curriculum.json";

    return through2.obj(function(file, enc, done) {
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            return done(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
        }

        var rootDir = path.dirname(file.path);
        console.log("TASK ROOTDIR:: " + rootDir);

        var operationsPerNode = [
            // Attaches metadata from structure.xml,
            // including legacy structures / intro / contents etc
            setMetadata(rootDir),
            // Attaches metadata from content.md files
            // Attaches course body from content.md, content.html
            // Attaches comprehension content from comprehension.md
            attachContent(rootDir)
        ];

        var treePromise = buildTree(file, operationsPerNode);


        /*
            TODO include root node in content selection, excluding is a
                legacy concern needed to account for the inclusion of metadata
                as part of the structure.xml
         */
        // then we're done! Saves the file.
        var stream = this;
        treePromise.then(function(treeRoot) {
            gutil.log("Tree promise completed.");
            stream.push(new gutil.File({
              path: path.resolve(rootDir, options.filename),
              contents: new Buffer(JSON.stringify(treeRoot.toJSON(), null, 4))
            }));

            done();
        }, function() {
            gutil.log("Tree building error!");
            done(new PluginError(PLUGIN_NAME, 'Error building tree'));
        });
    });
};
