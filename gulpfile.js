var gulp = require('gulp');
var createCurriculumManifest = require('./src/createCurriculumManifest');
var populateUUIDs = require('./src/populate-uuids');

gulp.task('tree', function() {
    gulp.src('./test/**/structure.xml')
        .pipe(populateUUIDs())
        .pipe(createCurriculumManifest({
          filename: "curriculum.json"
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('default', ['tree']);


