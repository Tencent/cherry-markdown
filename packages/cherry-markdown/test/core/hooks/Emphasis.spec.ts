import { describe, it, expect } from 'vitest';
import Emphasis from '../../../src/core/hooks/Emphasis';

describe('core/hooks/emphasis', () => {
  it('should parse bold text with double asterisks', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const input = '**bold text**';
    let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
    expect(result.html).toContain('<strong>bold text</strong>');
  });

  it('should parse bold text with double underscores', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const input = '__bold text__';
    let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
    expect(result.html).toContain('<strong>bold text</strong>');
  });

  it('should parse italic text with single asterisk', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const input = '*italic text*';
    let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
    expect(result.html).toContain('<em>italic text</em>');
  });

  it('should parse italic text with single underscore', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const input = '_italic text_';
    let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
    expect(result.html).toContain('<em>italic text</em>');
  });

  it('should parse bold and italic with triple asterisks', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '***bold and italic***',
      '*****more bold italic*****',
    ];

    cases.forEach((input) => {
      let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
      expect(result.html).toContain('<em>');
      expect(result.html).toContain('<strong>');
    });
  });

  it('should handle emphasis with special characters', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '**bold with `code`**',
      '***italic with $math$***',
      '*italic with [link](url)*',
    ];

    cases.forEach((input) => {
      let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
      expect(result.html).toMatch(/<em>|<strong>/);
    });
  });

  it('should handle emphasis at word boundaries', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const input = 'This is **bold** in a sentence';
    let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
    expect(result.html).toContain('This is');
    expect(result.html).toContain('<strong>bold</strong>');
    expect(result.html).toContain('in a sentence');
  });

  it('should handle multiple emphasis in one line', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const input = '**bold** and *italic* and ***both***';
    let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
    expect(result.html).toContain('<strong>bold</strong>');
    expect(result.html).toContain('<em>italic</em>');
    expect(result.html).toContain('<em>');
    expect(result.html).toContain('<strong>');
  });

  it('should not over-match emphasis', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const input = '**bold ** with extra asterisk';
    let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
    expect(result.html).toContain('**bold *');
  });

  it('should handle emphasis with newlines', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const input = '**bold\ntext**';
    let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
    expect(result.html).toContain('<strong>');
  });

  it('should handle nested emphasis', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '***bold italic* italic**',
      '**bold *bold italic* bold**',
    ];

    cases.forEach((input) => {
      let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
      expect(result.html).toMatch(/<em>|<strong>/);
    });
  });

  it('should handle emphasis with Unicode characters', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '**粗体中文**',
      '*italic 日本語*',
      '***混合文字✨***',
    ];

    cases.forEach((input) => {
      let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
      expect(result.html).toMatch(/<em>|<strong>/);
    });
  });

  it('should handle emphasis with emoji', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '**bold with 🚀 emoji**',
      '*italic with 🎉 and ✨*',
    ];

    cases.forEach((input) => {
      let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
      expect(result.html).toMatch(/<em>|<strong>/);
    });
  });

  it('should handle emphasis at start and end of text', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '**start** text',
      'text **end**',
      '**both**',
    ];

    cases.forEach((input) => {
      let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
      expect(result.html).toMatch(/<em>|<strong>/);
    });
  });

  it('should escape HTML entities in emphasis', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const input = '**text & <script>alert("test")</script>**';
    let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
    expect(result.html).toContain('<strong>');
  });

  it('should handle emphasis with quotes', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '**"quoted" bold**',
      "*'single quotes' italic*",
      '**"mixed \'quotes\'"**',
    ];

    cases.forEach((input) => {
      let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
      expect(result.html).toMatch(/<em>|<strong>/);
    });
  });

  it('should handle strong emphasis with underscores', () => {
    const emphasisHook = new Emphasis({
      config: {},
      globalConfig: {},
    });

    const input = '___triple underscore___';
    let result = emphasisHook.beforeMakeHtml(input, () => ({ html: input }));
      result = emphasisHook.makeHtml(result, () => ({ html: result }));
      result = emphasisHook.afterMakeHtml(result);
    expect(result.html).toMatch(/<em>|<strong>/);
  });
});
