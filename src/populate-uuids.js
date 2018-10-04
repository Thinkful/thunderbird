const _ = require('lodash');
const beautify = require('js-beautify');
const gutil = require('gulp-util');
const through2 = require('through2');
const UUID = require('node-uuid');

const createDOM = require('./create-dom');

const { colors, File, log, PluginError } = gutil;

const PLUGIN_NAME = 'gulp-populate-uuids';

// Whitelisted tags where UUIDs can be added
const UUID_NODE_WHITE_LIST = ['unit', 'lesson', 'assignment', 'checkpoint'];

function UUIDNotFoundException() {}

/**
 * Get the next node with no uuid
 *
 * @param {Object} $ The dom object to remove onboarding tage from
 * @return {Object} First node object that has no UUID
 */
const getNextNode = $ =>
  $(UUID_NODE_WHITE_LIST.join(','))
    .not('[uuid]')
    .first();

/**
 * Remove onboarding tags from curricula
 *
 * @param {Object} $ The jQuery DOM object to remove onboarding tags from
 */
const removeOnboarding = $ => {
  var $onboarding = $('onboarding');

  if ($onboarding.length) {
    $onboarding.remove();
    log('Onboarding node removed from structure.xml');
  }
};

/**
 * Throw an error if any node is missing a UUID
 *
 * @param {Object} $ jQuery DOM object to check for missing UUIDs
 */
const strictCheckUUIDs = $ => {
  const node = getNextNode($);

  if (node.length > 0) {
    const e = new UUIDNotFoundException();
    e.message =
      `Node ${node[0].nodeName} with src=${node.attr('src')} ` +
      `does not have a UUID.\n >> Run thunderbird locally and ` +
      `commit the UUID changes into the repository`;
    throw e;
  }
};

/**
 * Create UUIDs for any nodes that don't have any.
 *
 * If running in strict mode (options.strict is true or "true"), an error will
 * be thrown if any node does not have a UUID already
 *
 * @param {Object} $ jQuery DOM object to create UUIDs for
 * @param {Object} options { strict }
 */
const createUUIDs = ($, options) => {
  // Get the first node with no UUID
  let node = getNextNode($);

  // Find all uuids that exist already in the DOM
  const existingUUIDs = _.map($('[uuid]'), el => el.getAttribute('uuid'));

  // Initialize the UUID varialbe
  let uid;

  while (node.length > 0) {
    // Get a new uuid
    uid = UUID.v1();

    // If there's a collision with an existing UUID, retry
    if (_.indexOf(existingUUIDs, uid) > -1) {
      continue;
    }

    // Add add the new UUID to the node
    node.attr('uuid', uid);

    // Add the new UUID to the list of UUIDs that exist
    existingUUIDs.push(uid);

    // Get the next node without a UUID (if any)
    node = getNextNode($);
  }
};

/**
 * Assigns UUIDs where missing to an XML string
 *
 * @param {String} xmlStr The xml contents to ID
 * @param {Object} options { strict }
 * @return {String} An xml string with the newly generated IDs included
 */
const populate = function(xmlStr, options) {
  const $ = createDOM(xmlStr);

  removeOnboarding($);

  // Strict mode doesn't allow UUID creation, so return
  if (options.strict.toString() === 'true') {
    return strictCheckUUIDs($);
  }

  createUUIDs($);

  // Turn the DOM back into a string of XML
  const newXmlStr = $('body').html();

  return beautify.html(newXmlStr);
};

module.exports = options =>
  through2.obj(function(file, enc, done) {
    log('UUIDs populating on:', colors.green(file.path));

    // Handle file does not exists
    if (file.isNull()) {
      return done(null, file);
    }

    // No support for file stream
    if (file.isStream()) {
      return done(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    // Get the file contents as a string
    const originalXml = file.contents.toString('utf8');

    let newXml = originalXml;

    // Handle error coming from missing UUIDs in strict mode
    try {
      newXml = populate(originalXml, options);
    } catch (e) {
      const errorMessage = 'Strict UUID Check Failed';
      log(colors.red(`${errorMessage}: ${e.message}`));
      return done(new PluginError(PLUGIN_NAME, errorMessage));
    }

    // Replace the old file with the new one
    this.push(
      new File({
        path: file.path,
        contents: new Buffer(newXml),
      })
    );

    done();
  });
