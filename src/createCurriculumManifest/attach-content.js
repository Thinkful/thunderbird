var path = require('path');
var fs = require('fs');

var gutil = require('gulp-util');

var _ = require('lodash');

var Q = require('q');
    Q.fs = require('q-io/fs');

var frontMatter = require('front-matter');
var marked = require('marked');
var hljs = require('highlight.js');

var createDom = require('../create-dom');

var renderer = new marked.Renderer();
renderer.code = function(code, lang) {
    var highlighted = hljs.highlightAuto(code);
    return '<pre class="hljs">' + highlighted.value + '</pre>';
}
marked.setOptions({
    renderer: renderer
});


var parseMarkdown = function(str) {
    var parsed;

    // Changes arbitrary -'d separators in the old thinkdown to three ---
    str = str.replace(/\n\s*----+\s*\n/g, '\n---\n');

    // Prepends --- to parse old thinkdown format as front matter
    if (!/---/.test(str.split('\n')[0])) {
        str = '---\n' + str;
    }

    // Extracts front matter and body
    try {
        parsed = frontMatter(str);
    } catch(e) {
        // throws for improperly formatted yaml, see front matter from:
        //  Unit 4 of NODE-001
        //      Intermediate Node.js Deploying and Platforms as a Service
        throw new Error(e.problem, e.stack);
    }
    if(_.isObject(parsed)) {
        parsed.body = marked(parsed.body);
        parsed.body = fuckit_change_src_to_asset(parsed.body);
    }

    return _.isObject(parsed) ? parsed : new Error("Could not parse markdown");
}

var fuckit_change_src_to_asset = function(html) {
    var $ = createDom(html);
    _.chain($('[src]'))
        .reject(function(el) {
            return /^(https?)?:?\/\//i.test(el.getAttribute('src'));
        })
        .each(function(el) {
            el.setAttribute('asset', el.getAttribute('src'));
            el.removeAttribute('src');
        });
    return $('body').html();
}

module.exports = function(options) {
    var dirname = path.dirname(options.file.path);

    return function(node) {
        // Quits if not src attribute is present
        if (_.isEmpty(node.src)) {
            gutil.log(gutil.colors.yellow(
                "Element", node.type, "has no src= attribute"
            ));
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
