'use strict';
var path = require('path');
const colors = require('ansi-colors');
const log = require('fancy-log');

var _ = require('lodash');

var Q = require('q');
var QFS = require('q-io/fs');

var YAML = require('js-yaml');

var parseMarkdown = require('./parse-markdown');

/*
 * Creates an object from HTML element attributes
 */
var collectAttributes = function(element) {
  return _(element.attributes)
    .toArray()
    .reduce(function(obj, attr) {
      obj[attr.name] = attr.value;
      return obj;
    }, {});
};

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
      .map(function(tag) {
        return [tag.tagName.toLowerCase(), $(tag).text()];
      })
      .zipObject()
      .value();
    _.defaults(node, metaData);
  }
};

/*
 * Assigns element attributes to the DocumentNode
 */
var setMetadataFromStructure = function(node) {
  var meta = collectAttributes(node.element);
  _.defaults(node, meta);
};

/*
 * Assigns metadata from the parsed frontMatter object
 */
var setMetadataFromMarkdown = function(node, attributes) {
  _.defaults(node, attributes);

  // We override default node types in some cases
  if (/project/.test(attributes.type)) {
    node.type = 'project';
  } else if (/checkpoint/.test(attributes.type)) {
    node.type = 'checkpoint';
  }
};

function qRead(node, _path) {
  var relativePath = _path.replace(path.dirname(_path), '');

  var metadata;
  var syllabus;
  var contentPath = path.resolve(_path, 'content.md');
  var syllabusPath = path.resolve(_path, 'syllabus.yaml');
  var fileContents = '';

  metadata = QFS.read(contentPath)
    .then(function(content) {
      fileContents = content;
      return content;
    })
    .then(parseMarkdown({ processMarkdown: false }))
    .then(function(parsed) {
      /**
       * Validate content and formatting, overwrites original with updates
       */
      var metadataYAML;

      // Trim white space from end of markdown
      var body = (parsed.body || '')
        .replace(/\n\s*$/g, '\n')
        .replace(/^\n\s*/g, '');

      setMetadataFromMarkdown(node, parsed.attributes);

      // Write validated meta back to file, or report error
      try {
        metadataYAML = YAML.safeDump(parsed.attributes);
      } catch (e) {
        log(
          colors.red('Metadata'),
          'error serializing back to YAML, please inspect:',
          colors.yellow(path.basename(_path))
        );
        log('\n\n', colors.yellow(e.message));

        return Q.reject(e);
      }

      // Write over original with validated content
      var validatedContents = ['---', metadataYAML, '---', '', body, ''].join(
        '\n'
      );

      return QFS.write(contentPath, validatedContents).catch(function() {
        log.error(colors.red('Error'), 'trying to write', contentPath);
      });
    })
    .catch(function() {
      log.error(colors.red('Error'), 'trying to read', contentPath);
    });

  syllabus = QFS.read(syllabusPath)
    .then(function(syllabus) {
      if (_.isEmpty(syllabus)) {
        log.warn('Warning: No syllabus.yaml file found');
        return;
      }

      try {
        syllabus = YAML.safeLoad(syllabus);
        _.merge(node, { syllabus: syllabus });

        log(
          `${colors.green('Syllabus')} included for ${colors.blue(
            path.basename(_path)
          )}`
        );
      } catch (e) {
        log.error(
          `${colors.red(
            'Syllabus'
          )} has invalid YAML, please correct: ${colors.yellow(
            path.basename(_path)
          )}`
        );
        log.error('\n\n', colors.red(e.message));
      }
    })
    .catch(function() {
      log.error(
        colors.yellow('Caution'),
        'No syllabus metadata at',
        syllabusPath
      );
    });

  return Q.allSettled([metadata, syllabus]);
}

var setMetadata = (module.exports = function setMetadata(rootDir) {
  return function(node) {
    /* Legacy methods for storing metadata */
    setMetadataLegacy(node);

    /* Metadata from xml element attributes */
    setMetadataFromStructure(node);

    if (_.isEmpty(node.src)) {
      if (node.type != 'course') {
        // All elements except <course> should have an src attribute!
        log.warn(
          `Warning: Element ${colors.yellow(node.type)} has no src= attribute`
        );
      }
      return Q.when(true);
    }

    var _path = path.resolve(rootDir, node.src);

    /* Metadata from markdown */
    return qRead(node, _path);
  };
});
