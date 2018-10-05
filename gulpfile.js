const del = require('del');
const colors = require('ansi-colors');
const filter = require('gulp-filter');
const flatten = require('gulp-flatten');
const gulp = require('gulp');
const log = require('fancy-log');
const nodemon = require('gulp-nodemon');

const createCurriculumManifest = require('./src/createCurriculumManifest');
const populateUUIDs = require('./src/populate-uuids');

/* Configuration */
var argv = require('yargs').argv;
process.env.target = argv.target;
var paths = {
  build: argv.build || 't-build',
  source: argv.source || process.cwd() + '/test/content',
};

var extensions = require('./asset-extensions');
var assetsRegex = new RegExp('.*[.](' + extensions.join('|') + ')$');

/* Collects assets folders into one common assets folder */
gulp.task('assets', function() {
  if (argv['skip-assets']) {
    return;
  } else {
    return gulp
      .src(paths.source + '/**/*')
      .pipe(
        filter(function(file) {
          // ./content/1.1.1_Assignment_Name/content.md ->
          // -- X -- md is not an acceptable extension, filtered out
          return assetsRegex.test(file.path);
        })
      )
      .pipe(gulp.dest(paths.build + '/assets'));
  }
});

gulp.task('uuids', function() {
  return gulp
    .src(paths.source + '/structure.xml')
    .pipe(
      populateUUIDs({
        strict: argv.strictuuids || false,
      })
    )
    .pipe(flatten())
    .pipe(gulp.dest(paths.source));
});

/* Builds curriculum.json from structure and contents */
gulp.task('tree', function() {
  return gulp
    .src(paths.source + '/structure.xml')
    .pipe(populateUUIDs({ strict: false }))
    .pipe(
      createCurriculumManifest({
        filename: 'curriculum.json',
      })
    )
    .pipe(flatten())
    .pipe(gulp.dest(paths.build));
});

gulp.task('info', function() {
  log(`Source path: ${colors.green(paths.source)}`);
  log(`Build path: ${colors.green(paths.build)}`);
});

gulp.task('clean', del.bind(null, [paths.build]));

var httpServer;
gulp.task('serve-curriculum', startHttpServer);
function startHttpServer(done) {
  if (httpServer) {
    httpServer.close(function() {
      startHttpServer(done);
    });
    return;
  }

  var gulp = require('gulp');
  var http = require('http');
  var express = require('express');

  var app = express();

  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });
  app.use(express.static(paths.build));

  httpServer = http.createServer(app).listen(5002);

  console.log('Listening on localhost:5002');

  done();
}

gulp.task('watch', function() {
  gulp.watch(paths.source + 'structure.xml', ['build']);
  gulp.watch(paths.source + '/**/content.md', ['build']);
});

gulp.task('develop', ['build', 'watch'], function() {
  nodemon({
    exec: ['serve-curriculum'].concat(process.argv.slice(3)),
    delay: 1000,
    verbose: true,
    ext: 'md',
    ignore: ['node_modules'],
  }).on('restart', [
    function() {
      console.log('Restarting');
    },
  ]);
});

gulp.task('build', ['info', 'uuids', 'tree', 'assets']);

gulp.task('default', ['build']);
