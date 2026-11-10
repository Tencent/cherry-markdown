import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import {
  getImageCaptionText,
  handleDropType,
  handleFileUploadCallback,
  handleParams,
  handleUpload,
  handleUploadMulti,
  resolveImageName,
  stripFileExtension,
} from '../../src/utils/file';

interface UploadParams {
  name?: string;
  poster?: string;
  isBorder?: boolean;
  isShadow?: boolean;
  isRadius?: boolean;
  width?: string;
  height?: string;
  before?: string;
  after?: string;
}

type UploadCallback = (url: string, params?: UploadParams) => void;
type MultiUploadItem = { url: string; params?: UploadParams; file?: File };
type MultiUploadCallback = (items: MultiUploadItem[]) => void;

interface UploadEditor {
  $cherry: {
    options: {
      multipleFileSelection?: boolean;
      imageCaption?: boolean | string | ((imageName: string, url: string) => string);
      callback: {
        fileUpload: (file: File, callback: UploadCallback) => void;
        fileUploadMulti: (files: File[], callback: MultiUploadCallback) => void;
      };
    };
  };
  editor: {
    replaceSelection: (value: string) => void;
  };
}

let latestInput: HTMLInputElement | undefined;

function createEditor(
  fileUpload: UploadEditor['$cherry']['options']['callback']['fileUpload'],
  fileUploadMulti: UploadEditor['$cherry']['options']['callback']['fileUploadMulti'],
  multipleFileSelection = false,
) {
  const replaceSelection = vi.fn();
  const editor: UploadEditor = {
    $cherry: {
      options: {
        multipleFileSelection,
        callback: { fileUpload, fileUploadMulti },
      },
    },
    editor: { replaceSelection },
  };
  return { editor, replaceSelection };
}

function dispatchFile(file: File | File[]) {
  if (!latestInput) {
    throw new Error('The upload input was not created');
  }
  Object.defineProperty(latestInput, 'files', { configurable: true, value: Array.isArray(file) ? file : [file] });
  latestInput.dispatchEvent(new Event('change'));
}

function captureInput() {
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
    const element = originalCreateElement(tagName, options);
    if (tagName.toLowerCase() === 'input') {
      latestInput = element as HTMLInputElement;
    }
    return element;
  });
}

describe('utils/file', () => {
  afterEach(() => {
    latestInput = undefined;
    vi.restoreAllMocks();
  });

  it('serializes image style parameters in source order', () => {
    expect(handleParams(undefined)).toBe('');
    expect(handleParams({ isBorder: true, isShadow: true, isRadius: true })).toBe('#B #S #R');
    expect(handleParams({ width: '60%', height: 'auto' })).toBe('#60% #auto');
    expect(handleParams({ height: '200px' })).toBe('#auto #200px');
  });

  it('creates image and link syntax for dropped files', () => {
    expect(handleDropType(new File(['x'], 'photo.png', { type: 'image/png' }), '/photo')).toBe('![photo.png](/photo)');
    expect(handleDropType(new File(['x'], 'notes.txt', { type: 'text/plain' }), '/notes')).toBe('[notes.txt](/notes)');
  });

  it('creates upload syntax with type-specific poster and style metadata', () => {
    const image = new File(['x'], 'photo.png', { type: 'image/png' });
    const video = new File(['x'], 'clip.mp4', { type: 'video/mp4' });
    const audio = new File(['x'], 'sound.mp3', { type: 'audio/mpeg' });
    const text = new File(['x'], 'notes.txt', { type: 'text/plain' });

    expect(handleFileUploadCallback('/photo', { name: 'alt', isShadow: true }, image)).toBe('![alt#S](/photo)');
    expect(handleFileUploadCallback('/clip', { poster: '/poster' }, video)).toBe(
      '!video[clip.mp4](/clip){poster=/poster}',
    );
    expect(handleFileUploadCallback('/sound', {}, audio)).toBe('!audio[sound.mp3](/sound)');
    expect(handleFileUploadCallback('/notes', { before: '(', after: ')' }, text)).toBe('([notes.txt](/notes))');
  });

  it('passes single-file upload results to custom callbacks', () => {
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    const fileUpload = vi.fn((selected: File, callback: UploadCallback) => {
      callback('/photo', { name: selected.name.replace('.png', ''), width: '50%' });
    });
    const fileUploadMulti = vi.fn<UploadEditor['$cherry']['options']['callback']['fileUploadMulti']>();
    const { editor } = createEditor(fileUpload, fileUploadMulti);
    const result = vi.fn();
    captureInput();

    handleUpload(editor, 'image', 'image/*', (name, url, params) => {
      result(name, url, params);
    });
    dispatchFile(file);

    expect(fileUpload).toHaveBeenCalledWith(file, expect.any(Function));
    expect(result).toHaveBeenCalledWith('photo.png', '/photo', { name: 'photo', width: '50%' });
  });

  it('uses default single-file Markdown replacement for all media types', () => {
    const fileUploadMulti = vi.fn<UploadEditor['$cherry']['options']['callback']['fileUploadMulti']>();
    const cases = [
      ['image', 'photo.png', 'image/png', '![photo.png](/uploaded)'],
      ['video', 'clip.mp4', 'video/mp4', '!video[clip.mp4](/uploaded)'],
      ['audio', 'sound.mp3', 'audio/mpeg', '!audio[sound.mp3](/uploaded)'],
      ['pdf', 'doc.pdf', 'application/pdf', '[doc.pdf](/uploaded)'],
    ] as const;

    for (const [type, name, mime, expected] of cases) {
      const fileUpload = vi.fn((_file: File, callback: UploadCallback) => callback('/uploaded'));
      const { editor, replaceSelection } = createEditor(fileUpload, fileUploadMulti);
      captureInput();
      handleUpload(editor, type, '*');
      dispatchFile(new File(['x'], name, { type: mime }));
      expect(replaceSelection).toHaveBeenLastCalledWith(expected);
      vi.restoreAllMocks();
      latestInput = undefined;
    }
  });

  it('passes multi-file results to custom callbacks and preserves input attributes', () => {
    const files = [
      new File(['x'], 'one.png', { type: 'image/png' }),
      new File(['x'], 'two.png', { type: 'image/png' }),
    ];
    const fileUpload = vi.fn<UploadEditor['$cherry']['options']['callback']['fileUpload']>();
    const items = files.map((file) => ({ url: `/${file.name}`, file }));
    const fileUploadMulti = vi.fn((_selected: File[], callback: MultiUploadCallback) => callback(items));
    const { editor } = createEditor(fileUpload, fileUploadMulti, true);
    const result = vi.fn();
    captureInput();

    handleUploadMulti(editor, 'image', 'image/*', result);
    expect(latestInput?.accept).toBe('image/*');
    expect(latestInput?.multiple).toBe(true);
    dispatchFile(files[0]);

    expect(fileUploadMulti).toHaveBeenCalledWith([files[0]], expect.any(Function));
    expect(result).toHaveBeenCalledWith(items);
  });

  it('uses default multi-file replacement and ignores empty results', () => {
    const fileUpload = vi.fn<UploadEditor['$cherry']['options']['callback']['fileUpload']>();
    const fileUploadMulti = vi.fn((_files: File[], callback: MultiUploadCallback) => callback([]));
    const { editor, replaceSelection } = createEditor(fileUpload, fileUploadMulti, true);
    captureInput();

    handleUploadMulti(editor, 'image', '*');
    dispatchFile(new File(['x'], 'empty.png', { type: 'image/png' }));

    expect(replaceSelection).not.toHaveBeenCalled();
  });

  it('uses the original input files for default multi-file Markdown replacement', () => {
    const fileUpload = vi.fn<UploadEditor['$cherry']['options']['callback']['fileUpload']>();
    const fileUploadMulti = vi.fn((_files: File[], callback: MultiUploadCallback) => {
      callback([{ url: '/one' }, { url: '/two' }]);
    });
    const { editor, replaceSelection } = createEditor(fileUpload, fileUploadMulti, true);
    captureInput();

    handleUploadMulti(editor, 'image', '*');
    dispatchFile([
      new File(['x'], 'one.png', { type: 'image/png' }),
      new File(['x'], 'two.png', { type: 'image/png' }),
    ]);

    expect(replaceSelection).toHaveBeenCalledWith('![one.png](/one)\n![two.png](/two)\n');
  });

  it('ignores an invalid single-file URL', () => {
    const fileUpload = vi.fn((_file: File, callback: UploadCallback) => callback(''));
    const fileUploadMulti = vi.fn<UploadEditor['$cherry']['options']['callback']['fileUploadMulti']>();
    const { editor, replaceSelection } = createEditor(fileUpload, fileUploadMulti);
    captureInput();

    handleUpload(editor, 'image', '*');
    dispatchFile(new File(['x'], 'broken.png', { type: 'image/png' }));

    expect(replaceSelection).not.toHaveBeenCalled();
  });
});

/**
 * #1767 上传/插入图片后自动追加图片名称
 * https://github.com/Tencent/cherry-markdown/issues/1767
 */
describe('utils/file imageCaption', () => {
  afterEach(() => {
    latestInput = undefined;
    vi.restoreAllMocks();
  });

  const imageFile = () => new File(['x'], 'demo photo.png', { type: 'image/png' });

  it('keeps the historical output when imageCaption is off', () => {
    expect(getImageCaptionText(false, 'demo photo', '/photo')).toBe('');
    expect(getImageCaptionText(undefined, 'demo photo', '/photo')).toBe('');
    expect(handleDropType(imageFile(), '/photo')).toBe('![demo photo.png](/photo)');
    expect(handleFileUploadCallback('/photo', {}, imageFile())).toBe('![demo photo.png](/photo)');
  });

  it('strips the file extension so the caption is the image name', () => {
    expect(stripFileExtension('demo photo.png')).toBe('demo photo');
    expect(stripFileExtension('archive.tar.gz')).toBe('archive.tar');
    expect(stripFileExtension('noext')).toBe('noext');
  });

  it('prefers the uploader-provided name over the raw file name', () => {
    expect(resolveImageName('demo photo.png', {})).toBe('demo photo');
    expect(resolveImageName('demo photo.png', { name: '自定义标题' })).toBe('自定义标题');
  });

  it('appends the image name as its own paragraph when imageCaption is true', () => {
    expect(handleDropType(imageFile(), '/photo', true)).toBe('![demo photo.png](/photo)\n\ndemo photo');
    expect(handleFileUploadCallback('/photo', {}, imageFile(), true)).toBe(
      '![demo photo.png](/photo)\n\ndemo photo',
    );
    expect(handleFileUploadCallback('/photo', { name: '自定义标题' }, imageFile(), true)).toBe(
      '![自定义标题](/photo)\n\n自定义标题',
    );
  });

  it('uses a string option as the caption prefix', () => {
    expect(getImageCaptionText('图片: ', 'demo photo', '/photo')).toBe('\n\n图片: demo photo');
    expect(handleDropType(imageFile(), '/photo', '图片: ')).toBe('![demo photo.png](/photo)\n\n图片: demo photo');
  });

  it('supports a custom caption function and skips empty results', () => {
    const fn = vi.fn((name: string, url: string) => `（来源：${url}）${name}`);
    expect(handleDropType(imageFile(), '/photo', fn)).toBe('![demo photo.png](/photo)\n\n（来源：/photo）demo photo');
    expect(fn).toHaveBeenCalledWith('demo photo', '/photo');
    expect(getImageCaptionText(() => '', 'demo photo', '/photo')).toBe('');
    expect(getImageCaptionText(() => '   ', 'demo photo', '/photo')).toBe('');
  });

  it('never appends a caption to video, audio or other files', () => {
    expect(handleFileUploadCallback('/clip', {}, new File(['x'], 'clip.mp4', { type: 'video/mp4' }), true)).toBe(
      '!video[clip.mp4](/clip)',
    );
    expect(handleFileUploadCallback('/sound', {}, new File(['x'], 'sound.mp3', { type: 'audio/mpeg' }), true)).toBe(
      '!audio[sound.mp3](/sound)',
    );
    expect(handleFileUploadCallback('/doc', {}, new File(['x'], 'doc.pdf', { type: 'application/pdf' }), true)).toBe(
      '[doc.pdf](/doc)',
    );
    expect(handleDropType(new File(['x'], 'notes.txt', { type: 'text/plain' }), '/notes', true)).toBe(
      '[notes.txt](/notes)',
    );
  });

  it('appends the caption in the default single-file upload replacement', () => {
    const fileUpload = vi.fn((_file: File, callback: UploadCallback) => callback('/uploaded'));
    const fileUploadMulti = vi.fn<UploadEditor['$cherry']['options']['callback']['fileUploadMulti']>();
    const { editor, replaceSelection } = createEditor(fileUpload, fileUploadMulti);
    editor.$cherry.options.imageCaption = true;
    captureInput();

    handleUpload(editor, 'image', 'image/*');
    dispatchFile(imageFile());

    expect(replaceSelection).toHaveBeenLastCalledWith('![demo photo.png](/uploaded)\n\ndemo photo');
  });

  it('appends the caption for every image in the default multi-file replacement', () => {
    const fileUpload = vi.fn<UploadEditor['$cherry']['options']['callback']['fileUpload']>();
    const fileUploadMulti = vi.fn((_files: File[], callback: MultiUploadCallback) => {
      callback([
        { url: '/one', params: { name: '一号图' } },
        { url: '/two', file: new File(['x'], 'two.png', { type: 'image/png' }) },
      ]);
    });
    const { editor, replaceSelection } = createEditor(fileUpload, fileUploadMulti, true);
    editor.$cherry.options.imageCaption = '图片: ';
    captureInput();

    handleUploadMulti(editor, 'image', 'image/*');
    dispatchFile(imageFile());

    expect(replaceSelection).toHaveBeenCalledWith(
      '![demo photo.png](/one)\n\n图片: 一号图\n![two.png](/two)\n\n图片: two\n',
    );
  });
});

