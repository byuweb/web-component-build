# web-component-build

[![NPM version][npm-image]][npm-url]

Build toolchain for BYU Web Components.

This tool will generate module bundles for a set of web component javascript files
using rollup, resolving any imported modules.

# Installation

```
npm install --save-dev byu-web-component-build
```

# Usage
```
npx byu-web-component-build
```

# Command-line Arguments

Argument | Short Option | Long Option | Description
-|-|-|-
Config File Location | -c *path to config file* | --config-file *path to config file* | The path to the config file. Defaults to `project root directory/byu-web-component-build.config.js`
Watch | -w | --watch | Set this flag to watch for changes to the source files. Defaults to false.

## Configuration

By default, all .js files in the `components` directory will be bundled and
output to the `dist` directory with `-bundle` added to the file name. These defaults
can be changed by including a file named `byu-web-component-build.config.js` in
your project root.

If you provide a componentLocation in the config file, another script will be generated
which will load the web component polyfills before loading your components.

### Example configuration file

```javascript
module.exports = {
    sourceDir: 'src/web-components',
    destDir: 'www/components',
    componentLocation: 'https://cdn.example.com/components/latest'
}
```

# Configuration File Options

Name | required | default | description
-----|----------|---------|------------
sourceDir | N | 'components' | Directory with files to bundle
destDir | N | 'dist' | Directory in which to output files

[npm-url]: https://www.npmjs.com/package/byu-web-component-build
[npm-image]: https://img.shields.io/npm/v/byu-web-component-build.svg
