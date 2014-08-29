var assert = require('assert');

var through2 = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var _ = require('lodash');

var BeautifyHTML = require('js-beautify').html;
var jsdom = require('jsdom').jsdom;
var jquery = require('jquery');
var UUID = require('node-uuid')

// consts
const PLUGIN_NAME = 'gulp-structure-xml';

var populate = function (xmlStr) {
    var html = _.template(
        "<html><head></head><body> <%= structure %> </body></html>", {
        structure: xmlStr
    });
    var $ = jquery(jsdom(html).parentWindow);
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
        xmlStr = BeautifyHTML(xmlStr);
        this.push(new gutil.File({
            path: file.path,
            contents: new Buffer(xmlStr)
        }));

    });
};
