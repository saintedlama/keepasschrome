"use strict";
var gulp = require('gulp');

var p = require('gulp-load-tasks')();

gulp.task('clean', function() {
   return gulp.src('dist')
       .pipe(p.clean());
});

gulp.task('copy', function() {
    return gulp.src([
            'app/index.html',
            'app/scripts',
            'app/images',
            'app/styles'
        ], { base : 'app' })
        .pipe(gulp.dest('dist'));
});

gulp.task('build', function() {
});

gulp.task('default', ['clean', 'build']);
