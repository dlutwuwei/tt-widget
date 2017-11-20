var fileinclude = require('gulp-include-inline'),
    gulp = require('gulp'),
    nunjucks = require('nunjucks'),
    fs = require('fs'),
    connect = require('gulp-connect'),
    htmlInlineAutoprefixer = require("gulp-inline-autoprefixer"),
    autoprefixer = require('gulp-autoprefixer'),
    htmlInline = require('gulp-html-inline'),
    sass = require('gulp-ruby-sass'),
    cssBase64 = require('gulp-css-base64'),
    jade = require('gulp-jade'),
    imagemin = require('gulp-imagemin'),
    inlinesource = require('gulp-inline-source'),
    path = require('path'),
    static = require('serve-static'),
    through2 = require('through2');

var pkg = require('./package.json');

/**
 * 发布线上发布模板，并通过gulp-route-dest写到python项目中，widget和jinja均可。
 * 模板中脚本插入使用file-include或者inline-source。
 * 后续考虑集成为一个
 */
var empty = function(content) {
    return content;
};

// 生成jinja2模板
gulp.task('proc', ['jade-proc', 'js', 'sass', 'imgs'], function() {
    return gulp.src(['dist/jade_result/*.html']) //顺序不能换，后面的同名文件会覆盖前面的,jade生成文件优先
        .pipe(inlinesource({
            'rootpath': 'dist',
            'compress': false
        }))
        .pipe(htmlInlineAutoprefixer({ 'browsers': ['ios 7', 'Android >= 4'] }))
        .pipe(htmlInline({ minifyCss: true, minifyJs: false }))
        .pipe(gulp.dest('dist/release'))
        .pipe(connect.reload());
});

// 本地预览
gulp.task('dev', ['jade', 'html', 'imgs'], function() {
    gulp.watch(['scss/*.scss', 'scss/**/*.scss'], ['html']);
    gulp.watch(['js/*.js', 'js/**/*.js'], ['html']);
    gulp.watch(['imgs/*'], ['imgs']);
    gulp.watch(['jade/*'], ['jade', 'html']);
    gulp.watch(['html/*.html', 'tpl/*.tpl', 'data/*'], ['html']);
    connect.server({
        root: ['dist'],
        port: 8001,
        livereload: true,
        middleware: function(connect, connectApp) {
            return [static('dist/public'), swigRender()]
        }
    });
});

/**
 * 生成html文件本地调试,可本地测试jinja2模板，使用nunjucks模板（nodejs上实现的类jinja2模板）
 */
gulp.task('html', ['jade', 'js', 'sass'], function() {
    return gulp.src(['dist/jade_result/' + pkg.name + '.html'])
        .pipe(htmlInlineAutoprefixer({ browsers: ['ios 7', 'Android 4.3'] }))
        .pipe(gulp.dest('dist'))
        .pipe(connect.reload());
});

/**
 * jade task从jade生成html覆盖顶层目录下的同名html文件，千万分清jade和html的项目
 */
gulp.task('jade', ['js', 'sass'], function() {
    return gulp.src('./jade/*.jade')
        .pipe(jade({
            locals: {
                isDebug: true,
                projectName: pkg.name
            },
            pretty: true
        }))
        .pipe(gulp.dest('dist/jade_result'));
});

gulp.task('jade-proc', ['js', 'sass', 'imgs'], function() {
    return gulp.src('./jade/' + pkg.name + '.jade')
        .pipe(jade({
            locals: {
                isDebug: false,
                projectName: pkg.name
            },
            pretty: true
        }))
        .pipe(gulp.dest('dist/jade_result'));
});

gulp.task('imgs', function() {
    return gulp.src(['imgs/*', 'imgs/**/*'])
        .pipe(imagemin())
        .pipe(gulp.dest('dist/imgs'));
});

gulp.task('js', function() {
    return gulp.src(['js/*.js', 'js/**/*.js'])
        .pipe(gulp.dest('dist/public/js'))
        .pipe(connect.reload());
});

gulp.task('sass', ['imgs'], function() {
    sass(['scss/*.scss'])
        .pipe(autoprefixer({ browsers: ['ios 7', 'Android >= 4'] }))
        .pipe(cssBase64({
            baseDir: '../dist',
            maxWeightResource: 10000,
            extensionsAllowed: ['.gif', '.png', '.jpg']
        }))
        .pipe(gulp.dest('dist/public/css'))
        .pipe(connect.reload());
});

function swigRender(options) {
    options = options || {};
    return function swigRender(req, res, next) {
        var _path = req.url;
        var root = options.root || 'dist';
        var filePath = path.join(root, path.dirname(_path), path.basename(_path));
        var dataPath = options.dataPath || path.join('json', path.basename(_path).split('.')[0] + '.json');
        try {
            if (fs.lstatSync(filePath).isDirectory()) {
                next();
                return;
            }
            var readstream = fs.createReadStream(filePath);
            readstream.pipe(through2(function (chunk, enc, callback) {
                var file = '', content = '', data = {};
                try {
                    data = require(path.resolve(dataPath));
                    content = new Buffer(chunk).toString();
                    file = nunjucks.renderString(content, data);
                } catch (e) {
                    file = content;
                    console.log(e);
                }
                this.push(file);
                callback();
            })).pipe(res);
        } catch (e) {
            console.log(e)
        }
        next();
    }
}

