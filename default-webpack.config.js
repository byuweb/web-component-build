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

const path = require('path');

module.exports = function (input, output) {
    return {
        module: {
            rules: [
                {
                    test: /\.ejs\.html$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'ejs-compiled-loader',
                        options: {
                            htmlmin: true,
                            strict: true,
                            compileDebug: false,
                            rmWhitespace: true
                        }
                    }]
                },
                {
                    test: /\.html$/,
                    exclude: [/\.ejs\.html$/, /node_modules/],
                    use: [
                        {
                            loader: 'html-loader',
                            options: {
                                interpolate: true,
                                // minimize: true
                            },

                        },
                        {
                            loader: 'htmlmin-loader',
                            options: {
                                minifyCSS: false,
                                conservativeCollapse: true
                            }
                        }
                    ]
                },
                {
                    test: /\.scss$/,
                    use: [{
                        loader: "css-loader",
                        options: {
                            minimize: true
                        }
                    }, {
                        loader: "sass-loader"
                    }]
                },
                {
                    test: /\.(gif|png|jpe?g)$/i,
                    use: [
                        'url-loader',
                        {
                            loader: 'image-webpack-loader',
                            query: {
                                progressive: true,
                                optipng: {
                                    optimizationLevel: 7,
                                },
                                gifsicle: {
                                    interlaced: false,
                                },
                                pngquant: {
                                    quality: '65-90',
                                    speed: 4
                                }
                            }
                        }
                    ]
                },
                //Separate this out because svg-url-loader is much more efficient than the base64 encoding in url-loader
                {
                    test: /\.svg$/i,
                    loaders: [
                        {
                            loader: 'svg-url-loader',
                            options: {
                                noquotes: true
                            }
                        },
                        {
                            loader: 'image-webpack-loader',
                            query: {
                                progressive: true
                            }
                        }
                    ]
                }
            ]
        },
        entry: input,
        output: {
            filename: output,
            path: path.resolve(__dirname, 'dist')
        },
        devtool: 'source-map'
    }
};
