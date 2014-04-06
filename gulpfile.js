"use strict";
var gulp = require('gulp');

var p = require('gulp-load-tasks')();

gulp.task('clean', function() {
   return gulp.src('dist')
       .pipe(p.clean());
});

gulp.task('vendor', function() {
    return gulp.src([
            'app/bower_components/bootstrap/dist/css/bootstrap.min.css',
            'app/bower_components/font-awesome/css/font-awesome.min.css',
            'app/bower_components/font-awesome/fonts/**',
            'app/bower_components/jquery/dist/jquery.min.js',
            'app/bower_components/angular/angular.min.js'
        ], { base : 'app' })
        .pipe(gulp.dest('dist'));
});

gulp.task('copy', function() {
    return gulp.src([
            '!app/bower_components{,/**}',
            'app/**'
        ])
        .pipe(gulp.dest('dist'));
});

gulp.task('zip', function() {
    return gulp.src('dist/**')
        .pipe(p.zip('dist.zip'))
        .pipe(gulp.dest('.'));
});

gulp.task('build', ['copy', 'vendor'], function() {
    gulp.start('zip');
});

// Default task
gulp.task('default', ['clean'], function () {
    gulp.start('build');
});
