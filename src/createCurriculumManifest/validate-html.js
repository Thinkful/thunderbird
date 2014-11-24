var _ = require('lodash');
var htmlparser = require('htmlparser2');
var gutil = require('gulp-util');

/*
 * Allowed html tags in the final output of thinkdown.
 *
 */
var htmlTags =
    ("h1 h2 h3 h4 h5 h6 blockquote span p a ul ol nl li b i strong em sup "
      + "code hr br div table thead object embed iframe "
      + "section footer header "
      + "cite caption tbody tr th td pre figure img picture").split(" ");
var customTags = ["assets", "question", "answer"];
var allowedTags = htmlTags.concat(customTags);

/*
 * Warns if any non-standard tags are used in the markdown or are generated
 * in preceding steps of thinkdown.
 *
 */
module.exports = function validateHtml(html, filename) {
    var parser = new htmlparser.Parser({
        onopentag: function (name, attrs) {
            if (_.indexOf(allowedTags, name) === -1) {
                gutil.log("Warning: Unusual HTML Tag", gutil.colors.yellow(name),
                          "in", filename);
            }
        }
    });

    parser.write(html);
    parser.end();
}
