"use strict";
var path = require('path');

var _ = require('lodash');
var gutil = require('gulp-util');

var Q = require('q');
var QFS = require("q-io/fs");

var YAML = require('js-yaml');

var parseMarkdown = require('./parse-markdown');


/*
 * Creates an object from HTML element attributes
 */
var collectAttributes = function(element) {
    return _( element.attributes ).toArray().reduce(function (obj, attr) {
        obj[attr.name] = attr.value;
        return obj;
    }, {});
}

/* TODO(olex): Remove legacy methods of attaching metadata
 * TODO(olex): Removing this would also allow removing passing
 *             around the jQuery object from structure.xml in
 *             the document tree.
 */
var setMetadataLegacy = function(node) {
    var $ = node.root.$;
    var $element = $(node.element);

    /* Some legacy elements have an intro tag where src="" and other
     * attributes are specified.
     *
     */
    var $intro = node.get$contentElement().children('intro');
    if ($intro.size()) {
        _.defaults(node, collectAttributes($intro[0]));
    }

    /* The root element has an XML child `metadata` that contains
     * attributes related to the course. Each attribute is its own element,
     * not done via XML attributes.
     */
    var $meta = $element.children('metadata');
    if ($meta.size()) {
        var metaData = {};
        metaData = _($meta.children().toArray())
            .map(function(tag){
                return [tag.tagName.toLowerCase(), $(tag).text()] })
            .zipObject()
        .value();
        _.defaults(node, metaData);
    }
}

/*
 * Assigns element attributes to the DocumentNode
 */
var setMetadataFromStructure = function(node) {
    var meta = collectAttributes(node.element);
    _.defaults(node, meta);
}

/*
 * Assigns metadata from the parsed frontMatter object
 */
var setMetadataFromMarkdown = function(node, attributes) {
    _.defaults(node, attributes);

    /* TODO(olex): This is the only case where markdown overrides structure.xml
     *             Switch to <project> tags instead of <assignment>
     */
    if (/project/.test(attributes.type)) {
        node.type = "project";
    }
}

function qRead (node, _path) {
    var relativePath = _path.replace(path.dirname(_path), '');

    var contentPath = path.resolve(_path, 'content.md')
    ,   metadata;

    var syllabusPath = path.resolve(_path, 'syllabus.yaml')
    ,   syllabus;

    metadata = QFS.read(contentPath)
    .then(parseMarkdown({ "processMarkdown": false }))
    .then(function(parsed) {
        var metadataYAML;

        // Validate all metadata attributes, I'm looking at your "Code-Along content"
        setMetadataFromMarkdown(node, parsed.attributes);

        // Write validated meta back to file
        try {
            metadataYAML = YAML.safeDump(parsed.attributes);

        } catch (e) {
            gutil.log(
                gutil.colors.red('Metadata'),
                'error serializing back to YAML, please inspect:',
                gutil.colors.yellow(path.basename(_path))
            );
            gutil.log('\n\n', gutil.colors.yellow(e.message));

            return Q.reject(e);
        }

        // Write over original
        return QFS.write(
            path.resolve(_path, 'content.md')
        ,   [   '---'
            ,   metadataYAML
            ,   '---'
            ,   ''
            ,   parsed.body
            ].join('\n')
        );
    })
    .catch(function () {
        gutil.log(gutil.colors.red("Error"), "trying to open", relativePath);
    });

    syllabus = QFS.read(syllabusPath)
    .then(function (syllabus) {
        if (_.isEmpty(syllabus)) {
            gutil.log("Warning: No syllabus.yaml file found");
            return;
        }

        try {
            syllabus = YAML.safeLoad(syllabus);
            _.merge(node, {'syllabus': syllabus});

            gutil.log(
                gutil.colors.green('Syllabus'),
                'included for',
                gutil.colors.blue(path.basename(_path))
            );

        } catch (e) {
            gutil.log(
                gutil.colors.red('Syllabus'),
                'has invalid YAML, please correct:',
                gutil.colors.yellow(path.basename(_path))
            );
            gutil.log('\n\n', gutil.colors.yellow(e.message));
        }
    })
    .catch(function () {
        gutil.log(gutil.colors.red("Error"), "trying to open", relativePath);
    });

    return Q.allSettled([metadata, syllabus]);
}
var setMetadata = module.exports = function setMetadata (rootDir) {
    return function (node) {
        /* Legacy methods for storing metadata */
        setMetadataLegacy(node);

        /* Metadata from xml element attributes */
        setMetadataFromStructure(node);

        if (_.isEmpty(node.src)) {
            if (node.type != "course") {
                // All elements except <course> should have an src attribute!
                gutil.log("Warning: Element", gutil.colors.yellow(node.type),
                    "has no src= attribute");
            }
            return Q.when(true);
        }

        var _path = path.resolve(rootDir, node.src);

        /* Metadata from markdown */
        return qRead(node, _path);
    }
};


