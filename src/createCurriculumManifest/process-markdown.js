var _ = require('lodash');
var gutil = require('gulp-util');
var createDom = require('../create-dom');

var marked = require('marked');
var hljs = require('highlight.js');

var renderer = new marked.Renderer();
renderer.codespan = function(code) {
    return '<code ng-non-bindable>' + code + '</code>';
}
renderer.code = function(code, lang) {
    var codeHtml = code;
    try {
        // if language is specified, and it is not "nohighlight",
        // use hljs.highlight with that language.
        if (lang) {
            if (lang !== "nohighlight") {
                codeHtml = hljs.highlight(lang.toLowerCase(), code).value;
            }
        } else {
            // if no language is specified, use highlightAuto
            codeHtml = hljs.highlightAuto(code).value;
        }
    } catch(e) {
        gutil.log(gutil.colors.yellow("Highlight Error!"), e);
    }

    return '<pre class="hljs" ng-non-bindable>' + codeHtml + '</pre>';
}

marked.setOptions({
    renderer: renderer
});

/* In markdown, * src= attributes point to relative URL's like 'foobar.png',
 *      this attribute is changed to asset=
 * In the learning app, a directive prepends the
 *      S3 URL prefix and the folder name before populating the src attribute.
 */
var changeSrcToAsset = function($) {
    _.chain($('[src]'))
        .reject(function(el) {
            return /^(https?)?:?\/\//i.test(el.getAttribute('src'));
        })
        .each(function(el) {
            el.setAttribute('asset', el.getAttribute('src'));
            el.removeAttribute('src');
        });
}

var nonSpecificSrc = function(src) {
    return src.replace(/^https?:/, "");
}

var createVideoIframe = function(source, $) {
    var newElement = $.parseHTML("<div class='video-container'><div class='video-content'></div></div>");
    var iframeHtml = "<iframe width='853' height='480' src='" + source +
                     "' frameborder='0' allowfullscreen=''></iframe>";

    $(newElement).children(".video-content").html(iframeHtml);
    return newElement;
}

var replaceAframe = function($) {
    _.chain($('aframe[src]')).each(function(el) {
        gutil.log("Deprecation: Aframes like this will not be supported soon: <aframe src=\"" + el.getAttribute("src") + "\">");

        var replacementEl;
        var source = el.getAttribute("src");
        if (source.match(/(youtu|vimeo)/)) {
            // Video
            replacementEl = createVideoIframe(nonSpecificSrc(source), $);
        } else {
            replacementEl = $.parseHTML("<iframe src='" +
                            nonSpecificSrc(source) +
                            "' frameborder='0' allowfullscreen=''></iframe>");
        }

        $(el).replaceWith(replacementEl);
    });
}

var replaceCodepen = function($) {
    _.chain($('codepen[source]')).each(function(el) {
        var embedUrl = "//codepen.io/team/thinkful/embed/" +
                       $(el).attr("source") +
                       "?height=440&theme-id=9607";
        var codepenIframe = "<iframe height='444' src='" + embedUrl +
                            "' frameborder='0'></iframe>";

        $(el).replaceWith($.parseHTML(codepenIframe));
    });

    if ($('codepen').length) {
        gutil.log("Warning: There seems to be a rogue codepen tag:" +
                  $('codepen').first());
    }
}

/* In markdown, <youtube source="ZRGB350ak.."></youtube>
 * Gets translated to an iframe tag wrapped in some nice video things
 */
var replaceYoutube = function($) {
    $('youtube[source]').each(function(el) {
        $(el).replaceWith(
            createVideoIframe(nonSpecificProtocol($(el).attr("source")), $));
    });

    if ($('youtube').length) {
        gutil.log("Warning: There seems to be a rogue youtube tag:" +
                  $('youtube').first());
    }
}

/* Just say no !!! */
var alreadyWarnedYouAboutStyles = false;
var killStyles = function($) {
    if (!alreadyWarnedYouAboutStyles && $('style').length) {
        gutil.log(gutil.colors.yellow("Style tags found... and they're gone!"));
        alreadyWarnedYouAboutStyles = true;
    }
    $('style').replaceWith('');
}

module.exports = function processMarkdown(markdown) {
    var html = marked(markdown);
    var $ = createDom(html);

    changeSrcToAsset($);

    killStyles($);
    replaceYoutube($);
    replaceCodepen($);
    replaceAframe($);

    return $('body').html();
}
