#!/bin/bash

mkdir -p tests/expected/hinted \
&& ./node_modules/svgicons2svgfont/bin/svgicons2svgfont.js -f iconsfont tests/fixtures/iconsfont/* > tests/expected/iconsfont.svg \
&& ./node_modules/svg2ttf/svg2ttf.js --ts 3 tests/expected/iconsfont.svg tests/expected/iconsfont.ttf \
&& ( \
	cat tests/expected/iconsfont.ttf \
	| ./tests/ttfautohint/ttfautohint.sh --symbol --fallback-script=latn --windows-compatibility --no-info \
	> tests/expected/hinted/iconsfont.ttf\
) \
&& ./node_modules/ttf2eot/ttf2eot.js tests/expected/iconsfont.ttf tests/expected/iconsfont.eot \
&& ./node_modules/ttf2woff/ttf2woff.js tests/expected/iconsfont.ttf tests/expected/iconsfont.woff \
&& (cat tests/expected/iconsfont.ttf | node ./node_modules/ttf2woff2/bin/ttf2woff2.js > tests/expected/iconsfont.woff2)