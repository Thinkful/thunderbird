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
    var highlighted = hljs.highlightAuto(code);
    return '<pre class="hljs" ng-non-bindable>' + highlighted.value + '</pre>';
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

var replaceCssdeck = function($) {
    _.chain($('cssdeck[source]')).each(function(el) {
        var cssDeckIframe = "<iframe height='440' src='//cssdeck.com/labs/embed/" +
                         el.getAttribute("source") +
                         "/0/output,html,javascript' frameborder='0' allowfullscreen=''></iframe>";

        $(el).replaceWith($.parseHTML(cssDeckIframe));
    });

    if ($('cssdeck').length) {
        gutil.log("Warning: There seems to be a rogue cssdeck tag:" + $('cssdeck').first());
    }
}

/* In markdown, <youtube source="ZRGB350ak.."></youtube>
 * Gets translated to an iframe tag wrapped in some nice video things
 */
var replaceYoutube = function($) {
    _.chain($('youtube[source]')).each(function(el) {
        var newElement = $.parseHTML("<div class='video-container'><div class='video-content'></div></div>");
        var iframeHtml = "<iframe width='853' height='480' src='" +
                         el.getAttribute("source") +
                         "' frameborder='0' allowfullscreen=''></iframe>";

        newElement.children(".video-content").html(iframeHtml);
        $(el).replaceWith(newElement);
    });

    if ($('youtube').length) {
        gutil.log("Warning: There seems to be a rogue youtube tag:" + $('youtube').first());
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
    replaceCssdeck($);
    //replace_aframe($);

    return $('body').html();
}
