# neatequal

`neatequal` is a neater deepEqual.

[![NPM version](https://badge.fury.io/js/neatequal.png)](https://npmjs.org/package/neatequal) [![Build status](https://secure.travis-ci.org/nfroidure/neatequal.png)](https://travis-ci.org/nfroidure/neatequal) [![Dependency Status](https://david-dm.org/nfroidure/neatequal.png)](https://david-dm.org/nfroidure/neatequal) [![devDependency Status](https://david-dm.org/nfroidure/neatequal/dev-status.png)](https://david-dm.org/nfroidure/neatequal#info=devDependencies) [![Coverage Status](https://coveralls.io/repos/nfroidure/neatequal/badge.png?branch=master)](https://coveralls.io/r/nfroidure/neatequal?branch=master) [![Code Climate](https://codeclimate.com/github/nfroidure/neatequal.png)](https://codeclimate.com/github/nfroidure/neatequal)

![neatEqual capture](https://pbs.twimg.com/media/BdkpqTjCEAAOipY.png:large)

## Installation

First install `neatequal` in you project:
```sh
npm install --save neatequal
```

## Getting started

Then, use it:

```js
var neatequal = require('neatequal');

var expectedFruits = [{
  name: 'orange'
  count: 2,
  colors: ['orange']
}, {
	name: 'banana',
  count: 0,
  colors: ['yellow', 'white']
}, {
	name: 'kiwi',
  count: 8,
  colors: ['brown', 'green']
}];

var currentFruits = [{
  name: 'orange'
  count: 2,
  colors: ['yellow', 'orange']
}, {
	name: 'banana',
  count: 1,
  colors: ['white']
}];

neatequal(expectedFruits, currentFruits);
```


## API

### neatequal(current:Object, expected:Object)
Throws an exception if current and expected objects doens'nt equal.

## Contribute

Feel free to submit us your improvements. To do so, you must accept to publish
 your code under the MIT license.

To start contributing, first run the following to setup the development
 environment:
```sh
git clone git@github.com:nfroidure/neatequal.git
cd neatequal
npm install
```

Then, run the tests:
```sh
npm test
```

## Stats
[![NPM](https://nodei.co/npm/neatequal.png?downloads=true&stars=true)](https://nodei.co/npm/neatequal/)
[![NPM](https://nodei.co/npm-dl/neatequal.png)](https://nodei.co/npm/neatequal/)

