var through2 = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var _ = require('lodash');
var BeautifyHTML = require('js-beautify').html;

var createDOM = require('../create-dom');


/**
 * Creates DocumentNode, creates tree if children present
 * @param {Object} options should contain element reference and $DOM reference
 */
var DocumentNode = function(options) {
    this.initialize(options);
};


/**
 * Initializes DocumentNode with root reference=, metadata and children
 * @param {Object} options {element, $DOM, root?, parent?}
 */
DocumentNode.prototype.initialize = function(options) {
    // Assigns $, element, other options and defaults
    _.assign(this, options);

    this.type = this.element.tagName.toLowerCase();

    // Initializes root
    if (_.isEmpty(this.parent)) {
        this.root = this;
        // Adds a list for all nodes in the tree
        this.listOfAllNodes = [];
    }

    // Append to list of all nodes in the tree
    this.root.listOfAllNodes.push(this);

    this._setMetadata();

    this._setChildren();
};


/**
 * Returns element > content when present, an idiosyncrasy of the root node
 *
 * TODO legacy, remove
 *
 * @return {[type]} [description]
 */
DocumentNode.prototype.get$contentElement = function() {
    var $element = this.root.$(this.element);
    var $content = $element.children('content');
    return $content.size() === 0 ? $element : $content;
};


DocumentNode.prototype._setMetadata = function() {
    // Collects metadata from elements attributes
    var meta = _( this.element.attributes ).toArray()
        // Returns array of (property, value) tuples from
        //  (attr.name, attr.value)
        .map(function(attr){ return [attr.name, attr.value] })
        // Joins [(property, value), …] into {property: value, …}
        .zipObject()
    .value();
    // Assigns metadata to node
    _.defaults(this, meta);

    this._setMetadata_legacy();
}


DocumentNode.prototype._setMetadata_legacy = function() {
    var $ = this.root.$;
    var $element = $(this.element);

    var $intro = this.get$contentElement().children('intro');
    var introData = {};
    if ($intro.size()) {
        introData = _($intro[0].attributes)
            .toArray()
            .map(function(attr){ return [attr.name, attr.value] })
            .zipObject()
        .value();
    }
    _.defaults(this, introData);


    var $meta = $element.children('metadata');
    var metaData = {};
    if ($meta.size()) {
        metaData = _($meta.children().toArray())
            .map(function(tag){
                return [tag.tagName.toLowerCase(), $(tag).text()] })
            .zipObject()
        .value();
    }
    _.defaults(this, metaData);
}


DocumentNode.prototype._setChildren = function() {
    var self = this;
    var children = this.get$contentElement().children().not('intro').toArray();
    // Creates node for each child element
    this.children = _( children )
        .map(function (element) {
            return new DocumentNode({
                root: self.root,
                parent: self,
                element: element
            });
        })
    .value();
}


DocumentNode.prototype.toJSON = function() {
    var obj = _(this)
        .omit('element', 'parent', 'root', 'listOfAllNodes')
        .omit(_.isFunction)
    .value();

    obj.parent = this.parent ? this.parent.uuid : null;
    if (_.isEmpty(obj.children))
        obj.children = null;

    return obj;
};


module.exports = function(file){
    var xmlStr = file.contents.toString('utf8');
    var $ = createDOM(xmlStr);
    var courseElement = $('course')[0];
    var treeRoot = new DocumentNode({$: $, element: courseElement });

    return treeRoot;
};