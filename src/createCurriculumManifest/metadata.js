var _ = require('lodash');
var Q = require('q');

/*
 * Creates an object from HTML element attributes
 */
collectAttributes = function(element) {
    return _( element.attributes ).toArray()
        // Returns array of (property, value) tuples from
        //  (attr.name, attr.value)
        .map(function(attr){ return [attr.name, attr.value] })
        // Joins [(property, value), …] into {property: value, …}
        .zipObject()
    .value();
}

_setMetadata_legacy = function() {
    var $ = this.root.$;
    var $element = $(this.element);

    /* Some legacy elements have an intro tag where src="" and other
     * attributes are specified.
     *
     */
    var $intro = this.get$contentElement().children('intro');
    if ($intro.size()) {
        _.defaults(this, collectAttributes($intro[0]));
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
        _.defaults(this, metaData);
    }
}

/*
 * Assigns element attributes to the DocumentNode
 */
var _setMetadata = function() {
    var meta = collectAttributes(this.element);
    _.defaults(this, meta);
}

var setMetadata = module.exports = function(node) {
    /* Legacy methods for storing metadata */
    _.bind(_setMetadata_legacy, node)();

    /* Metadata from xml element attributes */
    _.bind(_setMetadata, node)();

    return Q.when(1);
};


