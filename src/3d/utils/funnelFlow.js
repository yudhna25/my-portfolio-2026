import { bridgeProject } from '@/3d/utils/portal';

// The page's own text rides the bridge. These map a point of the resting page through the
// same flow the sheet shader draws (see BRIDGE_SHEET_FRAG), so live DOM letters and the
// live sky are pulled down the funnel, or poured out of the far mouth, as one surface.

const smooth = (a, b, value) => {
  const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Sheet point that shows the resting point (px, py): the shader reads source radius
// s(r) = r + slide·L·e^(−r/1.08L) at angle θ + twist(r); invert it with a few Newton steps.
export function funnelPoint(cam, slide, height, px, py, out = {}) {
  const sx = px - cam.originX, sy = py - cam.originY;
  const s = Math.hypot(sx, sy), phi = Math.atan2(sy, sx);
  const L = (0.08 + 1.07 * slide) * height, k = 1.08 * L;
  // Inside s(0) the point has already crossed into the throat.
  const swallowed = slide > 0 && s <= slide * L;
  let r = s;
  if (slide > 0 && !swallowed) {
    for (let i = 0; i < 8; i++) {
      const e = Math.exp(-r / k);
      r = Math.max(0, r - (r + slide * L * e - s) / (1 - slide / 1.08 * e));
    }
  } else if (swallowed) r = 0;
  const stretch = 1 - slide / 1.08 * Math.exp(-r / k);
  const theta = phi - slide * 3.6 * Math.exp(-r / (0.45 * L + 1));
  bridgeProject(cam, r * Math.cos(theta), r * Math.sin(theta), out);
  out.stretch = stretch;
  out.deep = Math.pow(cam.throat / (r + cam.throat), 1.3);
  out.alpha = swallowed ? 0 : smooth(0.02, 0.18, stretch) * (1 - smooth(3, 7, out.w));
  return out;
}

const A = {}, B = {}, C = {};
const STEP = 2;

// The flow near an element's centre, as a CSS matrix that moves, turns and stretches it.
// A whole word or picture cannot bend like the sky, so its stretch is held to `limit`
// (by its singular values); `rigid` keeps it undistorted, only turned and scaled.
export function funnelMatrix(cam, slide, height, cx, cy, out = {}, { limit = 2.5, rigid = false } = {}) {
  funnelPoint(cam, slide, height, cx, cy, A);
  funnelPoint(cam, slide, height, cx + STEP, cy, B);
  funnelPoint(cam, slide, height, cx, cy + STEP, C);
  const m00 = (B.x - A.x) / STEP, m10 = (B.y - A.y) / STEP, m01 = (C.x - A.x) / STEP, m11 = (C.y - A.y) / STEP;
  const E = (m00 + m11) / 2, F = (m00 - m11) / 2, G = (m10 + m01) / 2, H = (m10 - m01) / 2;
  const Q = Math.hypot(E, H), R = Math.hypot(F, G);
  const a1 = Math.atan2(G, F), a2 = Math.atan2(H, E);
  const theta = (a2 - a1) / 2, phi = (a2 + a1) / 2;
  let sx = Q + R, sy = Q - R;
  // Rigid: the tighter of the two, so it is small at the throat and grows as it leaves.
  if (rigid) sx = sy = Math.min(limit, Math.abs(sx), Math.abs(sy));
  else { sx = Math.min(limit, sx); sy = Math.sign(sy || 1) * Math.min(limit, Math.abs(sy)); }
  // Rebuild rot(phi) · diag(sx, sy) · rot(theta).
  const cp = Math.cos(phi), sp = Math.sin(phi), ct = Math.cos(theta), st = Math.sin(theta);
  out.a = cp * sx * ct - sp * sy * st; out.b = sp * sx * ct + cp * sy * st;
  out.c = -cp * sx * st - sp * sy * ct; out.d = -sp * sx * st + cp * sy * ct;
  out.e = A.x - cx; out.f = A.y - cy;
  out.stretch = A.stretch; out.deep = A.deep; out.alpha = A.alpha;
  return out;
}

export const matrixCss = m => `matrix(${m.a.toFixed(4)},${m.b.toFixed(4)},${m.c.toFixed(4)},${m.d.toFixed(4)},${m.e.toFixed(2)},${m.f.toFixed(2)})`;

// Wraps each word under the roots in its own inline-block span, so it can be moved alone.
// Words keep their kerning and the spaces between them, so the lines break as before.
export function splitWords(roots) {
  const units = [], undo = [];
  roots.forEach(root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts = [];
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      const parent = text.parentElement;
      // Layout twins and screen-reader copies are not what the eye sees.
      if (!parent || parent.closest('.invisible, .sr-only') || !text.textContent.trim()) continue;
      texts.push(text);
    }
    texts.forEach(text => {
      const fragment = document.createDocumentFragment();
      const spans = [];
      // In a flex or grid box loose spaces vanish, so each word carries its own space there.
      const boxed = /flex|grid/.test(getComputedStyle(text.parentElement).display);
      text.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          if (boxed && spans.length) spans[spans.length - 1].textContent += ' ';
          else fragment.append(part);
          return;
        }
        const span = document.createElement('span');
        span.dataset.flowUnit = '';
        span.style.display = 'inline-block';
        if (boxed) span.style.whiteSpace = 'pre';
        span.textContent = part;
        fragment.append(span);
        spans.push(span);
      });
      const first = fragment.firstChild, last = fragment.lastChild;
      text.replaceWith(fragment);
      units.push(...spans);
      undo.push(() => {
        if (!first?.parentNode) return;
        const range = document.createRange();
        range.setStartBefore(first); range.setEndAfter(last);
        range.deleteContents();
        range.insertNode(text);
      });
    });
  });
  return { units, restore: () => undo.reverse().forEach(step => step()) };
}

const EMBER = [255, 178.5, 91.8];

// Matter heats toward amber as it nears the throat and dims down the well, as the sheet does.
export function flowColor(base, heat, dim) {
  const lum = Math.max(base[0], base[1], base[2]) * 1.6;
  const t = Math.min(0.85, Math.max(0, heat * 1.2));
  const c = i => Math.round(Math.min(255, (base[i] + (Math.min(255, EMBER[i] / 255 * lum) - base[i]) * t) * dim));
  return `rgba(${c(0)},${c(1)},${c(2)},${base[3]})`;
}

// Any CSS colour (oklab, color(), rgb…) as sRGB 0–255 with alpha 0–1, read back off a pixel.
let swatch = null;
export function parseColor(value) {
  swatch ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  swatch.clearRect(0, 0, 1, 1);
  swatch.fillStyle = value;
  swatch.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = swatch.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}
