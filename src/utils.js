var gutil = require('gulp-util');

module.exports = {
    fail: function() {
        gutil.log(gutil.colors.bgRed(" ☢ Thinkdown Failed!    ☢ "));
        gutil.log(gutil.colors.bgRed(" ☢   Thinkdown Failed!  ☢ "));
        gutil.log(gutil.colors.bgRed(" ☢     Thinkdown Failed!☢ "));
        gutil.log("Exiting.");
        process.exit(1);
    }
}
