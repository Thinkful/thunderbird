var path = require('path');

var through2 = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var _ = require('lodash');

var buildTree = require('./document-node');
var attachContent = require('./attach-content');

const PLUGIN_NAME = 'gulp-create-curriculum-manifest';

module.exports = function(options) {
    options = options || {};

    return through2.obj(function(file, enc, done) {
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            return done(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
        }

        var self = this;
        var treeRoot = buildTree(file);
        var sourceDirectory = path.dirname(file.path);

        /*
            TODO include root node in content selection, excluding is a
                legacy concern needed to account for the inclusion of metadata
                as part of the structure.xml
         */
        attachContent(
            sourceDirectory, _.without(treeRoot.listOfAllNodes, treeRoot))
        .then(function(contentedNodes) {
            // Serializes tree to curriculum.json
            self.push(new gutil.File({
              path: path.resolve(sourceDirectory, "curriculum.json"),
              contents: new Buffer(JSON.stringify(treeRoot.toJSON(), null, 4))
            }));
            // Serializes tree without content to manifest.json
            _(treeRoot.listOfAllNodes).each(function(node) {
                delete node.src;
                delete node.content;
            });
            self.push(new gutil.File({
                path: path.resolve(sourceDirectory, "manifest.json"),
                contents: new Buffer(JSON.stringify(treeRoot.toJSON(), null, 4))
            }));
        }).catch(function(err) {
            gutil.log(err);
            done(new PluginError(PLUGIN_NAME, JSON.stringify(err)))
        })
        // then we're done!
        .then(done);


    });
};