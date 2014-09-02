var path = require('path');
var fs = require('fs');

var gutil = require('gulp-util');

var _ = require('lodash');

var Q = require('q');
    Q.fs = require('q-io/fs');

var fm = require('front-matter');
var marked = require('marked');

var parseMarkdown = function(str) {
    var parsed;
    // Handles format errors in front matter markers
    if (!/---/.test(str.split('\n')[0])) {
        str = '---\n' + str;
        str = str.replace('----------', '---');
    }
    // Extracts front matter and body
    try {
        parsed = fm(str)
    } catch(e) {
        // throws for improperly formatted yaml, see front matter from:
        //  Unit 4 of NODE-001
        //      Intermediate Node.js Deploying and Platforms as a Service
        throw new Error(e.problem, e.stack);
    }
    if(_.isObject(parsed)) {
        parsed.body = marked(parsed.body);
    }

    return _.isObject(parsed) ? parsed : new Error("Could not parse markdown");
}

module.exports = function(options) {
    var dirname = path.dirname(options.file.path);

    return function(node) {
        if (node === node.root) {
            return Q.when(true);
        }

        var _path = path.resolve(dirname, node.src);

        node.content = {};

        return Q.allSettled([
            Q.fs.read(path.resolve(_path, 'content.md'))
                .then(parseMarkdown)
                .then(function(parsed) {
                    _.defaults(node, parsed.attributes);
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
