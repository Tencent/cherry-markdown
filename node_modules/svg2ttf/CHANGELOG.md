4.3.0 / 2019-05-24
------------------

- Add underline thickness/position support, #80.


4.2.1 / 2019-05-23
------------------

- Fix "new Bufer" deprecation warnings, #78.


4.2.0 / 2018-12-10
------------------

- Added `description` and `url` options, #74


4.1.0 / 2017-06-24
------------------

- Added font subfamily name support, #57.


4.0.3 / 2017-05-27
------------------

- Script tags should be arranged alpabetically, #55.


4.0.2 / 2016-08-04
------------------

- Added option to customize version string.


4.0.1 / 2016-06-03
------------------

- Fix IE ligatures by explicitly adding the latin script to the script list, #47.


4.0.0 / 2016-03-08
------------------

- Deps update (lodash -> 4.+).
- Set HHEA lineGap to 0, #37 (second attempt :).
- Cleanup, testing.


3.0.0 / 2016-02-12
------------------

- Changed defaults to workaround IE bugs.
- Set HHEA lineGap to 0, #37.
- Set OS/2 fsType to 0, #45.


2.1.1 / 2015-12-22
------------------

- Maintenance release: deps bump (svgpath with bugfixes).


2.1.0 / 2015-10-28
------------------

- Fixed smoothness at the ends of interpolated cubic beziers.


2.0.2 / 2015-08-23
------------------

- Fixed parse empty SVG glyphs without `d` attribute.


2.0.1 / 2015-07-17
------------------

- Fix: TTF creation timestamp should not depende on timezone, thanks to @nfroidure.


2.0.0 / 2015-04-25
------------------

- Added ligatures support, big thanks to @sabberworm.
- Added arcs support in SVG paths.
- Added `--ts` option to override default timestamp.
- Fixed horisontal offset (`lsb`) when glyph exceed width.
- Allow zero-width glyphs.
- Better error message on attempt to convert SVG image instead of SVG font.


1.2.0 / 2014-10-05
------------------

- Fixed usWinAscent/usWinDescent - should not go below ascent/descent.
- Upgraded ByteBuffer internal lib.
- Code cleanup.


1.1.2 / 2013-12-02
------------------

- Fixed crash on SVG with empty <metadata> (#8)
- Fixed descent when input font has descent = 0 (@nfroidure)


1.1.1 / 2013-09-26
------------------

- SVG parser moved to external package
- Speed opts
- Code refactoring/cleanup


1.1.0 / 2013-09-25
------------------

- Rewritten svg parser to improve speed
- API changed, now returns buffer as array/Uint8Array


1.0.7 / 2013-09-22
------------------

- Improved speed x2.5 times


1.0.6 / 2013-09-12
------------------

- Improved handling glyphs without codes or names
- Fixed crash on glyphs with `v`/`h` commands
- Logic cleanup


1.0.5 / 2013-08-27
------------------

- Added CLI option `-c` to set copyright string
- Fixed crash when some metrics missed in source SVG
- Minor code cleanup


1.0.4 / 2013-08-09
------------------

- Fixed importing into OSX Font Book


1.0.3 / 2013-08-02
------------------

- Fixed maxp table max points count (solved chrome problems under windozze)


1.0.2 / 2013-07-24
------------------

- Fixed htmx table size
- Fixed loca table size for long format
- Fixed glyph bounding boxes writing


1.0.1 / 2013-07-24
------------------

- Added options support
- Added `ttfinfo` utility
- Multiple fixes


1.0.0 / 2013-07-19
------------------

- First release

