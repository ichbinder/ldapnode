var gulp = require( 'gulp' );
var utils = require( '../utils.js' );

require( './build-scripts-backend' );
require( './build-scripts-frontend' );
require( './build-styles' );
require( './build-images' );
require( './build-views' );


gulp.task( 'build', [ 'build:images', 'build:styles', 'build:views', 'build:scripts-backend', 'build:scripts-frontend'] );

gulp.task( 'build-and-watch', ['build', 'watch:build'] );

gulp.task( 'watch:build', function ( ) {
  utils.watchTask( 'build:images' );
  utils.watchTask( 'build:styles' );
  utils.watchTask( 'build:views' );
  utils.watchTask( 'build:scripts-backend' );
  utils.watchTask( 'build:scripts-frontend' );
} );
