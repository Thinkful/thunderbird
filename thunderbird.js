#! /usr/bin/env node
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { StringDecoder } = require('string_decoder');
const { argv } = require('yargs');

const selfUpdate = require('./src/self-update');

/* Sets up Gulp output to stream into this process */
const decoder = new StringDecoder('utf8');

/* Thunderbird help */
if (argv.help) {
  process.stdout.write(fs.readFileSync(path.resolve(__dirname, 'usage.txt')));
  process.exit(1);
}

if (argv['version']) {
  var localVersion = require('./package.json')['version'];
  console.log(localVersion);
  process.exit(1);
}

if (argv['i-really-love-dogs']) {
  spawn('open', ['http://omfgdogs.com/']);
  process.exit(1);
}

/* Self update; if latest version, runThunderbird */
selfUpdate(runThunderbird);

function runThunderbird() {
  /* Thunderbird / Gulp Configuration */
  var build;
  var local = argv.local;
  if (local) {
    console.log(
      'Build default for local builds: /usr/local/tmp/tf-thunderbird-build'
    );
    build = '/usr/local/tmp/tf-thunderbird-build';
  }

  build = argv.build || argv.curric || build;
  if (!build) {
    console.log(
      "Caution: No build directory specified with --build (using 't-build')."
    );
    build = 't-build';
  }

  var source = argv.source;
  if (!source) {
    if (fs.existsSync('content')) {
      source = 'content';
    } else {
      console.log(
        "Please run thunderbird from the curriculum directory. 'content' not found."
      );
      process.exit(1);
    }
  }

  var gulpCommand = argv.dev ? 'develop' : 'build';

  var gulpPath = path.resolve(__dirname);
  var gulpOptions = [
    gulpCommand,
    '--color',
    '--cwd=' + gulpPath,
    '--source=' + path.resolve(source),
    '--build=' + path.resolve(build),
    '--strictuuids=' + (argv.strictuuids || 'false'),
    '--target=' +
      (_.indexOf(argv._, 'production') >= 0 ? 'production' : 'preview'),
  ];

  if (argv['skip-assets']) {
    gulpOptions.push('--skip-assets');
  }

  /* Runs Gulp*/
  var gulp = spawn('gulp', gulpOptions, {
    cwd: gulpPath,
  });

  gulp.stdout.on('data', function(data) {
    process.stdout.write(decoder.write(data) + decoder.end());
  });

  gulp.stdout.on('end', function(data) {
    process.stdout.write(data ? decoder.write(data) + decoder.end() : '');
    console.log('****** Thunderbird gulp completed. ******\n');
  });

  gulp.stderr.on('data', function(data) {
    process.stdout.write(decoder.write(data) + decoder.end());
  });

  /* Sets up propagation of Gulp's exit() into this process */
  gulp.on('exit', function(code) {
    if (code != 0) {
      console.log('Thunderbird Failed: ' + code);
      process.exit(1);
    }
  });
}
