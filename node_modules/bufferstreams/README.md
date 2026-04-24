# BufferStreams

[![NPM version](https://img.shields.io/npm/v/bufferstreams.svg)](https://www.npmjs.com/package/bufferstreams)
[![Build Status](https://travis-ci.org/nfroidure/BufferStreams.svg?branch=master)](https://travis-ci.org/nfroidure/BufferStreams)
[![Dependency Status](https://david-dm.org/nfroidure/bufferstreams.svg)](https://david-dm.org/nfroidure/bufferstreams)
[![devDependency Status](https://david-dm.org/nfroidure/bufferstreams/dev-status.svg)](https://david-dm.org/nfroidure/bufferstreams#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/nfroidure/BufferStreams/badge.svg?branch=master)](https://coveralls.io/r/nfroidure/BufferStreams?branch=master)
[![Code Climate](https://codeclimate.com/github/nfroidure/BufferStreams/badges/gpa.svg)](https://codeclimate.com/github/nfroidure/BufferStreams)

`bufferstreams` abstracts streams to allow you to deal with their whole content
 in a single buffer when it becomes necessary (by example: a legacy library that
 do not support streams).

It is not a good practice, just some glue. Using `bufferstreams` means:
* there is no library dealing with streams for your needs
* you filled an issue to the wrapped library to support streams

`bufferstreams` can also be used to control the whole stream content in a single
 point of a streaming pipeline for testing purposes.

## Usage
Install the [npm module](https://npmjs.org/package/bufferstreams):
```sh
npm install bufferstreams --save
```
Then, in your scripts:
```js
var fs = require('fs');
var bufferstreams = require('bufferstreams');

fs.createReadStream('input.txt')
  .pipe(new bufferstreams(function(err, buf, cb) {

    // err will be filled with an error if the piped in stream emits one.
    if(err) {
      throw err;
    }

    // buf will contain the whole piped in stream contents
    buf = Buffer(buf.toString('utf-8').replace('foo', 'bar'));

    // cb is a callback to pass the result back to the piped out stream
    // first argument is an error that will be emitted if any
    // the second argument is the modified buffer
    cb(null, buf);

  }))
  .pipe(fs.createWriteStream('output.txt'));
```

Note that you can use `bufferstreams` with the objectMode option. In this case,
 the given buffer will be an array containing the streamed objects:
```js
new BufferStreams({objectMode: true}, myCallback);
```

## API

### Stream : BufferStreams([options], callback)

#### options

##### options.objectMode
Type: `Boolean`
Default value: `false`

Use if piped in streams are in object mode. In this case, an array of the
 buffered will be transmitted to the `callback` function.

##### options.*

`bufferstreams` inherits of Stream.Duplex, the options are passed to the
 parent constructor so you can use it's options too.

##### callback(err, buf, cb)
Type: `Function`, required.

A function to handle the buffered content.

## Stats

[![NPM](https://nodei.co/npm/bufferstreams.png?downloads=true&stars=true)](https://nodei.co/npm/bufferstreams/)
[![NPM](https://nodei.co/npm-dl/bufferstreams.png)](https://nodei.co/npm/bufferstreams/)

## Contributing
Feel free to pull your code if you agree with publishing it under the MIT license.
