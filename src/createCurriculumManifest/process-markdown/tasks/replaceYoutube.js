const gutil = require('gulp-util');

const { getNonSpecificSrc } = require('../utils');

/**
 * In markdown, <youtube source="ZRGB350ak.."></youtube>
 * Gets translated to an iframe tag wrapped in some nice video things
 */
module.exports = $ => {
  $('youtube[source]').each(el => {
    $(el).replaceWith(
      createVideoIFrame(getNonSpecificSrc($(el).attr('source')), $)
    );
  });

  const rogueYoutube = $('youtube').first();

  if (rogueYoutube.length) {
    gutil.log(
      `Warning: There seems to be a rogue youtube tag: ${rogueYoutube}`
    );
  }
};
