const marked = require('marked');

const createDom = require('../create-dom');

const renderer = require('./renderer');
const tasks = require('./tasks');

marked.setOptions({
  renderer,
});

module.exports = function processMarkdown(markdown) {
  var html = marked(markdown);
  var $ = createDom(html);

  tasks.forEach(task => task($));

  return $('body').html();
};
