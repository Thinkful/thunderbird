var _ = require('lodash');
var gutil = require('gulp-util');

var validateHtml = require('./validate-html');

var filenameFromKey = function(contentKey) {
    switch (contentKey) {
        case "body":
            return "content.md"
        case "raw":
            return "content.html"
        case "comprehension":
            return "comprehension.md"
    }
}

var validateNode = function(node) {
    // Validate content
    _.forOwn(node.content, function(html, key) {
        validateHtml(html, node.src + "/" + filenameFromKey(key));
    });

    return node;
}

var validateTree = function(treeRoot) {
    validateNode(treeRoot);

    _.forEach(treeRoot.children, function(child) {
        validateTree(child);
    });

    return treeRoot;
}

module.exports = validateTree;
