/*
 *  @license
 *    Copyright 2017 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
"use strict";
const path = require('path');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');

/**
 * @typedef {{}} Options
 * @property {string} componentName
 * @property {string} [outputDirectory]
 * @property {JsConfig} [js]
 * @property {CssConfig} [css]
 * @property {string} webpackContext
 * @property {{}} webpackConfig
 */

/**
 * @typedef {{}} JsConfig
 * @property {string} input
 * @property {{loader: string, bundle: string, compatBundle: string, webpackConfig: {}, webpackContext: string}} [output]
 * @property {string} [polyfillUrl] Overrides the default polyfill URL
 */

/**
 * @typedef {{}} CssConfig
 * @property {string} input
 * @property {string} [output]
 */

/**
 *
 * @param gulp
 * @param {Options} opts
 */
module.exports = function initGulp(gulp, opts) {
    if (!opts) throw new Error('`opts` must be specified');
    let {componentName, js, css} = opts;

    let outputDir;
    if (opts.outputDirectory && path.isAbsolute(opts.outputDirectory)) {
        outputDir = opts.outputDirectory;
    } else {
        outputDir = path.join(process.cwd(), opts.outputDirectory || 'dist');
    }

    let buildTasks = [];

    if (js) {
        let task = initJs(gulp, js, componentName, outputDir);
        buildTasks.push(task);
    }

    if (css) {
        let task = initCss(gulp, css, componentName, outputDir);
        buildTasks.push(task);
    }

    gulp.task('wc:build', buildTasks);
};

function initJs(gulp, jsConfig, componentName, outputDir) {
    const webpackStream = require('webpack-stream');
    const babel = require('gulp-babel');
    const through = require('through2');
    const loaderGenerator = require('byu-web-component-loader-generator').stream;

    let jsOutput = jsConfig.output || {};
    let bundleOutput = jsOutput.bundle || 'components.js';
    let compatOutput = jsOutput.compatBundle || path.basename(bundleOutput, '.js') + '-compat.js';

    let bundleOutputMin = minFile(bundleOutput);
    let compatOutputMin = minFile(compatOutput);

    let polyfillUrl = jsConfig.polyfillUrl;

    let loaderOutput = jsOutput.loader || componentName + '.js';

    const webpack = require('webpack');

    gulp.task('wc:js:assemble', function () {
        let wpConfig = jsConfig.webpackConfig || require('../default-webpack.config')(jsConfig.input, bundleOutput);
        if (jsConfig.webpackContext) wpConfig.context = jsConfig.webpackContext;
        return gulp.src(jsConfig.input)
            .pipe(webpackStream(wpConfig, webpack))
            .pipe(gulp.dest(outputDir))
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(through.obj(function (file, enc, cb) {//do NOT change this to an arrow function!
                //Don't pipe through any source map files as they'll be handled by gulp-sourcemaps
                let isSourceMap = /\.map$/.test(file.path);
                if (!isSourceMap) this.push(file);
                cb();
            }))
            .pipe(babel({
                presets: [
                    ['env', {
                        targets: {
                            browsers: ['last 2 versions', 'ie >= 11', '>5% in US']
                        }
                    }]
                ],
                plugins: ['iife-wrap']
            }))
            .pipe(rename(compatOutput))
            .pipe(sourcemaps.write('.'))
            .pipe(loaderGenerator({
                polyfills: polyfillUrl,
                bundle: bundleOutputMin,
                compatBundle: compatOutputMin,
                output: loaderOutput
            }))
            .pipe(gulp.dest(outputDir));
    });

    gulp.task('wc:js:minify', ['wc:js:assemble'], function () {
        return gulp.src([path.join(outputDir, '*.js'), '!' + path.join(outputDir, '*.min.js')])

            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(babel({
                presets: ['babili']
            }))
            .pipe(rename({suffix: '.min'}))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('dist'));
    });

    gulp.task('wc:js', ['wc:js:assemble', 'wc:js:minify']);

    return 'wc:js'
}

function initCss(gulp, cssConfig, componentName, outputDir) {
    const sass = require('gulp-sass');
    const cssmin = require('gulp-cssmin');

    let cssOutput = cssConfig.output || componentName + '.css';
    let cssOutputMin = minFile(cssOutput);

    gulp.task('wc:css', function () {
        return gulp.src(cssConfig.input)
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sass().on('error', sass.logError))
            .pipe(rename(cssOutput))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(outputDir))
            .pipe(cssmin())
            .pipe(rename(cssOutputMin))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(outputDir));
    });

    return 'wc:css';
}

function minFile(file) {
    let parts = path.parse(file);
    parts.name = parts.name + '.min';
    delete parts.base;
    return path.format(parts);
}

