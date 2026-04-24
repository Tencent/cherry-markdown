# gulp-ttf2woff2
> Create a WOFF2 font from a TTF font with [Gulp](http://gulpjs.com/).

[![NPM version](https://badge.fury.io/js/gulp-ttf2woff2.svg)](https://npmjs.org/package/gulp-ttf2woff2) [![Run test](https://github.com/nfroidure/gulp-ttf2woff2/workflows/Run%20tests/badge.svg)](https://github.com/nfroidure/gulp-ttf2woff2/actions) [![Dependency Status](https://david-dm.org/nfroidure/gulp-ttf2woff2.svg)](https://david-dm.org/nfroidure/gulp-ttf2woff2) [![devDependency Status](https://david-dm.org/nfroidure/gulp-ttf2woff2/dev-status.svg)](https://david-dm.org/nfroidure/gulp-ttf2woff2#info=devDependencies) [![Coverage Status](https://coveralls.io/repos/nfroidure/gulp-ttf2woff2/badge.svg?branch=master)](https://coveralls.io/r/nfroidure/gulp-ttf2woff2?branch=master) [![Code Climate](https://codeclimate.com/github/nfroidure/gulp-ttf2woff2.svg)](https://codeclimate.com/github/nfroidure/gulp-ttf2woff2)

## Usage

First, install `gulp-ttf2woff2` as a development dependency:

```shell
npm install --save-dev gulp-ttf2woff2
```

Then, add it to your `gulpfile.js`:

```javascript
var ttf2woff2 = require('gulp-ttf2woff2');

gulp.task('ttf2woff2', function(){
  gulp.src(['fonts/*.ttf'])
    .pipe(ttf2woff2())
    .pipe(gulp.dest('fonts/'));
});
```

## API

### ttf2woff(options)

#### options.ignoreExt
Type: `Boolean`
Default value: `false`

Set to true to also convert files that doesn't have the .ttf extension.

#### options.clone
Type: `Boolean`
Default value: `false`

Set to true to clone the file before converting him so that it will output the
 original file too.

### Note

You may look after a full Gulp web font workflow, see
 [gulp-iconfont](https://github.com/nfroidure/gulp-iconfont)
  fot that matter.

## Stats

[![NPM](https://nodei.co/npm/gulp-ttf2woff2.png?downloads=true&stars=true)](https://nodei.co/npm/gulp-ttf2woff2/)
[![NPM](https://nodei.co/npm-dl/gulp-ttf2woff2.png)](https://nodei.co/npm/gulp-ttf2woff2/)

### Contributing / Issues

Please submit TTF to WOFF2 related issues to the
 [ttf2woff2 project](https://github.com/nfroidure/ttf2woff2)
 on wich gulp-ttf2woff2 is built.

This repository issues is only for gulp and gulp tasks related issues.

You may want to contribute to this project, pull requests are welcome if you
 accept to publish under the MIT licence.
