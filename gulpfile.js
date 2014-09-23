var gulp = require('gulp');
var filter = require('gulp-filter');
var debug = require('gulp-debug');
var flatten = require('gulp-flatten');
var createCurriculumManifest = require('./src/createCurriculumManifest');
var populateUUIDs = require('./src/populate-uuids');

/* Configuration */
var argv = require('yargs').argv;
var paths = {
    buildDir: (argv.buildDir || ".build/"),
    sourceGlob: "test"
};

var assetsExtensions = [
    "svg", "png", "gif", "tiff", "mp3", "ogg", "jpg", "jpeg"];
var assetsRegex = new RegExp(".*\.(" + assetsExtensions.join("|") + ")$");

/* Collects assets folders into one common assets folder */
gulp.task('assets', function() {
    console.log("Asssets filter: ", assetsRegex);

    return gulp.src(paths.sourceGlob + "/**/*")
        .pipe(filter(function(file) {
            return assetsRegex.test(file.path);
        }))
        // .pipe(debug({title: "ASSET"}))
        .pipe(flatten())
        .pipe(gulp.dest(paths.buildDir + "assets"));
});

/* Builds curriculum.json from structure and contents */
gulp.task('tree', function() {
    return gulp.src(paths.sourceGlob + '/structure.xml')
        .pipe(populateUUIDs())
        .pipe(createCurriculumManifest({
          filename: "curriculum.json"
        }))
        .pipe(gulp.dest(paths.buildDir));
});

gulp.task('default', [
    'tree',
    'assets'
]);


