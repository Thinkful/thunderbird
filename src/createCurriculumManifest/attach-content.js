var path = require('path');

var utils = require('../utils');
var gutil = require('gulp-util');

var _ = require('lodash');

var Q = require('q');
Q.fs = require('q-io/fs');

var parseMarkdown = require('./parse-markdown');

module.exports = function(rootDir) {
  return function(node) {
    // Quits if not src attribute is present
    if (_.isEmpty(node.src)) {
      return Q.when(true);
    }

    var _path = path.resolve(rootDir, node.src);
    var markdownPath = path.resolve(_path, 'content.md');
    var relPath = markdownPath.replace(rootDir, '.');

    node.content = {};
    return Q.allSettled([
      Q.fs
        .read(markdownPath)
        .then(parseMarkdown({ processMarkdown: true }))
        .catch(function(err) {
          if (err.code === 'ENOENT') {
            gutil.log('Warning:', gutil.colors.yellow(relPath), 'not found');
            return;
          }
          if (err.front_matter_error) {
            gutil.log('Error parsing front matter in:');
            gutil.log(gutil.colors.yellow(markdownPath));
            gutil.log(err.front_matter_error);
            utils.fail();
          }
          gutil.log(gutil.colors.yellow('Unrecognized error!'));
          gutil.log(err);
        })
        .then(function(parsed) {
          node.content.body = parsed.body;
        }),

      Q.fs.read(path.resolve(_path, 'content.html')).then(function(str) {
        node.content.raw = str;
      }),

      Q.fs
        .read(path.resolve(_path, 'comprehension.md'))
        .then(parseMarkdown({ processMarkdown: true }))
        .then(function(str) {
          if (str && str.body) {
            node.content.comprehension = str.body;
          }
        }),
    ]);
  };
};
