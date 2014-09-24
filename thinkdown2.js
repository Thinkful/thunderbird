#! /usr/bin/env node

var path = require('path');
var argv = require('yargs').argv;
var spawn = require('child_process').spawn;
var StringDecoder = require('string_decoder').StringDecoder;

var gulpPath = path.resolve(__dirname)

/* Configuration */
var build = argv.build || argv.curric;
if (!build) {
    console.error("Warning: No build directory specified with --build (using 't-build').");
    build = "t-build"
}
var assets = argv.assets || "false";
var gulpOptions = [
    '--cwd=' + gulpPath,
    '--source=' + path.resolve(process.cwd()),
    '--build=' + path.resolve(build)
];

if (argv["skip-assets"]) {
    gulpOptions.push("--skip-assets");
}

var gulp = spawn('gulp', gulpOptions, {
    cwd: gulpPath
});

var decoder = new StringDecoder('utf8');
gulp.stdout.on('data', function(data) {
    process.stdout.write(decoder.write(data) + decoder.end());
});
gulp.stdout.on('end', function(data) {
    process.stdout.write(data ? decoder.write(data) + decoder.end() : "****** Thinkdown gulp finished.\n");
});

gulp.on('exit', function(code) {
    if (code != 0) {
        console.log('Failed: ' + code);
        process.exit(1);
    }
});

