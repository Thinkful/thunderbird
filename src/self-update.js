const spawn = require('child_process').spawn;
const log = require('fancy-log');
const request = require('request');
const semver = require('semver');
const { StringDecoder } = require('string_decoder');

const decoder = new StringDecoder('utf8');

const runIfLatest = function(run) {
  var packageJson = require('./../package.json');
  var localVersion = packageJson['version'];
  var packageName = packageJson['name'];

  process.stdout.write('****** Checking for Thunderbird updates... ');

  var jsonResp;
  var npmProc;
  request.get('http://registry.npmjs.org/' + packageName + '/latest', function(
    err,
    body
  ) {
    if (err) {
      process.stdout.write('Error fetching version!', err);
      process.exit(1);
    } else {
      jsonResp = JSON.parse(body.body);
      if (jsonResp && jsonResp['version']) {
        if (semver.lt(localVersion, jsonResp['version'])) {
          console.log('Updating ' + packageName + '... ');
          npmProc = spawn('npm', ['update', '-g', packageName]);

          var handler = function(data) {
            process.stdout.write(
              data ? decoder.write(data) + decoder.end() : ''
            );
          };

          npmProc.stdout.on('data', handler);
          npmProc.stdout.on('end', handler);
          npmProc.stderr.on('data', handler);
          npmProc.stderr.on('end', handler);

          npmProc.on('error', function(errorino) {
            log.error('Encountered error:', errorino);
          });

          npmProc.on('exit', function(code) {
            console.log(
              '\n' + packageName + ' update complete. Have a nice day!'
            );
            process.exit(code);
          });
        } else {
          process.stdout.write('Up to date. ******\n');
          run();
        }
      } else {
        log.warn('Warning: unable to connect to npm. Skipping version check.');
        run();
      }
    }
  });
};

module.exports = runIfLatest;
