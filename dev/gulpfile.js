var gulp          = require('gulp'),
    rename        = require('gulp-rename'),
    uglify        = require('gulp-uglify');

var assetsDir = 'src',
    productionDir = '../public_html/assets/project_files';

//----------------------------------------------------Compiling

gulp.task('jsBuild', function () {
    return gulp.src([
        assetsDir + '/js/**/*.js',
        '!'+assetsDir + '/js/**/*.min.js'])
        .pipe(uglify())
        .pipe(rename(function(path){
            path.extname = '.min.js';
        }))
        .pipe(gulp.dest(productionDir + '/js/'))
});

gulp.task('default', gulp.series('jsBuild'));

gulp.task('watch', function() {
    gulp.watch(assetsDir + '/js/**/*.js', gulp.series('jsBuild'));
});

