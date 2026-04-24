1.2.1 / 2021-05-20
------------------

- Restored code coverage to 100%.
- Add floating point error tolerance in quad (1 root case) and cubic
  (2 root case) solvers.


1.2.0 / 2021-05-19
------------------

- Fixed wrong approximation for very small cubic curves: when diff between
  start and end of a cubic curve falls within `errorBound`, in earlier
  versions any quadratic curve was considered to be fitting.
  Error estimation algorithm is changed: previously it calculated distance
  from points on cubic curve to quadratic, now it also calculates the other
  way around. Distance calculation is changed from exact solution with
  cubic solver to linear segment approximations of both curves.


1.1.1 / 2017-05-08
------------------

- Fix sorting in `solveInflections`, #4.


1.1.0 / 2016-10-26
------------------

- Support curves with inflection point.


1.0.0 / 2015-10-27
------------------

- First release.
