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
console.log(__dirname)
console.log(appRootPath)
const path = require('path')
const fs = require('fs-extra')
const rollup = require('rollup')

const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const inputOptions = {
  plugins: [
    resolve({}),
    commonjs({
      // non-CommonJS modules will be ignored, but you can also
      // specifically include/exclude files
      include: 'node_modules/**' // Default: undefined
    })
  ]

}
const outputOptions = {
  format: 'es'
}

const reportError = err => {
  console.error('Error in build process:')
  console.error(err)
}

async function buildComponents ({sourceDir = 'components', destDir = 'dist'}) {
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
  const rollupPromises = sourceFiles.map(async (f, i) => {
    try {
      const {name, ext} = path.parse(f)
      console.log(`Building (${i+1} of ${sourceFiles.length}) ${f}...`)
      const fullInputOptions = Object.assign({}, {input: f}, inputOptions)
      const bundle = await rollup.rollup(fullInputOptions)
      const destFilename = path.resolve(appRootPath.toString(), destDir, name + '-bundle' + ext)
      const fullOutputOptions = Object.assign({}, {file: destFilename}, outputOptions)
      return bundle.write(fullOutputOptions)
    } catch (err) {
      reportError(err)
    }
  })

  try {
    await rollupPromises
  } catch (err) {
    reportError(err)
  }

  console.log('Build Finished!')

  // TODO make an optional es5 bundle as well
}

let config = {}
try {
  const configFromFile = require(path.resolve(appRootPath.toString(), 'byu-web-component-build.config.js'))
  Object.assign(config, configFromFile)
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') {
    throw err
  }
}

buildComponents(config)
.then(() => console.log('done'))
.catch(err => reportError(err))
