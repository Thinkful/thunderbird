const _ = require('lodash');
const colors = require('ansi-colors');
const log = require('fancy-log');
const path = require('path');
const PluginError = require('plugin-error');
const TT = require('thin-tree');
const through2 = require('through2');
const Vinyl = require('vinyl');

const buildTree = require('./build-tree');
const attachContent = require('./attach-content');
const setMetadata = require('./metadata');
const validateTree = require('./validate-tree');

const PLUGIN_NAME = 'gulp-create-curriculum-manifest';

module.exports = function(options) {
  try {
    options = options || {};
    options.filename = options.filename || 'curriculum.json';

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
        attachContent(rootDir),
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
        .then(
          function(treeRoot) {
            log('Thinkdown compilation completed.');

            var indent = process.env.target === 'production' ? 0 : 4;
            // curriculum.json
            stream.push(
              new Vinyl({
                path: path.resolve(rootDir, options.filename),
                contents: new Buffer(
                  JSON.stringify(treeRoot.toJSON(), null, indent) + '\n'
                ),
              })
            );

            // syllabus.json
            var syllabus = new TT(treeRoot.toJSON());
            _.each(syllabus.preOrderTraverse(), function(n) {
              delete n.author;
              delete n.content;

              delete n.src;
              delete n.uuid;

              if (_.isEmpty(n.children)) {
                delete n.children;
              }
              delete n.parent;
              delete n.root;

              delete n.element;
              delete n.getPromise;
            });

            stream.push(
              new Vinyl({
                path: path.resolve(rootDir, 'syllabus.json'),
                contents: new Buffer(
                  JSON.stringify(syllabus.toJSON(), null, indent) + '\n'
                ),
              })
            );

            done();
          },
          function() {
            log(colors.red('Tree building error!'));
            done(new PluginError(PLUGIN_NAME, 'Error building tree'));
          }
        )
        .catch(function(e) {
          log(colors.red('Tree building error! *'));
          if (e.stack) {
            log(colors.red(e.stack));
          }
          done(new PluginError(PLUGIN_NAME, 'Error caught'));
        });
    });
  } catch (e) {
    log.error(colors.red(e));
  }
};
