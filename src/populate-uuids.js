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
 * Assigns UUIDs where missing to an XML string
 * @param  {String} xmlStr The xml contents to ID
 * @return {String}        A string with the newly generated IDs
 */
var populate = function (xmlStr) {
    var $ = createDOM(xmlStr);
    var foreigners = $('*').not('[uuid]')
        .not('metadata, metadata *, content, intro')
        .toArray();
    var uuids = _.transform($('[uuid]').toArray(), function(list, el) {
        return $(el).attr('uuid');
    });

    _.each(foreigners, function(element) {
        var uid = UUID.v1();
        assert(_.indexOf(uuids, uid) === -1, "UUID Collision using v1 method");
        $(element).attr('uuid', UUID.v1());
    });

    xmlStr = $('body').html();

    return BeautifyHTML(xmlStr);
}


module.exports = function() {
    return through2.obj(function(file, enc, done) {
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            return done(new PluginError('gulp-less', 'Streaming not supported'));
        }

        var xmlStr = file.contents.toString('utf8');
        xmlStr = populate(xmlStr);

        this.push(new gutil.File({
            path: file.path,
            contents: new Buffer(xmlStr)
        }));

    });
};
