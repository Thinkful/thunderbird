#! /usr/bin/env node

var fs = require('fs');
var path = require('path');
var argv = require('yargs').argv;
var spawn = require('child_process').spawn;
var StringDecoder = require('string_decoder').StringDecoder;

var gulpPath = path.resolve(__dirname)

/* Configuration */
var build = argv.build || argv.curric;
if (!build) {
    console.error("Caution: No build directory specified with --build (using 't-build').");
    build = "t-build"
}
var source = argv.source;
if (!source) {
    if (fs.existsSync("content")) {
        source = "content";
    } else {
        console.log("Please run thinkdown2 from the curriculum directory. 'content' not found.");
        process.exit(1);
    }
}

var gulpOptions = [
    '--color',
    '--cwd=' + gulpPath,
    '--source=' + path.resolve(source),
    '--build=' + path.resolve(build)
];

if (argv["skip-assets"]) {
    gulpOptions.push("--skip-assets");
}

/* Runs Gulp*/
var gulp = spawn('gulp', gulpOptions, {
    cwd: gulpPath
});

/* Sets up Gulp output to stream into this process */
var decoder = new StringDecoder('utf8');
gulp.stdout.on('data', function(data) {
    process.stdout.write(decoder.write(data) + decoder.end());
});
gulp.stdout.on('end', function(data) {
    process.stdout.write(data ? (decoder.write(data) + decoder.end()) : "");
    console.log("****** Thinkdown gulp completed. ******\n");
});

/* Sets up propagation of Gulp's exit() into this process */
gulp.on('exit', function(code) {
    if (code != 0) {
        console.log('Failed: ' + code);
        process.exit(1);
    }
});

