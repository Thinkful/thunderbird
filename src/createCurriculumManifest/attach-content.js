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
        var markdownPath = path.resolve(_path, 'content.md');

        node.content = {};
        return Q.allSettled([

            Q.fs.read(markdownPath)
                .then(parseMarkdown)
                .catch(function(err) {
                    if (err.code == "ENOENT") {
                        gutil.log(
                            "Warning:",
                            gutil.colors.yellow(markdownPath),
                            "not found");
                        return;
                    }
                    gutil.log(gutil.colors.red("[Thinkdown Failed!]"),
                              "Error parsing", markdownPath);
                    process.exit(1);
                })
                .then(function(parsed) {
                    node.content.body = parsed.body;
                }),

            Q.fs.read(path.resolve(_path, 'content.html'))
                .then(function(str) {
                    node.content.raw = str;
                }),

            Q.fs.read(path.resolve(_path, 'comprehension.md'))
                .then(function(str) {
                    if (!_.isEmpty(str)) {
                        strnode.content.comprehension = str;
                    }
                })
        ]);
    }
}
