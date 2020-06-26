// Gulp
const { series, parallel, src, dest, watch } = require("gulp");
const concat = require('gulp-concat');
const del = require("del");
const zip = require('gulp-zip');


// SASS plugins
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const sourcemaps = require('gulp-sourcemaps');
sass.compiler = require('node-sass');

// JavaScript plugins
const uglify = require('gulp-uglify');


// Pug and HTML plugins
const pug = require("gulp-pug");
const prettyHtml = require('gulp-pretty-html');

// Images plugins
const image = require('gulp-image');

// BrowserSync
const browserSync = require('browser-sync').create();


// Paths
const paths = {
    srcDir: "./src",
    devDir: "./dev",
    buildDir: "./build"
};


// clean "dev" folder
function cleanDev(cb) {
	return del(paths.devDir).then(() => {
		cb();
	});
}

// clean "build" folder
function cleanBuild(cb) {
	return del(paths.buildDir).then(() => {
		cb();
	});
}

// Zip build folder
function zipBuild(){
	return src(paths.buildDir + '/**/*.*')
		.pipe(zip('build.zip'))
		.pipe(dest(paths.buildDir));
}


// SASS Tasks

// compile SASS to CSS and paste into dev folder
function sassDev() {
    const vendorsCssList = [
        './node_modules/normalize.css/normalize.css'
    ];

    return src(vendorsCssList)
        .pipe(sourcemaps.init())
        .pipe(src(paths.srcDir + '/scss/main.scss'))
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(concat('style.css'))
        .pipe(sourcemaps.write())
		.pipe(dest(paths.devDir  + '/css'))
		.pipe(browserSync.stream());
}

function cssBuild(){
	return src( paths.devDir + '/css/*.css')
		.pipe(csso({
			restructure: false,
			sourceMap: false,
			debug: true
		}))
		.pipe(dest(paths.buildDir + '/css'));
}


// compile Pug files to HTML into "dev" folder
function htmlDev() {
	return src(paths.srcDir + '/pug/views/*.pug')
		.pipe(
			pug({
				basedir: "./pug/",
				doctype: "html"
			})
		)
		.pipe(prettyHtml({
			indent_size: 4,
			indent_char: ' ',
			unformatted: ['code', 'pre', 'em', 'strong', 'span', 'i', 'b', 'br']
		}))
		.pipe(dest(paths.devDir));
}

function htmlBuild() {
	return src(paths.devDir + "/*.html")
		.pipe(dest(paths.buildDir));
}

function imagesDev(){
	return src(paths.srcDir + '/images/**/*.*')
		.pipe(dest(paths.devDir + '/images'));
}

function imagesBuild(){
	return src(paths.srcDir + '/images/**/*.*')
		.pipe(image({
				svgo: true
			}))
		.pipe(dest(paths.buildDir + '/images'));
}

function fontsDev(){
	return src(paths.srcDir + '/fonts/**/*.*')
		.pipe(dest(paths.devDir + '/fonts'));
}

function fontsBuild(){
	return src(paths.srcDir + '/fonts/**/*.*')
		.pipe(dest(paths.buildDir + '/fonts'));
}

function jsDev() {
	const jsPaths = [
		paths.srcDir + '/js/framework/**/*.js',
		paths.srcDir + '/js/libraries/**/*.js',
		paths.srcDir + '/js/plugins/**/*.js',
		paths.srcDir + '/js/*.js'
	];

	return src(jsPaths)
		.pipe(concat('main.js'))
		.pipe(dest( paths.devDir + '/js'));
}

function jsBuild() {
	return src(paths.devDir + '/js/*.js')
		.pipe(uglify())
		.pipe(dest( paths.buildDir + '/js'));
}


function serveDev(done){
    browserSync.init({
		watch: true,
        server: {
            baseDir: './dev'
        }
    });
    done();
}

function serveBuild(done){
    browserSync.init({
        server: {
            baseDir: './build'
        }
    });
    done();
}


function watchDev(){
    watch(paths.srcDir + '/**/*.+(css|scss|sass)', sassDev);
    watch(paths.srcDir + '/pug/**/*.pug', htmlDev);
    watch(paths.srcDir + '/images/**/*.*', imagesDev);
    watch(paths.srcDir + '/js/**/*.js', jsDev);
}

exports.default = series(
	cleanDev, 
	parallel(jsDev, fontsDev, htmlDev, sassDev, imagesDev), 
	serveDev, 
	watchDev
);

exports.build = series(
	cleanBuild,
	parallel(htmlBuild, cssBuild, jsBuild, imagesBuild, fontsBuild),
	zipBuild
);

exports.serveBuild = serveBuild;

