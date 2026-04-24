# gulp-ttf2woff
> Create a WOFF font from a TTF one with [Gulp](http://gulpjs.com/).

[![NPM version](https://badge.fury.io/js/gulp-ttf2woff.svg)](https://npmjs.org/package/gulp-ttf2woff) [![Build status](https://secure.travis-ci.org/nfroidure/gulp-ttf2woff.svg)](https://travis-ci.org/nfroidure/gulp-ttf2woff) [![Dependency Status](https://david-dm.org/nfroidure/gulp-ttf2woff.svg)](https://david-dm.org/nfroidure/gulp-ttf2woff) [![devDependency Status](https://david-dm.org/nfroidure/gulp-ttf2woff/dev-status.svg)](https://david-dm.org/nfroidure/gulp-ttf2woff#info=devDependencies) [![Coverage Status](https://coveralls.io/repos/nfroidure/gulp-ttf2woff/badge.svg?branch=master)](https://coveralls.io/r/nfroidure/gulp-ttf2woff?branch=master) [![Code Climate](https://codeclimate.com/github/nfroidure/gulp-ttf2woff.svg)](https://codeclimate.com/github/nfroidure/gulp-ttf2woff)

## Usage

First, install `gulp-ttf2woff` as a development dependency:

```shell
npm install --save-dev gulp-ttf2woff
```

Then, add it to your `gulpfile.js`:

```javascript
var ttf2woff = require('gulp-ttf2woff');

gulp.task('ttf2woff', function(){
  gulp.src(['fonts/*.ttf'])
    .pipe(ttf2woff())
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

[![NPM](https://nodei.co/npm/gulp-ttf2woff.png?downloads=true&stars=true)](https://nodei.co/npm/gulp-ttf2woff/)
[![NPM](https://nodei.co/npm-dl/gulp-ttf2woff.png)](https://nodei.co/npm/gulp-ttf2woff/)

### Contributing / Issues

Please submit TTF to WOFF related issues to the
 [ttf2woff project](https://github.com/fontello/ttf2woff)
 on wich gulp-ttf2woff is built.

This repository issues is only for gulp and gulp tasks related issues.

You may want to contribute to this project, pull requests are welcome if you
 accept to publish under the MIT licence.
