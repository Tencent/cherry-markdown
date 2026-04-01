import { src, dest } from 'gulp';
import iconfont from 'gulp-iconfont';
import consolidate from 'gulp-consolidate';
import rename from 'gulp-rename';
import convertStrokeToFill from 'oslllo-svg-fixer';
import { resolve, dirname } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SVG_SOURCE_DIR = resolve(__dirname, 'src/sass/icons');
const SVG_CONVERTED_DIR = resolve(__dirname, 'src/sass/icons-converted');
const FONT_OUTPUT_DIR = resolve(__dirname, 'dist/fonts');

/**
 * 生成图标字体
 *
 * 流程：
 * 1. oslllo-svg-fixer：stroke → fill（iconfont 仅支持 fill path）
 * 2. gulp-iconfont：生成字体文件
 * 3. gulp-consolidate：通过模板生成 SCSS
 */
export default async function generateIconFont(done) {
  try {
    // stroke → fill，源目录 → 临时目录
    mkdirSync(SVG_CONVERTED_DIR, { recursive: true });
    await convertStrokeToFill(SVG_SOURCE_DIR, SVG_CONVERTED_DIR, {
      showProgressBar: true,
    }).fix();

    // 生成字体 + SCSS
    src(`${SVG_CONVERTED_DIR}/*.svg`)
      .pipe(
        iconfont({
          fontName: 'ch-icon',
          prependUnicode: true,
          formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'],
          timestamp: Math.round(Date.now() / 1000),
          normalize: true,
          fontHeight: 1024,
          descent: 128,
          centerHorizontally: true,
        }),
      )
      .on('glyphs', (glyphs) => {
        src('src/sass/icon_template.scss')
          .pipe(
            consolidate('lodash', {
              glyphs,
              fontName: 'ch-icon',
              fontPath: './fonts/',
              className: 'ch-icon',
            }),
          )
          .pipe(rename({ basename: 'ch-icon' }))
          .pipe(dest('src/sass/'));
      })
      .pipe(dest(FONT_OUTPUT_DIR))
      .on('finish', () => {
        rmSync(SVG_CONVERTED_DIR, { recursive: true, force: true });
        done();
      });
  } catch (err) {
    console.error('图标字体生成失败:', err);
    if (existsSync(SVG_CONVERTED_DIR)) {
      rmSync(SVG_CONVERTED_DIR, { recursive: true, force: true });
    }
    done(err);
  }
}
