import { describe, expect, it } from 'vitest';
import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '../../src/utils/color';
import { calculateLinesOfParagraph, prependLineFeedForParagraph } from '../../src/utils/lineFeed';
import NestedError, { $expectInherit, $expectInstance, $expectTarget } from '../../src/utils/error';
import MyersDiff from '../../src/utils/myersDiff';

describe('utils/color', () => {
  it('converts valid hex colors to RGB components', () => {
    expect(hexToRgb('#0a1Bff')).toEqual({ r: 10, g: 27, b: 255 });
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns null for invalid hex colors', () => {
    expect(hexToRgb('#fff')).toBeNull();
    expect(hexToRgb('not-a-color')).toBeNull();
  });

  it('converts RGB values to lowercase hex colors', () => {
    expect(rgbToHex(10, 27, 255)).toBe('#0a1bff');
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('converts RGB values to HSV and back', () => {
    expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 1, v: 1 });
    expect(rgbToHsv(0, 255, 0)).toEqual({ h: 120, s: 1, v: 1 });
    expect(rgbToHsv(0, 0, 255)).toEqual({ h: 240, s: 1, v: 1 });
    expect(rgbToHsv(128, 128, 128)).toEqual({ h: 0, s: 0, v: 128 / 255 });

    expect(hsvToRgb(0, 1, 1)).toEqual({ r: 255, g: 0, b: 0 });
    expect(hsvToRgb(120, 1, 1)).toEqual({ r: 0, g: 255, b: 0 });
    expect(hsvToRgb(240, 1, 1)).toEqual({ r: 0, g: 0, b: 255 });
    expect(hsvToRgb(300, 1, 1)).toEqual({ r: 255, g: 0, b: 255 });
  });
});

describe('utils/lineFeed', () => {
  it('does not prepend line feeds when the original match has no leading newline', () => {
    expect(prependLineFeedForParagraph('paragraph', '<p>paragraph</p>')).toBe('<p>paragraph</p>');
  });

  it('prepends two line feeds for non-nested paragraphs', () => {
    expect(prependLineFeedForParagraph('\nparagraph', '<p>paragraph</p>')).toBe('\n\n<p>paragraph</p>');
  });

  it('preserves list nesting with one or two leading line feeds', () => {
    expect(prependLineFeedForParagraph('\nparagraph', '<p>paragraph</p>', true)).toBe('\n<p>paragraph</p>');
    expect(prependLineFeedForParagraph('\n\nparagraph', '<p>paragraph</p>', true)).toBe('\n\n<p>paragraph</p>');
  });

  it('calculates paragraph line counts after prepending line feeds', () => {
    expect(calculateLinesOfParagraph('', 2)).toBe(2);
    expect(calculateLinesOfParagraph('\n\n', 2)).toBe(2);
    expect(calculateLinesOfParagraph('\n\n\n\n', 2)).toBe(4);
  });
});

describe('utils/error', () => {
  it('validates primitive target types and arrays', () => {
    expect($expectTarget('text', String)).toBe(true);
    expect($expectTarget(1, Number)).toBe(true);
    expect($expectTarget([], Array)).toBe(true);
    expect(() => $expectTarget('text', Number)).toThrow(TypeError);
    expect(() => $expectTarget({}, Array)).toThrow(TypeError);
  });

  it('validates inheritance and instances', () => {
    class Parent {}
    class Child extends Parent {}

    expect($expectInherit(new Child(), Parent)).toBe(true);
    expect($expectInstance(new Child())).toBe(true);
    expect(() => $expectInherit({}, Parent)).toThrow('the hook does not correctly inherit');
    expect(() => $expectInstance(Child)).toThrow('the hook must be a instance, not a class');
  });

  it('includes nested stack traces in NestedError', () => {
    const cause = new Error('root cause');
    const error = new NestedError('wrapper', cause);

    expect(error.name).toBe('Error');
    expect(error.message).toBe('wrapper');
    expect(error.stack).toContain('Caused By:');
    expect(error.stack).toContain('root cause');
  });
});

describe('utils/myersDiff', () => {
  it('returns no operations for identical strings', () => {
    expect(new MyersDiff('abc', 'abc').doDiff()).toEqual([]);
  });

  it('detects insert, delete, and update operations for strings', () => {
    expect(new MyersDiff('axbc', 'abc').doDiff()).toEqual([{ type: 'insert', oldIndex: 1, newIndex: 1 }]);
    expect(new MyersDiff('abc', 'axbc').doDiff()).toEqual([{ type: 'delete', oldIndex: 1, newIndex: 0 }]);
    expect(new MyersDiff('axc', 'abc').doDiff()).toEqual([{ type: 'update', oldIndex: 1, newIndex: 1 }]);
  });

  it('uses a custom element getter for object arrays', () => {
    const oldObj = [{ id: 1 }, { id: 2 }];
    const newObj = [{ id: 1 }, { id: 3 }, { id: 2 }];
    const diff = new MyersDiff(newObj, oldObj, (items: Array<{ id: number }>, index: number) => items[index].id);

    expect(diff.getElement(newObj, 1)).toBe(3);
    expect(diff.doDiff()).toEqual([{ type: 'insert', oldIndex: 1, newIndex: 1 }]);
  });
});
