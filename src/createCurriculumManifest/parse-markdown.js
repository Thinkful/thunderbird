var _ = require('lodash');

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

module.exports = function(str) {
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
        //
        console.log("Front matter error: ", e.problem, "\n");
        console.log((e.problem_mark.buffer).split("\n")[e.problem_mark.line]);
        console.log(Array(e.problem_mark.column + 1).join(" ") + "^");
        throw new Error();
    }

    parsed.body = marked(parsed.body);
    parsed.body = fuckit_change_src_to_asset(parsed.body);
    return parsed;
}
