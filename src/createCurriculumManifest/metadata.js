var _ = require('lodash');
var Q = require('q');

/*
 * Creates an object from HTML element attributes
 */
collectAttributes = function(element) {
    return _( element.attributes ).toArray().reduce(function (obj, attr) {
        obj[attr.name] = attr.value;
        return obj;
    }, {});
}

_setMetadata_legacy = function(node, options) {
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
var _setMetadata = function(node, options) {
    var meta = collectAttributes(node.element);
    _.defaults(node, meta);
}

var setMetadata = module.exports = function(options) {
    return function (node) {
        /* Legacy methods for storing metadata */
        _setMetadata_legacy(node, options);

        /* Metadata from xml element attributes */
        _setMetadata(node, options);

        return Q.when(1);

    }
};


