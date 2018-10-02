const gutil = require('gulp-util');

module.exports = $ => {
  if ($('style').length) {
    gutil.log(gutil.colors.yellow("Style tags found...and they're gone!"));
    $('style').replaceWith('');
  }
};
