# dargs

> Reverse [`minimist`](https://github.com/substack/minimist). Convert an object of options into an array of command-line arguments.

Useful when spawning command-line tools.

## Install

```
$ npm install dargs
```

## Usage

```js
import dargs from 'dargs';

const object = {
	_: ['some', 'option'],          // Values in '_' will be appended to the end of the generated argument list
	'--': ['separated', 'option'],  // Values in '--' will be put at the very end of the argument list after the escape option (`--`)
	foo: 'bar',
	hello: true,                    // Results in only the key being used
	cake: false,                    // Prepends `no-` before the key
	camelCase: 5,                   // CamelCase is slugged to `camel-case`
	multiple: ['value', 'value2'],  // Converted to multiple arguments
	pieKind: 'cherry',
	sad: ':('
};

const excludes = ['sad', /.*Kind$/];  // Excludes and includes accept regular expressions
const includes = ['camelCase', 'multiple', 'sad', /^pie.*/];
const aliases = {file: 'f'};

console.log(dargs(object, {excludes}));
/*
[
	'--foo=bar',
	'--hello',
	'--no-cake',
	'--camel-case=5',
	'--multiple=value',
	'--multiple=value2',
	'some',
	'option',
	'--',
	'separated',
	'option'
]
*/

console.log(dargs(object, {excludes, includes}));
/*
[
	'--camel-case=5',
	'--multiple=value',
	'--multiple=value2'
]
*/


console.log(dargs(object, {includes}));
/*
[
	'--camel-case=5',
	'--multiple=value',
	'--multiple=value2',
	'--pie-kind=cherry',
	'--sad=:('
]
*/


console.log(dargs({
	foo: 'bar',
	hello: true,
	file: 'baz'
}, {aliases}));
/*
[
	'--foo=bar',
	'--hello',
	'-f', 'baz'
]
*/
```

## API

### dargs(object, options?)

#### object

Type: `object`

Object to convert to command-line arguments.

#### options

Type: `object`

##### excludes

Type: `Array<string | RegExp>`

Keys or regex of keys to exclude. Takes precedence over `includes`.

##### includes

Type: `Array<string | RegExp>`

Keys or regex of keys to include.

##### aliases

Type: `object`

Maps keys in `object` to an aliased name. Matching keys are converted to arguments with a single dash (`-`) in front of the aliased key and the value in a separate array item. Keys are still affected by `includes` and `excludes`.

##### useEquals

Type: `boolean`\
Default: `true`

Setting this to `false` makes it return the key and value as separate array items instead of using a `=` separator in one item. This can be useful for tools that doesn't support `--foo=bar` style flags.

```js
import dargs from 'dargs';

console.log(dargs({foo: 'bar'}, {useEquals: false}));
/*
[
	'--foo', 'bar'
]
*/
```

##### shortFlag

Type: `boolean`\
Default: `true`

Make a single character option key `{a: true}` become a short flag `-a` instead of `--a`.

```js
import dargs from 'dargs';

console.log(dargs({a: true}));
//=> ['-a']

console.log(dargs({a: true}, {shortFlag: false}));
//=> ['--a']
```

##### ignoreTrue

Type: `boolean`\
Default: `false`

Exclude `true` values. Can be useful when dealing with argument parsers that only expect negated arguments like `--no-foo`.

##### ignoreFalse

Type: `boolean`\
Default: `false`

Exclude `false` values. Can be useful when dealing with strict argument parsers that throw on unknown arguments like `--no-foo`.

##### allowCamelCase

Type: `boolean`\
Default: `false`

By default, camel-cased keys will be hyphenated. Enabling this will bypass the conversion process.

```js
import dargs from 'dargs';

console.log(dargs({fooBar: 'baz'}));
//=> ['--foo-bar', 'baz']

console.log(dargs({fooBar: 'baz'}, {allowCamelCase: true}));
//=> ['--fooBar', 'baz']
```

---

<div align="center">
	<b>
		<a href="https://tidelift.com/subscription/pkg/npm-dargs?utm_source=npm-dargs&utm_medium=referral&utm_campaign=readme">Get professional support for this package with a Tidelift subscription</a>
	</b>
	<br>
	<sub>
		Tidelift helps make open source sustainable for maintainers while giving companies<br>assurances about security, maintenance, and licensing for their dependencies.
	</sub>
</div>
