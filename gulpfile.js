var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');

var jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

gulp.task('reload', function () {
    browserSync.reload();
});

gulp.task('sync', ['sass'], function() {
    browserSync();
});

gulp.task('sass', function () {
    return gulp.src('./wwwroot/assets/sass/app.scss')
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 2 versions'], { cascade: true }))
        .pipe(gulp.dest('./wwwroot/assets/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('css'));
});

gulp.task('watch', ['sync'], function () {
    gulp.watch('./wwwroot/assets/**/*.scss', ['sass']);
    gulp.watch(['./Views/**/*.cshtml'], ['reload']);
});

gulp.task('default', ['sass', 'watch']);