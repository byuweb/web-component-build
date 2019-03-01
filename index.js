#!/usr/bin/env node
/*
 *  @license
 *    Copyright 2018 Brigham Young University
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
'use strict'

const appRootPath = require('app-root-path')
const path = require('path')
const fs = require('fs-extra')
const rollup = require('rollup')
const wcLoaderGenerator = require('byu-web-component-loader-generator')

console.log('__dirname =', __dirname)
console.log(`appRootPath=${appRootPath.toString()}`)

const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const minify = require('rollup-plugin-babel-minify')

const optionDefinitions = [
  { name: 'config-file',
    alias: 'c',
    type: String,
    typeLabel: '<file>',
    description: 'Config file name',
    defaultValue: path.resolve(appRootPath.toString(), 'byu-web-component-build.config.js')
  },
  {
    name: 'watch',
    alias: 'w',
    type: Boolean,
    description: 'Rebuild each time a source file is changed',
    defaultValue: false
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Display this usage guide.'
  }
]

const commandLineArgs = require('command-line-args')
const options = commandLineArgs(optionDefinitions, { camelCase: true })

if (options.help) {
  const commandLineUsage = require('command-line-usage')
  const usage = commandLineUsage([
    {
      header: 'BYU Web Component Build',
      content: 'Bundles dependencies of an es6 module into a single file.'
    },
    {
      header: 'Options',
      optionList: optionDefinitions
    },
    {
      content: 'Project home: {underline https://www.npmjs.com/package/@byuweb/byu-web-component-build}'
    }
  ])
  console.log(usage)
  process.exit(0)
}

// TODO: Include license and minify plugins
const inputOptions = {
  plugins: [
    resolve({}),
    // non-CommonJS modules will be ignored, but you can also
    // specifically include/exclude files
    commonjs({
      include: 'node_modules/**' // Default: undefined
    })
  ]
}
const minifyInputOptions = {
  plugins: [
    resolve({}),
    // non-CommonJS modules will be ignored, but you can also
    // specifically include/exclude files
    commonjs({
      include: 'node_modules/**' // Default: undefined
    }),
    minify({})
  ]
}
const outputOptions = {
  format: 'es'
}

const reportError = err => {
  console.error('Error in build process:')
  console.error(err)
}

async function buildComponent (f, filenameAppend, destDir, inputOptions, componentLocation) {
  try {
    const { name, ext } = path.parse(f)
    const fullInputOptions = Object.assign({}, { input: f }, inputOptions)
    const bundle = await rollup.rollup(fullInputOptions)
    const destFilename = path.resolve(appRootPath.toString(), destDir, name + filenameAppend + ext)
    const fullOutputOptions = Object.assign({}, { file: destFilename }, outputOptions)
    await bundle.write(fullOutputOptions)
    const withPolyfills = wcLoaderGenerator({
      polyfills: 'https://cdn.byu.edu/web-component-polyfills/latest/polyfills.min.js',
      bundle: componentLocation + '/' + name + filenameAppend + ext
    })
    if (componentLocation) {
      const polyFilename = path.resolve(appRootPath.toString(), destDir, name + '-polyfilled' + ext)
      await fs.outputFile(polyFilename, withPolyfills)
    }
  } catch (err) {
    reportError(err)
  }
}

async function buildComponents ({ sourceDir = 'components', destDir = 'dist', componentLocation }) {
  console.log(`Building Components in ${sourceDir}...`)

  // get all .js files in sorceDir
  const fileContents = await fs.readdir(path.resolve(appRootPath.toString(), sourceDir))
  const sourceFiles = fileContents
    .filter(f => path.extname(f) === '.js')
    .map(f => path.resolve(appRootPath.toString(), sourceDir, f))
    .filter(async f => {
      try {
        const stats = await fs.stat(f)
        return stats.isFile()
      } catch (err) {
        reportError(err)
        return false
      }
    })

  // call rollup on each of them
  const rollupPromises = sourceFiles.map((f, i) => {
    console.log(`Building (${i + 1} of ${sourceFiles.length}) ${f}...`)
    return buildComponent(f, '-bundle', destDir, inputOptions, componentLocation)
  })
  const minifiedPromises = sourceFiles.map((f, i) => {
    console.log(`Minifying (${i + 1} of ${sourceFiles.length}) ${f}...`)
    return buildComponent(f, '-bundle.min', destDir, minifyInputOptions, componentLocation)
  })

  try {
    return Promise.all(rollupPromises.concat(minifiedPromises))
      .then(() => {
        console.log('Build Finished!')
      })
  } catch (err) {
    reportError(err)
    process.exit(1)
  }

  // TODO make an optional es5 bundle as well
}

let config = {
  sourceDir: 'components',
  destDir: 'dist'
}
try {
  const configFromFile = require(options.configFile)
  Object.assign(config, configFromFile)
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') {
    throw err
  }
}

if (options.watch) {
  console.log('Watch!')
  var chokidar = require('chokidar')
  const { sourceDir, destDir, componentLocation } = config
  const rebuild = async (f) => {
    console.log(`Watch: ${f} changed`)
    if (!path.extname(f) === '.js') {
      return
    }
    try {
      await buildComponent(f, '-bundle', destDir, inputOptions, componentLocation)
      await buildComponent(f, '-bundle.min', destDir, minifyInputOptions, componentLocation)
      console.log(`rebuilt ${f}`)
    } catch (err) {
      reportError(err)
    }
  }
  chokidar.watch(sourceDir)
    .on('add', rebuild)
    .on('change', rebuild)
    .on('unlink', rebuild)
} else {
  buildComponents(config)
    .then(() => console.log('done'))
    .catch(err => reportError(err))
}
