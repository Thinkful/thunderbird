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
                    if (err.code === "ENOENT") {
                        gutil.log(
                            "Warning:",
                            gutil.colors.yellow(
                                markdownPath.replace(rootDir, '.')),
                            "not found");
                        return;
                    }
                    if (err.front_matter_error) {
                        gutil.log(gutil.colors.bgRed("!Thinkdown Failed!    ¡"));
                        gutil.log(gutil.colors.bgRed("!  Thinkdown Failed!  ¡"));
                        gutil.log(gutil.colors.bgRed("!    Thinkdown Failed!¡"));
                        gutil.log("Error parsing front matter in:");
                        gutil.log(gutil.colors.yellow(markdownPath));
                        gutil.log(err.front_matter_error);
                        gutil.log("Exiting.");
                        process.exit(1);
                    }
                    gutil.log(gutil.colors.yellow('Unrecognized error!'));
                    gutil.log(err);
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
