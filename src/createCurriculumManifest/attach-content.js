const _ = require('lodash');
const colors = require('ansi-colors');
const log = require('fancy-log');
const path = require('path');
const Q = require('q');

const utils = require('../utils');
const parseMarkdown = require('./parse-markdown');

// Add file system support to Q
Q.fs = require('q-io/fs');

/**
 * Return a Promise that resolves to the result from parsing the content
 * markdown for this node.
 *
 * @param {String} _path Full path to the current node's directory
 * @param {String} rootDir Root directory of the current node
 * @return {Promise} Resolves to the markdown for the node's content body
 */
const getContentBody = (_path, rootDir) => {
  const markdownPath = path.resolve(_path, 'content.md');
  const relPath = markdownPath.replace(rootDir, '.');

  return Q.fs
    .read(markdownPath)
    .then(parseMarkdown({ processMarkdown: true }))
    .catch(err => {
      // Handle content.md not found
      if (err.code === 'ENOENT') {
        log(`Warning: ${colors.yellow(relPath)} not found`);
        return;
      }

      // Handle error parsing content.md's metadata
      if (err.front_matter_error) {
        log('Error parsing front matter in:');
        log(colors.yellow(markdownPath));
        log(err.front_matter_error);
        utils.fail();
      }

      // Handle unknown errors
      log(colors.yellow('Unrecognized error!'));
      log(err);
    })
    .then(parsed => parsed.body);
};

/**
 * Return a Promise that resolves to the raw html for this node
 *
 * @param {String} _path Full path to the current node's directory
 * @return {Promise} Resolves to the node's raw html
 */
const getContentRaw = _path => {
  const contentPath = path.resolve(_path, 'content.html');

  return Q.fs.read(contentPath);
};

/**
 * Return a Promise that resolves to the parsed comprehension Qs for this node
 *
 * @param {String} _path Full path to the current node's directory
 * @return {Promise} Resolves to the markdown for the node's comprehension Qs
 */
const getContentComprehension = _path => {
  const comprehensionPath = path.resolve(_path, 'comprehension.md');

  return Q.fs
    .read(comprehensionPath)
    .then(parseMarkdown({ processMarkdown: true }))
    .then(str => (str && str.body ? str.body : null));
};

module.exports = rootDir => node => {
  // Quit if src attribute isn't present
  if (_.isEmpty(node.src)) {
    return Q.when(true);
  }

  const _path = path.resolve(rootDir, node.src);

  node.content = {};

  return Q.allSettled([
    getContentBody(_path, rootDir).then(contentBody => {
      node.content.body = contentBody;
    }),

    getContentRaw(_path).then(contentRaw => {
      node.content.raw = contentRaw;
    }),

    getContentComprehension(_path).then(contentComprehension => {
      if (contentComprehension) {
        node.content.comprehension = contentComprehension;
      }
    }),
  ]);
};
