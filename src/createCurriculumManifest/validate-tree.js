var _ = require('lodash');
var utils = require('../utils');
const colors = require('ansi-colors');
const log = require('fancy-log');

var validateHtml = require('./validate-html');

var filenameFromKey = function(contentKey) {
  switch (contentKey) {
    case 'body':
      return 'content.md';
    case 'comprehension':
      return 'comprehension.md';
    case 'raw':
      return 'content.html';
  }
};

var validateNode = function(node) {
  // Validate content
  _.forOwn(node.content, function(html, key) {
    validateHtml(html, node.src + '/' + filenameFromKey(key));
  });

  // Warn in case there is no node name
  if (_.isEmpty(node.name)) {
    log('Warning: Unnamed node ' + node.type + '. uuid=' + node.uuid);
  }

  // Error out in case there is no uuid
  if (
    _.isEmpty(node.root.$(node.element).attr('uuid')) &&
    node.type != 'course'
  ) {
    log.error(
      `Error: Empty uuid on ${colors.red(node.type)} with src=${node.src}`
    );
    log.error(
      colors.red('Remove and generate a new one, or find removed UUID.')
    );
    utils.fail();
  }

  return node;
};

var validateTree = function(treeRoot) {
  validateNode(treeRoot);

  _.forEach(treeRoot.children, function(child) {
    validateTree(child);
  });

  return treeRoot;
};

module.exports = validateTree;
