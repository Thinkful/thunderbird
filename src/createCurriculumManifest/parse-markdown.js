var _ = require('lodash');
var frontMatter = require('front-matter');

var fixFrontMatterDelimiters = function(str) {
    // Changes arbitrary -'d separators in the old thinkdown to three ---
    str = str.replace(/\n\s*----+\s*\n/g, '\n---\n');

    // Prepends --- to parse old thinkdown format as front matter
    if (!/---/.test(str.split('\n')[0])) {
        str = '---\n' + str;
    }

    return str;
}

/* Higher order function that returns the markdown processor */
module.exports = function(options) {
    options = _.assign({processMarkdown: true}, options);

    return function parseMarkdown(str) {
        var parsed;

        if (_.isEmpty(str)) {
            return "";
        }

        str = fixFrontMatterDelimiters(str);

        // Extracts front matter and body
        try {
            parsed = frontMatter(str);
        } catch(e) {
            // throws for improperly formatted yaml, e.g. ":"'s in front matter
            //
            var buffer = ["Front matter error: ",
                      e.problem,
                      (e.problem_mark.buffer).split("\n")[e.problem_mark.line],
                      Array(e.problem_mark.column + 1).join(" ") + "^"
                     ].join("\n")
            e.front_matter_error = buffer;
            throw e;
        }

        if (options.processMarkdown) {
            parsed.body = require('./process-markdown')(parsed.body);
        }

        return parsed;
    }
}
