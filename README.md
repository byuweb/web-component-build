# web-component-build

Build toolchain for BYU Web Components.

This toolchain bundles together components into a single js file
using webpack, transpiles to ES5, minfies, and generates a file that
loads the appropriate bundle and polyfills.

Currently, gulp is the only build tool supported.

# Installation

```
npm install --save-dev byu-web-component-build
```

# Usage

## Gulp.js

Once initialized, the build will add a `wc:build` task to gulp, which
will invoke a series of smaller tasks to build the components.

Example Gulpfile:

```
const initWcBuild = require('byu-web-component-build').gulp;

initWcBuild(gulp, {
    componentName: 'my-component-name',
    js: {
        input: './my-component/script.js'
    },
    css: {
        input: './css/site.scss'
    }
});

gulp.task('build', ['wc:build']);

```

# Options

Name | required | default | description
-----|----------|---------|------------
componentName | Y | | The name of the component.
outputDirectory | N | 'dist' | Directory in which to output files
js | Y | | Javascript options
js.input | Y | | Javascript input file
js.output | N | |
js.output.loader | N | `componentName + '.js'` | Loader file output
js.output.bundle | N | `'components.js'` | Main bundle file
js.output.compatBundle | N | `'components-compat.js'` | Backwards-compatibile (ES5) bundle file
webpackConfig | N | Default Config | Overrides the webpack configuration

