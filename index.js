#!/usr/bin/env node
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
'use strict'

const path = require('path')
const fs = require('fs-extra')
const config = {}
/* require(path.resolve(projectRoot, 'web-component-build-config.js')) // TODO make config file in project root and it should be optional */
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

async function buildComponents ({sourceDir = 'components', destDir = 'dist'}) {
  console.log(`Building Components in ${sourceDir}...`)

  // get all .js files in sorceDir
  const fileContents = await fs.readdir(path.resolve(proccess.cwd(), sourceDir))
  const sourceFiles = fileContents
    .filter(f => path.parse(f).ext === 'js')
    .filter(async f => {
      const stats = await fs.stat(f)
      return stats.isFile()
    })

  // do rollup on them
  const rollupPromises = sourceFiles.map(async (f, i) => {
    const {name, ext} = path.parse(f)
    console.log(`Building (${i} of ${sourceFiles.length}) ${f}...`)
    const bundle = await rollup.rollup({input: f, ...inputOptions})
    return bundle.write({file: path.resolve(proccess.cwd(), destDir, name + '-bundle' + ext), ...outputOptions})
  })
  await rollupPromises

  console.log('Build Finished!')

  // TODO make an optional es5 bundle as well
}

buildComponents(config).then(() => console.log('done'))
