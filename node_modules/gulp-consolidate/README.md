# [gulp][gulp-url]-consolidate [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

> Template engine consolidation for [gulp][gulp-url] using [consolidate.js][consolidate-url].

## Usage

First, install `gulp-consolidate` as a development dependency:

```shell
npm install --save-dev gulp-consolidate
```

Then, add it to your `gulpfile.js`:

```javascript
var consolidate = require("gulp-consolidate");

gulp.src("./src/*.html", { read : false})
	.pipe(consolidate("swig", {
		msg: "Hello Gulp!"
	}))
	.pipe(gulp.dest("./dist"));
```

## API

### consolidate(engine, data[, options])

#### engine
Type: `String`

The [consolidate.js][consolidate-url] supported template engine used to render each file.


```js
consolidate('swig');
```

_Note:_ The template engine must also be installed via npm.

```shell
npm install --save-dev swig
```

#### data
Type: `Object|Function`

The data to use to render the templates.

```js
consolidate('swig', {
	msg: "Hello World"
});
```

If this argument is a function, it will be called with the file as the only argument to get the template data.

```js
consolidate('swig', function (file) {
	return {
		BASE_URL : path.relative(file.path, pathToBase)
	};
});
```


#### options
Type: `Object`

Additional options.


#### options.useContents
Type: `Boolean`
Default: `false`

```js
consolidate('swig', data, { useContents : true });
```

Most times, you will want to render templates that include other files. In order to do so, the filenames will be passed to consolidate rather than the file contents.

If you would rather pass the file contents to consolidate, set the `useContents` option to true.

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[consolidate-url]: https://github.com/visionmedia/consolidate.js
[gulp-url]: https://github.com/gulpjs/gulp

[npm-url]: https://npmjs.org/package/gulp-consolidate
[npm-image]: https://badge.fury.io/js/gulp-consolidate.png

[travis-url]: http://travis-ci.org/timrwood/gulp-consolidate
[travis-image]: https://secure.travis-ci.org/timrwood/gulp-consolidate.png?branch=master

[depstat-url]: https://david-dm.org/timrwood/gulp-consolidate
[depstat-image]: https://david-dm.org/timrwood/gulp-consolidate.png
