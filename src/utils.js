const colors = require('ansi-colors');
const log = require('fancy-log');

module.exports = {
  fail: function() {
    log(colors.bgRed(' ☢ Thunderbird Failed!    ☢ '));
    log(colors.bgRed(' ☢   Thunderbird Failed!  ☢ '));
    log(colors.bgRed(' ☢     Thunderbird Failed!☢ '));
    log('Exiting.');
    process.exit(1);
  },
};
