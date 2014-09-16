var assert = require('assert');

var through2 = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var _ = require('lodash');
var BeautifyHTML = require('js-beautify').html;
var UUID = require('node-uuid')

var createDOM = require('./create-dom');


const PLUGIN_NAME = 'gulp-populate-uuids';

/**
 *  Whitelisted nodes where UUID's are added
 **/
var uuidNodeWhitelist = [
    "unit",
    "lesson",
    "assignment"
];


/**
 * Assigns UUIDs where missing to an XML string
 * @param  {String} xmlStr The xml contents to ID
 * @return {String}        A string with the newly generated IDs
 */
var populate = function (xmlStr) {
    var $ = createDOM(xmlStr);

    var existingUUIDs = _.map($('[uuid]'), function(el) {
        return el.getAttribute("uuid");
    });

    var getNextNode = function() {
        return $(uuidNodeWhitelist.join(',')).not('[uuid]').first();
    }

    var node = getNextNode();
    while (node.length > 0) {
        var uid = UUID.v1();
        // If there is a collision with the existing UUIDs, retry
        if (_.indexOf(existingUUIDs, uid) != -1) {
            continue;
        }

        node.attr("uuid", uid);
        existingUUIDs.push(uid);
        node = getNextNode();
    }

    xmlStr = $('body').html();
    return BeautifyHTML(xmlStr);
}


module.exports = function() {
    return through2.obj(function(file, enc, done) {
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            return done(new PluginError('gulp-populate-uuids', 'Streaming not supported'));
        }

        var xmlStr = file.contents.toString('utf8');
        xmlStr = populate(xmlStr);

        this.push(new gutil.File({
            path: file.path,
            contents: new Buffer(xmlStr)
        }));
        // gotta call done, sneaky …
        done();

    });
};
