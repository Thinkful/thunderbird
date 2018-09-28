var _ = require('lodash');
var jsdom = require('jsdom').jsdom;
var jquery = require('jquery');

module.exports = function(xmlStr) {
  var html = _.template(
    '<html><head></head><body> <%= structure %> </body></html>',
    {
      structure: xmlStr,
    }
  );
  return jquery(jsdom(html).parentWindow);
};
