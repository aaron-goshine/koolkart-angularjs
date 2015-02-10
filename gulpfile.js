var $ = require('gulp-load-plugins')({pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']});
var browserSync = require('browser-sync');
var gulp = require('gulp');
var middleware = [];
var util = require('util');
var wiredep = require('wiredep');
var wiredepStream = require('wiredep').stream;


gulp.task('html', ['inject', 'partials'], function() {
  gulp.start('partials');
  var partialsInjectFile = gulp.src('tmp/partials/templateCacheHtml.js', {read: false});
  var partialsInjectOptions = {
    starttag: '<!-- inject:partials -->',
    ignorePath: 'tmp/partials',
    addRootSlash: false
  };

  var htmlFilter = $.filter('*.html');
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');
  var assets;

  return gulp.src('tmp/serve/*.html')
    .pipe($.inject(partialsInjectFile, partialsInjectOptions))
    .pipe(assets = $.useref.assets())
    .pipe($.rev())
    .pipe(jsFilter)
    .pipe($.ngAnnotate())
    .pipe($.uglify({preserveComments: $.uglifySaveLicense}))
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.replace('../bootstrap-sass-official/assets/fonts/bootstrap', 'fonts'))
    .pipe($.csso())
    .pipe(cssFilter.restore())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe(htmlFilter)
    //.pipe($.minifyHtml({
    //  empty: true,
    //  spare: true,
    //  quotes: true
    //}))
    .pipe(htmlFilter.restore())
    .pipe(gulp.dest('dist/'))
    .pipe($.size({title: 'dist/', showFiles: true}));
});


gulp.task('inject', ['styles'], function() {
  var injectStyles = gulp.src([
    'tmp/serve/{app,components}/**/*.css',
    '!tmp/serve/app/vendor.css'
  ], {read: false});
  var injectScripts = gulp.src([
    'src/{app,components}/**/*.js',
    '!src/{app,components}/**/*.spec.js',
    '!src/{app,components}/**/*.mock.js'
  ]).pipe($.angularFilesort());
  var injectOptions = {
    ignorePath: ['src', 'tmp/serve'],
    addRootSlash: false
  };

  var wiredepOptions = {
    directory: 'bower_components',
    exclude: [/bootstrap-sass-official/, /bootstrap\.css/, /bootstrap\.css/, /foundation\.css/]
  };

  return gulp.src('src/*.html')
    .pipe($.inject(injectStyles, injectOptions))
    .pipe($.inject(injectScripts, injectOptions))
    .pipe(wiredepStream(wiredepOptions))
    .pipe(gulp.dest('tmp/serve'));

});

gulp.task('partials', function() {
  console.log('partials');
  return gulp.src([
    'src/app,components}/**/*.html',
    'src/components/html/**/*.html',
    'tmp/{app,components}/**/*.html'
  ])
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: 'koolkartAngularjs'
    }))
    .pipe(gulp.dest('tmp/partials/'));
});


gulp.task('styles', function() {

  var sassOptions = {
    style: 'expanded'
  };

  var injectFiles = gulp.src([
    'src/{app,components}/**/*.scss',
    '!src/app/index.scss',
    '!src/app/vendor.scss'
  ], {read: false});

  var injectOptions = {
    transform: function(filePath) {
      filePath = filePath.replace('src/app/', '');
      filePath = filePath.replace('src/components/', '../components/');
      return '@import \'' + filePath + '\';';
    },
    starttag: '// injector',
    endtag: '// endinjector',
    addRootSlash: false
  };

  var indexFilter = $.filter('index.scss');

  return gulp.src([
    'src/app/index.scss',
    'src/app/vendor.scss'
  ])
    .pipe(indexFilter)
    .pipe($.inject(injectFiles, injectOptions))
    .pipe(indexFilter.restore())
    .pipe($.sass(sassOptions))
    .pipe($.autoprefixer())
    .on('error', function handleError(err) {
      console.error(err.toString());
      this.emit('end');
    })
    .pipe(gulp.dest('tmp/serve/app/'));
});


gulp.task('images', function() {
  return gulp.src('src/assets/images/**/*')
    .pipe(gulp.dest('dist/assets/images/'));
});

gulp.task('fonts', function() {
  return gulp.src($.mainBowerFiles())
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/fonts/'));
});

gulp.task('misc', function() {
  return gulp.src('src/**/*.ico')
    .pipe(gulp.dest('dist/'));
});

gulp.task('clean', function(done) {
  $.del(['dist/', 'tmp/'], done);
});

function browserSyncInit(baseDir, files, browser) {
  browser = browser === undefined ? 'default' : browser;
  var routes = null;
  if (baseDir === 'src' || (util.isArray(baseDir) && baseDir.indexOf('src') !== -1)) {
    routes = {
      '/bower_components': 'bower_components'
    };
  }

  browserSync.instance = browserSync.init(files, {
    startPath: '/',
    server: {
      baseDir: baseDir,
      middleware: middleware,
      routes: routes
    },
    browser: browser
  });
}

gulp.task('serve', ['watch'], function() {
  browserSyncInit([
    'tmp/serve',
    'src'
  ], [
    'tmp/serve/{app,components}/**/*.css',
    'src/{app,components}/**/*.js',
    'src/assets/images/**/*',
    'tmp/serve/*.html',
    'tmp/serve/{app,components}/**/*.html',
    'src/{app,components}/**/*.html'
  ]);
});

gulp.task('serve:dist', ['build'], function() {
  browserSyncInit('dist');
});

gulp.task('serve:e2e', ['inject'], function() {
  browserSyncInit(['tmp/serve', 'src'], null, []);
});

gulp.task('serve:e2e-dist', ['build'], function() {
  browserSyncInit('dist', null, []);
});

// Downloads the selenium webdriver
gulp.task('webdriver-update', $.protractor.webdriver_update);

gulp.task('webdriver-standalone', $.protractor.webdriver_standalone);

function runProtractor(done) {

  gulp.src('e2e/**/*.js')
    .pipe($.protractor.protractor({
      configFile: 'protractor.conf.js'
    }))
    .on('error', function(err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    })
    .on('end', function() {
      // Close browser sync server
      browserSync.exit();
      done();
    });
}

gulp.task('protractor', ['protractor:src']);
gulp.task('protractor:src', ['serve:e2e', 'webdriver-update'], runProtractor);
gulp.task('protractor:dist', ['serve:e2e-dist', 'webdriver-update'], runProtractor);


function runTests(singleRun, done) {
  var bowerDeps = wiredep({
    directory: 'bower_components',
    exclude: ['bootstrap-sass-official'],
    dependencies: true,
    devDependencies: true
  });

  var testFiles = bowerDeps.js.concat([
    'src/{app,components}/**/*.js'
  ]);

  gulp.src(testFiles)
    .pipe($.karma({
      configFile: 'karma.conf.js',
      action: (singleRun) ? 'run' : 'watch'
    }))
    .on('error', function(err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
}

gulp.task('test', function(done) {
  runTests(true /* singleRun */, done)
});
gulp.task('test:auto', function(done) {
  runTests(false /* singleRun */, done)
});

var httpProxy = require('http-proxy');
var chalk = require('chalk');

/*
 * Location of your backend server
 */
var proxyTarget = 'http://server/context/';

var proxy = httpProxy.createProxyServer({
  target: proxyTarget
});

proxy.on('error', function(error, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  console.error(chalk.red('[Proxy]'), error);
});

/*
 * The proxy middleware is an Express middleware added to BrowserSync to
 * handle backend request and proxy them to your backend.
 */
function proxyMiddleware(req, res, next) {
  /*
   * This test is the switch of each request to determine if the request is
   * for a static file to be handled by BrowserSync or a backend request to proxy.
   *
   * The existing test is a standard check on the files extensions but it may fail
   * for your needs. If you can, you could also check on a context in the url which
   * may be more reliable but can't be generic.
   */
  if (/\.(html|css|js|png|jpg|jpeg|gif|ico|xml|rss|txt|eot|svg|ttf|woff|cur)(\?((r|v|rel|rev)=[\-\.\w]*)?)?$/.test(req.url)) {
    next();
  } else {
    proxy.web(req, res);
  }
}


gulp.task('build', ['clean', 'html', 'images', 'fonts', 'misc']);

gulp.task('watch', ['inject'], function() {
  gulp.watch([
    'src/*.html',
    'src/{app,components}/**/*.scss',
    'src/{app,components}/**/*.js',
    'bower.json',
  ], ['inject']);
});

gulp.task('default', ['clean'], function() {
  gulp.start('build');
});


