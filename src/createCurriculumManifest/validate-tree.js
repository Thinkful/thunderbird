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

    // Warn in case there is no node name
    if (_.isEmpty(node.name)) {
        gutil.log("Warning: Unnamed node " + node.type +". uuid=" + node.uuid);
    };

    // Warn in case there is no uuid
    // if (_.isEmpty(node.root.$(node.element).attr("uuid")) && node.type != "course") {
        // gutil.log("Warning: No uuid on " + gutil.colors.red(node.type) +".");
    // };

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
