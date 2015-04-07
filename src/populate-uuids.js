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

function UUIDNotFoundException() {}

/**
 * Assigns UUIDs where missing to an XML string
 * @param  {String} xmlStr The xml contents to ID
 * @return {String}        A string with the newly generated IDs
 */
var populate = function (xmlStr, options) {
    var $ = createDOM(xmlStr);

    // Migration, remove onboarding tags from curricula
    var $onboarding = $('onboarding')
    if ($onboarding.length) {
        $onboarding.remove();
        gutil.log("Onboarding node removed from structure.xml");
    }

    var existingUUIDs = _.map($('[uuid]'), function(el) {
        return el.getAttribute("uuid");
    });

    var getNextNode = function() {
        return $(uuidNodeWhitelist.join(',')).not('[uuid]').first();
    }

    var node = getNextNode();
    var uid;

    if (options.strict === "true" || options.strict === true) {
        if (node.length > 0) {
            var e = new UUIDNotFoundException();
            e.message = "Node " + node[0].nodeName + " with src=" + node.attr("src") +
                        " does not have a UUID." +
                        "\n >> Run thunderbird locally and commit the UUID changes " +
                        "into the repository";
            throw e;
        }
    } else {
        while (node.length > 0) {
            uid = UUID.v1();
            // If there is a collision with the existing UUIDs, retry
            if (_.indexOf(existingUUIDs, uid) != -1) {
                continue;
            }

            node.attr("uuid", uid);
            existingUUIDs.push(uid);
            node = getNextNode();
        }
    }

    xmlStr = $('body').html();
    return BeautifyHTML(xmlStr);
}


module.exports = function(options) {
    return through2.obj(function(file, enc, done) {
        gutil.log("UUIDs populating on:", gutil.colors.green(file.path));

        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            return done(new PluginError('gulp-populate-uuids', 'Streaming not supported'));
        }

        var xmlStr = file.contents.toString('utf8');
        try {
            xmlStr = populate(xmlStr, options);
        } catch (e ) {
            gutil.log(gutil.colors.red('Strict UUID Check Failed: ' + e.message));
            return done(new PluginError('gulp-populate-uuids', 'Strict UUID Check Failed.'));
        }

        this.push(new gutil.File({
            path: file.path,
            contents: new Buffer(xmlStr)
        }));

        done();
    });
};
