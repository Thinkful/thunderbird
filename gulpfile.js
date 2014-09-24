var del = require('del');
var gulp = require('gulp');
var debug = require('gulp-debug');
var filter = require('gulp-filter');
var rename = require('gulp-rename');
var flatten = require('gulp-flatten');
var createCurriculumManifest = require('./src/createCurriculumManifest');
var populateUUIDs = require('./src/populate-uuids');

/* Configuration */
var argv = require('yargs').argv;
var paths = {
    build: (argv.build || "t-build"),
    source: (argv.source || "test")
};

var extensions = require("./asset-extensions")
var assetsRegex = new RegExp(".*[.](" + extensions.join("|") + ")$");

var sourceDirRegex = new RegExp(paths.source + "\/?");

/* Collects assets folders into one common assets folder */
gulp.task('assets', function() {
    if (argv["skip-assets"]) {
       return;
    } else {
       return gulp.src(paths.source + "/**/*")
        .pipe(filter(function(file) {
            // ./content/1.1.1_Assignment_Name/content.md ->
            // -- X -- md is not an acceptable extension, filtered out
            return assetsRegex.test(file.path);
        }))
        // .pipe(debug({title: "ASSET"}))
        .pipe(rename(function(path) {
            // ./content/1.1.1_Assignment_Name/img.png ->
            // ./1.1.1_Assignment_Name.img.png
            path.dirname = path.dirname.replace(sourceDirRegex, "");
        }))
        // .pipe(debug({title: "ASSET MOD"}))
        .pipe(gulp.dest(paths.build + "/assets"));
    }
});

/* Builds curriculum.json from structure and contents */
gulp.task('tree', function() {
    return gulp.src(paths.source + '/structure.xml')
        // .pipe(debug({title: "STRUCTURE XML"}))
        .pipe(populateUUIDs())
        .pipe(createCurriculumManifest({
          filename: "curriculum.json"
        }))
        .pipe(rename(function(path) {
            // ./content/1.1.1_Assignment_Name/img.png ->
            // ./1.1.1_Assignment_Name.img.png
            path.dirname = path.dirname.replace(sourceDirRegex, "");
        }))
        .pipe(gulp.dest(paths.build));
});

gulp.task('clean', del.bind(null, [paths.build]));

gulp.task('default', [
    'tree',
    'assets'
]);

