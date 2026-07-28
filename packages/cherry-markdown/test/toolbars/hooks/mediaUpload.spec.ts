import { handleUpload } from '../../../src/utils/file';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Audio from '../../../src/toolbars/hooks/Audio';
import FileLink from '../../../src/toolbars/hooks/File';
import Image from '../../../src/toolbars/hooks/Image';
import Pdf from '../../../src/toolbars/hooks/Pdf';
import Video from '../../../src/toolbars/hooks/Video';
import Word from '../../../src/toolbars/hooks/Word';
import { createMenuContext } from '../../helpers/menu';

vi.mock('../../../src/utils/file', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/file')>();
  return {
    ...actual,
    handleUpload: vi.fn(),
    handleUploadMulti: vi.fn(),
  };
});

interface UploadHook {
  name: string;
  updateMarkdown: boolean;
  onClick(selection: string): string;
  setCacheOnce(value: object): void;
}

type UploadHookConstructor = new (cherry: never) => UploadHook;

const hookCases: Array<{
  type: string;
  Hook: UploadHookConstructor;
  accept: string;
  singleMarkdown: string;
  fallbackMarkdown: string;
  multipleMarkdown: string;
}> = [
  {
    type: 'image',
    Hook: Image,
    accept: 'image/png',
    singleMarkdown: '![Custom#B #50%](/single)',
    fallbackMarkdown: '![original.png](/fallback)',
    multipleMarkdown: '![original.png](/file)\n![Custom#S](/custom)\n![image](/default)\n',
  },
  {
    type: 'video',
    Hook: Video,
    accept: 'video/mp4',
    singleMarkdown: '!video[Custom#B #50%](/single){poster=/poster}',
    fallbackMarkdown: '!video[original.mp4](/fallback)',
    multipleMarkdown:
      '!video[original.mp4](/file)\n!video[Custom#S](/custom){poster=/poster}\n!video[video](/default)\n',
  },
  {
    type: 'audio',
    Hook: Audio,
    accept: 'audio/mp3',
    singleMarkdown: '!audio[Custom#B #50%](/single)',
    fallbackMarkdown: '!audio[original.mp3](/fallback)',
    multipleMarkdown: '!audio[original.mp3](/file)\n!audio[Custom#S](/custom)\n!audio[audio](/default)\n',
  },
  {
    type: 'file',
    Hook: FileLink,
    accept: '.zip',
    singleMarkdown: '[Custom](/single)',
    fallbackMarkdown: '[original.zip](/fallback)',
    multipleMarkdown: '[original.zip](/file)\n[Custom](/custom)\n[file](/default)\n',
  },
  {
    type: 'pdf',
    Hook: Pdf,
    accept: '.pdf',
    singleMarkdown: '[Custom](/single)',
    fallbackMarkdown: '[original.pdf](/fallback)',
    multipleMarkdown: '[original.pdf](/file)\n[Custom](/custom)\n[file](/default)\n',
  },
  {
    type: 'word',
    Hook: Word,
    accept: '.docx',
    singleMarkdown: '[Custom](/single)',
    fallbackMarkdown: '[original.docx](/fallback)',
    multipleMarkdown: '[original.docx](/file)\n[Custom](/custom)\n[file](/default)\n',
  },
];

function createHook(Hook: UploadHookConstructor, type: string, multiple = false, includeLimit = true) {
  const context = createMenuContext('selected');
  const options = {
    fileTypeLimitMap: includeLimit ? { [type]: hookCases.find((item) => item.type === type)?.accept } : undefined,
    multipleFileSelection: multiple ? { [type]: true } : undefined,
  };
  Object.assign(context.cherry, { options });
  return { context, hook: new Hook(context.cherry as never) };
}

function originalFile(type: string) {
  const extension = { image: 'png', video: 'mp4', audio: 'mp3', file: 'zip', pdf: 'pdf', word: 'docx' }[type];
  return new File(['content'], `original.${extension}`);
}

describe('toolbars/hooks media uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(hookCases)('uploads one $type and inserts its Markdown', ({ type, Hook, accept, singleMarkdown }) => {
    const { context, hook } = createHook(Hook, type);
    vi.mocked(handleUpload).mockImplementationOnce((_editor, _type, _accept, callback) => {
      if (callback) {
        callback('original', '/single', {
          name: 'Custom',
          poster: '/poster',
          isBorder: true,
          width: '50%',
        });
      }
    });

    expect(hook.onClick('selected')).toBe('selected');

    expect(handleUpload).toHaveBeenCalledWith(context.editor, type, accept, expect.any(Function));
    expect(context.getState().doc.toString()).toBe(singleMarkdown);
    expect(hook.updateMarkdown).toBe(false);
  });

  it.each(hookCases)('uses the original name for a cached $type upload', ({ type, Hook, fallbackMarkdown }) => {
    const { hook } = createHook(Hook, type);
    hook.setCacheOnce({ name: originalFile(type).name, url: '/fallback', params: {} });

    expect(hook.onClick('')).toBe(fallbackMarkdown);
  });
});
