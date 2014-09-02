var through2 = require('through2');
var gutil = require('gulp-util');

var Q = require('q');

var _ = require('lodash');
var BeautifyHTML = require('js-beautify').html;

var createDOM = require('../create-dom');


/**
 * Initializes DocumentNode and creates tree with root and children
 * @param {Object} options {element, root?, parent?}
 */
var DocumentNode = function(options) {
    // Assigns element, other options and defaults
    _.assign(this, options);

    this._deferred = Q.defer();
    this.type = this.element.tagName.toLowerCase();

    // Initializes root
    if (_.isEmpty(this.parent)) {
        this.root = this;
        // Adds a list for all nodes in the tree
    }


    var childPromises = Q.all(this.setChildren());
    var currentNodePromise = Q.all(this.nodeFunctions);

    var self = this;

    Q.all([childPromises, currentNodePromise]).done( function(){
        self._deferred.resolve(self);
    });
};

DocumentNode.prototype.getPromise = function() {
    return this._deferred.promise;
}


/**
 * Returns element > content when present, an idiosyncrasy of the root node
 * Otherwise returns element
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


/* Returns array of promises for every child */
DocumentNode.prototype.setChildren = function() {
    var self = this;
    var children = this.get$contentElement().children().not('intro').toArray();
    var promises = []
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

    return _.map(this.children, function(child) {
        return child.getPromise();
    });
}


DocumentNode.prototype.toJSON = function() {
    var obj = _(this)
        .omit('element', 'parent', 'root', '_deferred', 'nodeFunctions')
        .omit(function(value, key) {
            this.hasOwnProperty(key);
        })
    .value();

    obj.parent = this.parent ? this.parent.uuid : null;
    if (_.isEmpty(obj.children))
        obj.children = null;

    return obj;
};


var buildTree = module.exports = function(file, nodeFunctions){
    var xmlStr = file.contents.toString('utf8');
    var $ = createDOM(xmlStr);

    DocumentNode.prototype.nodeFunctions = nodeFunctions || [function() {}];

    var doc = new DocumentNode({
        "$": $,
        element: $(":root")[0],
    });

    return doc.getPromise();
};
