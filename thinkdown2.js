#! /usr/bin/env node

var path = require('path');
var args = require('yargs').argv;
var spawn = require('child_process').spawn;
var StringDecoder = require('string_decoder').StringDecoder;

var gulpPath = path.resolve(__dirname)

/* Configuration */
var build = args.build || args.curric;
if (!build) {
    console.error("Warning: No build directory specified with --build (using 't-build').");
    build = "t-build"
}
var assets = args.assets || "false";
var gulpOpts = [
    '--cwd=' + gulpPath,
    '--source=' + path.resolve(process.cwd()),
    '--build=' + path.resolve(build)
];
if (args.skipAssets) {
    gulpOpts.append("--skipAssets");
}

var gulp = spawn('gulp', gulpOpts, {
    cwd: gulpPath
});

var decoder = new StringDecoder('utf8');
gulp.stdout.on('data', function(data) {
    process.stdout.write(decoder.write(data) + decoder.end());
});
gulp.stdout.on('end', function(data) {
    process.stdout.write(data && data.toString('utf-8'));
});

gulp.on('exit', function(code) {
    if (code != 0) {
        console.log('Failed: ' + code);
        process.exit(1);
    }
});

