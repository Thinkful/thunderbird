var path = require('path');

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

        node.content = {};

        return Q.allSettled([
            Q.fs.read(path.resolve(_path, 'content.md'))
                .then(parseMarkdown)
                .then(function(parsed) {
                    node.content.body = parsed.body;
                }),

            Q.fs.read(path.resolve(_path, 'content.html'))
                .then(function(str) {
                    node.content.raw = str;
                }),

            Q.fs.read(path.resolve(_path, 'comprehension.md'))
                .then(function(str) {
                    node.content.comprehension = str;
                })
        ]);
    }
}
