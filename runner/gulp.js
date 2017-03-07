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
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const webpackStream = require('webpack-stream');
const babel = require('gulp-babel');
const through = require('through2');
const loaderGenerator = require('byu-web-component-loader-generator').stream;

/**
 * @typedef {{}} Options
 * @property {string} componentName
 * @property {string} [outputDirectory]
 * @property {{input: string, output: {loader: string, bundle: string, compatBundle: string}}} js
 * @property {{input: string, output: string}} [css]
 * @property {string} webpackContext
 * @property {{}} webpackConfig
 */

/**
 *
 * @param gulp
 * @param {Options} opts
 */
module.exports = function initGulp(gulp, opts) {
    if (!opts) throw new Error('`opts` must be specified');
    let {componentName, js, css, webpackContext} = opts;

    let outputDir;
    if (opts.outputDirectory && path.isAbsolute(opts.outputDirectory)) {
        outputDir = opts.outputDirectory;
    } else {
        outputDir = path.join(process.cwd(), opts.outputDirectory || 'dist');
    }

    let jsOutput = js.output || {};
    let bundleOutput = jsOutput.bundle || 'components.js';
    let compatOutput = jsOutput.compatBundle || path.basename(bundleOutput, '.js') + '-compat.js';

    let bundleOutputMin = minFile(bundleOutput);
    let compatOutputMin = minFile(compatOutput);

    let loaderOutput = jsOutput.loader || componentName + '.js';

    const webpack = require('webpack');

    gulp.task('wc:build', ['wc:assemble', 'wc:minify']);

    gulp.task('wc:assemble', function () {
        let wpConfig = opts.webpackConfig || require('../default-webpack.config')(js.input, bundleOutput);
        if (webpackContext) wpConfig.context = webpackContext;
        return gulp.src(js.input)
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
                polyfills: 'https://cdn.byu.edu/web-component-polyfills/latest/polyfills.min.js',
                bundle: bundleOutputMin,
                compatBundle: compatOutputMin,
                output: loaderOutput
            }))
            .pipe(gulp.dest(outputDir));
    });

    gulp.task('wc:minify', ['wc:assemble'], function () {
        return gulp.src([path.join(outputDir, '*.js'), '!' + path.join(outputDir, '*.min.js')])

            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(babel({
                presets: ['babili']
            }))
            .pipe(rename({suffix: '.min'}))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('dist'));
    });

    function minFile(file) {
        let parts = path.parse(file);
        parts.name = parts.name + '.min';
        delete parts.base;
        return path.format(parts);
    }
};

