var path = require('path');

var through2 = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var _ = require('lodash');

var buildTree = require('./build-tree');
var attachContent = require('./attach-content');
var setMetadata = require('./metadata');
var validateTree = require('./validate-tree');

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
        var stream = this;
        treePromise
        // validate the output!
        .then(validateTree)

        // then we're done! Save the curriculum.json file.
        .then(function(treeRoot) {
            gutil.log("Thinkdown compilation completed.");
            stream.push(new gutil.File({
              path: path.resolve(rootDir, options.filename),
              contents: new Buffer(JSON.stringify(treeRoot.toJSON(), null, 4))
            }));

            done();
        }, function() {
            gutil.log("Tree building error!");
            done(new PluginError(PLUGIN_NAME, 'Error building tree'));
        }).catch(function(e) {
            gutil.log("Tree building error!")
            gutil.log(gutil.colors.red(e.stack))
            done(new PluginError(PLUGIN_NAME, 'Error caught'));
        });
    });
};
