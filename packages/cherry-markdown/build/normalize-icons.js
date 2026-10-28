/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * One-shot script to normalize all SVG icons so that each glyph occupies the
 * same visual ratio of its viewBox. This is required because the iconfont
 * build pipeline uses `svgicons2svgfont` with `normalize: true`, which only
 * aligns the glyph HEIGHT across icons — any whitespace padding inside the
 * source SVG is preserved and ends up making some icons look smaller than
 * others in the final font.
 *
 * The script:
 *   1. Parses every SVG under src/sass/icons.
 *   2. Computes the real content bounding box of each SVG (supports
 *      <path>, <rect>, <circle>, <ellipse>, <line>, <polyline>, <polygon>
 *      and translate(x,y) / matrix(a,b,c,d,e,f) transforms).
 *   3. Rewrites the <svg> viewBox to `bbox + 5% padding on each side`,
 *      keeping all other content untouched. Width/height/enable-background
 *      attributes are updated accordingly.
 *
 * After running this script you MUST rerun `npm run iconfont` to regenerate
 * the font files from the updated SVGs.
 *
 * Usage:
 *   npm run iconfont:normalize                            # normalize all svgs
 *   node build/normalize-icons.js --dry-run               # preview only
 *   node build/normalize-icons.js --only=primary,question # restrict scope
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentDir, '..');
const iconsDir = path.join(packageRoot, 'src/sass/icons');

// Padding ratio applied on each side of the content bbox, relative to the
// larger of (bbox width, bbox height). 0.05 => 5% padding.
const PADDING_RATIO = 0.05;

// ---------------------------------------------------------------------------
// Path parsing & bbox
// ---------------------------------------------------------------------------

/**
 * Tokenize an SVG path "d" attribute into [command, numbers[]] pairs.
 * @param {string} d
 */
function parsePath(d) {
  const commands = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
  let current = null;
  let match;
  while ((match = re.exec(d)) !== null) {
    if (match[1]) {
      if (current) commands.push(current);
      current = { cmd: match[1], args: [] };
    } else if (current) {
      current.args.push(parseFloat(match[2]));
    }
  }
  if (current) commands.push(current);
  return commands;
}

/**
 * Compute a set of points that tightly bound an SVG elliptical arc segment.
 * Uses the official SVG endpoint-to-center parameter conversion (Appendix
 * F.6.5), then samples the two endpoints plus any of the ellipse's four
 * axis-aligned extrema whose parametric angle falls inside the arc sweep.
 * Falls back to just the endpoints for degenerate (zero-radius) arcs.
 *
 * @param {number} x1 start x
 * @param {number} y1 start y
 * @param {number} x2 end x
 * @param {number} y2 end y
 * @param {number} rxIn signed rx from the "d" attribute
 * @param {number} ryIn signed ry from the "d" attribute
 * @param {number} phiDeg x-axis rotation (deg)
 * @param {boolean} largeArc large-arc flag
 * @param {boolean} sweep sweep flag
 * @returns {Array<[number, number]>}
 */
function arcBBoxPoints(x1, y1, x2, y2, rxIn, ryIn, phiDeg, largeArc, sweep) {
  // Degenerate: identical endpoints => the arc is empty.
  if (x1 === x2 && y1 === y2) return [];
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) {
    // Treat as a straight line between endpoints.
    return [
      [x1, y1],
      [x2, y2],
    ];
  }
  const phi = (phiDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  // Step 1: compute (x1', y1') in the ellipse-aligned frame.
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  // Step 2: ensure radii are large enough (F.6.6.2 radius correction).
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }

  // Step 3: compute (cx', cy').
  const sign = largeArc === sweep ? -1 : 1;
  const rx2 = rx * rx;
  const ry2 = ry * ry;
  const x1p2 = x1p * x1p;
  const y1p2 = y1p * y1p;
  const num = rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2;
  const den = rx2 * y1p2 + ry2 * x1p2;
  const coef = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = coef * ((rx * y1p) / ry);
  const cyp = coef * (-(ry * x1p) / rx);

  // Step 4: compute (cx, cy) in the user coordinate system.
  const cxc = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cyc = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  // Step 5: compute theta1 and deltaTheta.
  const vecAngle = (ux, uy, vx, vy) => {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy)) || 1;
    let ang = Math.acos(Math.min(1, Math.max(-1, dot / len)));
    if (ux * vy - uy * vx < 0) ang = -ang;
    return ang;
  };
  const theta1 = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let deltaTheta = vecAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && deltaTheta > 0) deltaTheta -= 2 * Math.PI;
  else if (sweep && deltaTheta < 0) deltaTheta += 2 * Math.PI;
  const theta2 = theta1 + deltaTheta;

  // Determine the min/max theta so we can test whether a candidate angle
  // lies on the arc.
  const thetaMin = Math.min(theta1, theta2);
  const thetaMax = Math.max(theta1, theta2);

  const pointAt = (t) => {
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const x = cosPhi * rx * cosT - sinPhi * ry * sinT + cxc;
    const y = sinPhi * rx * cosT + cosPhi * ry * sinT + cyc;
    return /** @type {[number, number]} */ ([x, y]);
  };

  /** @type {Array<[number, number]>} */
  const out = [
    [x1, y1],
    [x2, y2],
  ];
  // Candidate parametric angles that produce axis-aligned extrema of the
  // (possibly rotated) ellipse: solve d/dt of x(t) and y(t) == 0.
  const candidates = [];
  if (sinPhi === 0 && cosPhi !== 0) {
    // Non-rotated ellipse: extrema at 0, pi/2, pi, 3pi/2.
    candidates.push(0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2);
  } else if (cosPhi === 0 && sinPhi !== 0) {
    candidates.push(0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2);
  } else {
    const tx = Math.atan2(-ry * sinPhi, rx * cosPhi); // dx/dt = 0
    const ty = Math.atan2(ry * cosPhi, rx * sinPhi); // dy/dt = 0
    candidates.push(tx, tx + Math.PI, ty, ty + Math.PI);
  }
  for (const base of candidates) {
    // Try base and base ± 2π to cover arcs that wrap below theta1 or above theta2.
    for (const k of [-2, -1, 0, 1, 2]) {
      const t = base + k * Math.PI * 2;
      if (t >= thetaMin && t <= thetaMax) {
        out.push(pointAt(t));
      }
    }
  }
  return out;
}

/**
 * Each path command yields a set of absolute (x,y) sample points that are
 * guaranteed to CONTAIN the real geometry (for Bezier/Arc we conservatively
 * include control points — the bbox may be slightly larger than the true
 * ink extent, which is safe for our purpose).
 * @param {string} d
 */
function samplePoints(d) {
  const pts = [];
  const cmds = parsePath(d);
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  // Declare push outside the loop body to satisfy eslint `no-loop-func`.
  // It still mutates the outer cx/cy cursor as intended.
  const push = (x, y) => {
    pts.push([x, y]);
    cx = x;
    cy = y;
  };
  for (const { cmd, args } of cmds) {
    const upper = cmd.toUpperCase();
    const rel = cmd !== upper;
    switch (upper) {
      case 'M': {
        for (let i = 0; i < args.length; i += 2) {
          const x = (rel ? cx : 0) + args[i];
          const y = (rel ? cy : 0) + args[i + 1];
          push(x, y);
          if (i === 0) {
            startX = x;
            startY = y;
          }
        }
        break;
      }
      case 'L':
      case 'T': {
        for (let i = 0; i < args.length; i += 2) {
          push((rel ? cx : 0) + args[i], (rel ? cy : 0) + args[i + 1]);
        }
        break;
      }
      case 'H': {
        for (let i = 0; i < args.length; i += 1) {
          push((rel ? cx : 0) + args[i], cy);
        }
        break;
      }
      case 'V': {
        for (let i = 0; i < args.length; i += 1) {
          push(cx, (rel ? cy : 0) + args[i]);
        }
        break;
      }
      case 'C': {
        for (let i = 0; i < args.length; i += 6) {
          // control points + end point (control points enlarge bbox safely)
          pts.push([(rel ? cx : 0) + args[i], (rel ? cy : 0) + args[i + 1]]);
          pts.push([(rel ? cx : 0) + args[i + 2], (rel ? cy : 0) + args[i + 3]]);
          push((rel ? cx : 0) + args[i + 4], (rel ? cy : 0) + args[i + 5]);
        }
        break;
      }
      case 'S':
      case 'Q': {
        for (let i = 0; i < args.length; i += 4) {
          pts.push([(rel ? cx : 0) + args[i], (rel ? cy : 0) + args[i + 1]]);
          push((rel ? cx : 0) + args[i + 2], (rel ? cy : 0) + args[i + 3]);
        }
        break;
      }
      case 'A': {
        // Arc: rx ry xAxisRotation largeArcFlag sweepFlag x y
        // Compute the true tight bbox of the elliptical arc segment:
        //   1. Endpoint -> center conversion (SVG implementation notes, F.6.5).
        //   2. Candidate extrema are the 4 axis-aligned points on the full
        //      ellipse (angles 0, pi/2, pi, 3pi/2 in local frame) that fall
        //      inside the arc's angular sweep, plus the two endpoints.
        for (let i = 0; i < args.length; i += 7) {
          const rxIn = args[i];
          const ryIn = args[i + 1];
          const phiDeg = args[i + 2];
          const largeArc = args[i + 3] !== 0;
          const sweep = args[i + 4] !== 0;
          const ex = (rel ? cx : 0) + args[i + 5];
          const ey = (rel ? cy : 0) + args[i + 6];
          const sx = cx;
          const sy = cy;
          const arcExtrema = arcBBoxPoints(sx, sy, ex, ey, rxIn, ryIn, phiDeg, largeArc, sweep);
          for (const p of arcExtrema) pts.push(p);
          push(ex, ey);
        }
        break;
      }
      case 'Z': {
        cx = startX;
        cy = startY;
        break;
      }
      default:
        break;
    }
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Transform parsing
// ---------------------------------------------------------------------------

/**
 * Parse the transform attribute into a flat 2x3 matrix [a,b,c,d,e,f] which
 * maps (x,y) -> (a*x + c*y + e, b*x + d*y + f). Supports translate, matrix,
 * scale, rotate (around origin). This covers all observed cases in the icons
 * directory. Unknown ops are ignored (identity).
 * @param {string | null | undefined} transformAttr
 */
function parseTransform(transformAttr) {
  // identity
  let m = [1, 0, 0, 1, 0, 0];
  if (!transformAttr) return m;
  const re = /(matrix|translate|scale|rotate)\s*\(([^)]*)\)/g;
  let match;
  while ((match = re.exec(transformAttr)) !== null) {
    const name = match[1];
    const nums = match[2]
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(parseFloat);
    let n;
    if (name === 'matrix') {
      n = nums; // a b c d e f
    } else if (name === 'translate') {
      n = [1, 0, 0, 1, nums[0] || 0, nums[1] || 0];
    } else if (name === 'scale') {
      const sx = nums[0];
      const sy = nums.length > 1 ? nums[1] : sx;
      n = [sx, 0, 0, sy, 0, 0];
    } else if (name === 'rotate') {
      const theta = ((nums[0] || 0) * Math.PI) / 180;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      if (nums.length === 3) {
        const [, px, py] = nums;
        // T(px,py) * R * T(-px,-py)
        const e = px - cos * px + sin * py;
        const f = py - sin * px - cos * py;
        n = [cos, sin, -sin, cos, e, f];
      } else {
        n = [cos, sin, -sin, cos, 0, 0];
      }
    } else {
      n = [1, 0, 0, 1, 0, 0];
    }
    m = multiplyMatrix(m, n);
  }
  return m;
}

function multiplyMatrix(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

function applyMatrix(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

// ---------------------------------------------------------------------------
// Primitive samplers
// ---------------------------------------------------------------------------

/** @param {Record<string,string>} attrs */
function rectPoints(attrs) {
  const x = parseFloat(attrs.x || '0');
  const y = parseFloat(attrs.y || '0');
  const w = parseFloat(attrs.width || '0');
  const h = parseFloat(attrs.height || '0');
  return [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
}

function circlePoints(attrs) {
  const cx = parseFloat(attrs.cx || '0');
  const cy = parseFloat(attrs.cy || '0');
  const r = parseFloat(attrs.r || '0');
  return [
    [cx - r, cy - r],
    [cx + r, cy - r],
    [cx - r, cy + r],
    [cx + r, cy + r],
  ];
}

function ellipsePoints(attrs) {
  const cx = parseFloat(attrs.cx || '0');
  const cy = parseFloat(attrs.cy || '0');
  const rx = parseFloat(attrs.rx || '0');
  const ry = parseFloat(attrs.ry || '0');
  return [
    [cx - rx, cy - ry],
    [cx + rx, cy - ry],
    [cx - rx, cy + ry],
    [cx + rx, cy + ry],
  ];
}

function linePoints(attrs) {
  return [
    [parseFloat(attrs.x1 || '0'), parseFloat(attrs.y1 || '0')],
    [parseFloat(attrs.x2 || '0'), parseFloat(attrs.y2 || '0')],
  ];
}

function polyPoints(attrs) {
  const pts = [];
  const raw = attrs.points || '';
  const nums = raw.split(/[\s,]+/).filter(Boolean).map(parseFloat);
  for (let i = 0; i + 1 < nums.length; i += 2) {
    pts.push([nums[i], nums[i + 1]]);
  }
  return pts;
}

// ---------------------------------------------------------------------------
// SVG scanning
// ---------------------------------------------------------------------------

/** Parse a tag string's attribute dictionary. Only used for individual tags. */
function parseAttrs(tagString) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(tagString)) !== null) {
    attrs[m[1]] = m[2] !== undefined ? m[2] : m[3];
  }
  return attrs;
}

/**
 * Walk the SVG source, maintaining a transform stack across <g> nesting, and
 * collect every geometry point mapped to the root coordinate space.
 * @param {string} src
 */
function collectPoints(src) {
  const points = [];
  // transform stack: each entry is a 2x3 matrix
  const stack = [[1, 0, 0, 1, 0, 0]];

  // Walk tags in document order. For every opening <g ...> push; for every
  // </g> pop. Self-closing <g .../> is a no-op (push then pop).
  const tagRe = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(\/)?>|<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/g;
  let m;
  while ((m = tagRe.exec(src)) !== null) {
    if (m[4]) {
      // closing tag
      if (m[4] === 'g') stack.pop();
      continue;
    }
    const tag = m[1];
    const attrText = m[2] || '';
    const selfClosing = Boolean(m[3]);
    const attrs = parseAttrs(attrText);
    const localMatrix = parseTransform(attrs.transform);
    const parentMatrix = stack[stack.length - 1];
    const effective = multiplyMatrix(parentMatrix, localMatrix);

    if (tag === 'g') {
      if (!selfClosing) stack.push(effective);
      continue;
    }

    // Skip "invisible" placeholder shapes: fill="none" AND no visible stroke.
    // These are commonly used as a transparent 48x48 bounding frame in material
    // style icons (e.g. <path d="M0 0h48v48H0z" fill="none"/>) and would wrongly
    // enlarge the computed bbox.
    const fillAttr = (attrs.fill || '').trim().toLowerCase();
    const strokeAttr = (attrs.stroke || '').trim().toLowerCase();
    const strokeWidthAttr = (attrs['stroke-width'] || '').trim();
    const hasVisibleStroke =
      strokeAttr && strokeAttr !== 'none' && strokeAttr !== 'transparent' && strokeWidthAttr !== '0';
    const isInvisible = fillAttr === 'none' && !hasVisibleStroke;

    /** @type {Array<[number, number]>} */
    let localPts = [];
    if (!isInvisible) {
      if (tag === 'path' && attrs.d) {
        localPts = samplePoints(attrs.d);
      } else if (tag === 'rect') {
        localPts = rectPoints(attrs);
      } else if (tag === 'circle') {
        localPts = circlePoints(attrs);
      } else if (tag === 'ellipse') {
        localPts = ellipsePoints(attrs);
      } else if (tag === 'line') {
        localPts = linePoints(attrs);
      } else if (tag === 'polyline' || tag === 'polygon') {
        localPts = polyPoints(attrs);
      }
    }
    for (const [x, y] of localPts) {
      points.push(applyMatrix(effective, x, y));
    }
  }
  return points;
}

/**
 * Compute bounding box of a set of points. Returns null if empty.
 * @param {Array<[number, number]>} pts
 */
function boundingBox(pts) {
  if (!pts.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

/**
 * Round to 3 decimals, strip trailing zeros.
 * @param {number} n
 */
function fmt(n) {
  const v = Math.round(n * 1000) / 1000;
  return String(v);
}

/**
 * Rewrite the viewBox of the root <svg> element.
 * Also strips width/height (so iconfont pipeline uses viewBox exclusively)
 * and removes the stale enable-background attribute to avoid confusion.
 */
function rewriteSvgRoot(src, bbox, padding) {
  const padW = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) * padding;
  // Make the resulting viewBox a perfect square (so the icon's visual box in
  // the font em is uniform across icons). We center the content inside the
  // square.
  const contentW = bbox.maxX - bbox.minX;
  const contentH = bbox.maxY - bbox.minY;
  const side = Math.max(contentW, contentH) + 2 * padW;
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  const vbX = cx - side / 2;
  const vbY = cy - side / 2;
  const vbW = side;
  const vbH = side;
  const newViewBox = `${fmt(vbX)} ${fmt(vbY)} ${fmt(vbW)} ${fmt(vbH)}`;

  // Replace or insert the viewBox attribute inside the root <svg ...> opening tag.
  const rootRe = /<svg\b([^>]*)>/;
  const match = src.match(rootRe);
  if (!match) throw new Error('No <svg> root tag found');
  let attrs = match[1];

  // viewBox
  if (/\bviewBox\s*=/.test(attrs)) {
    attrs = attrs.replace(/\bviewBox\s*=\s*"[^"]*"/, `viewBox="${newViewBox}"`);
    attrs = attrs.replace(/\bviewBox\s*=\s*'[^']*'/, `viewBox='${newViewBox}'`);
  } else {
    attrs = ` viewBox="${newViewBox}"${attrs}`;
  }

  // Drop stale enable-background: it references the old viewBox and some
  // renderers use it to clip the canvas.
  attrs = attrs.replace(/\s+enable-background\s*=\s*"[^"]*"/g, '');
  attrs = attrs.replace(/\s+enable-background\s*=\s*'[^']*'/g, '');
  // Also drop any inline style enable-background.
  attrs = attrs.replace(/style\s*=\s*"([^"]*)"/g, (full, styleBody) => {
    const cleaned = styleBody
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && !/^enable-background\s*:/i.test(s))
      .join(';');
    return cleaned ? `style="${cleaned}"` : '';
  });

  // Drop fixed width/height so the icon scales purely by viewBox when rendered
  // inside the iconfont pipeline.
  attrs = attrs.replace(/\s+width\s*=\s*"[^"]*"/g, '');
  attrs = attrs.replace(/\s+height\s*=\s*"[^"]*"/g, '');
  attrs = attrs.replace(/\s+width\s*=\s*'[^']*'/g, '');
  attrs = attrs.replace(/\s+height\s*=\s*'[^']*'/g, '');

  return src.replace(rootRe, `<svg${attrs}>`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const onlyFlag = argv.find((a) => a.startsWith('--only='));
  const onlyList = onlyFlag ? onlyFlag.slice('--only='.length).split(',').filter(Boolean) : null;

  const files = fs
    .readdirSync(iconsDir)
    .filter((name) => name.toLowerCase().endsWith('.svg'))
    .filter((name) => !onlyList || onlyList.some((k) => name.includes(k)))
    .sort();

  const report = [];
  let changed = 0;
  let skipped = 0;
  for (const file of files) {
    const full = path.join(iconsDir, file);
    const src = fs.readFileSync(full, 'utf8');
    let pts;
    try {
      pts = collectPoints(src);
    } catch (err) {
      report.push({ file, status: 'parse-error', message: err.message });
      skipped += 1;
      continue;
    }
    const bbox = boundingBox(pts);
    if (!bbox || bbox.maxX - bbox.minX <= 0 || bbox.maxY - bbox.minY <= 0) {
      report.push({ file, status: 'empty-bbox' });
      skipped += 1;
      continue;
    }

    let out;
    try {
      out = rewriteSvgRoot(src, bbox, PADDING_RATIO);
    } catch (err) {
      report.push({ file, status: 'rewrite-error', message: err.message });
      skipped += 1;
      continue;
    }

    if (out !== src) {
      if (!dryRun) {
        fs.writeFileSync(full, out, 'utf8');
      }
      changed += 1;
      report.push({
        file,
        status: dryRun ? 'ok-dry' : 'ok',
        bbox: {
          x: +fmt(bbox.minX),
          y: +fmt(bbox.minY),
          w: +fmt(bbox.maxX - bbox.minX),
          h: +fmt(bbox.maxY - bbox.minY),
        },
      });
    } else {
      report.push({ file, status: 'no-change' });
    }
  }

  console.log(
    `[normalize-icons]${dryRun ? ' (dry-run)' : ''} processed=${files.length} changed=${changed} skipped=${skipped}`,
  );
  for (const row of report) {
    if (dryRun && row.status === 'ok-dry') {
      console.log(`  * ${row.file}: bbox=${JSON.stringify(row.bbox)}`);
    } else if (row.status !== 'ok' && row.status !== 'no-change') {
      console.log(`  - ${row.file}: ${row.status}${row.message ? ' - ' + row.message : ''}`);
    }
  }
  if (!dryRun) {
    console.log('[normalize-icons] Remember to run `npm run iconfont` to regenerate the font files.');
  }
}

main();
