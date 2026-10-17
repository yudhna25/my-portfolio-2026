import { CanvasTexture, LinearFilter } from 'three';

// Rasterizes the live Hero lockup (year stars, PORTFOLIO without its last O, name and
// role) at its measured DOM positions, so the opening lens bends exactly what the DOM
// reveals afterwards. The stage is laid out but transparent while this runs.
export function createLockupRaster() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  let key = '', year = null, yearKey = '', disposed = false;

  const baseline = (box, size, font) => {
    context.font = font;
    const metrics = context.measureText('PORTFOLIO');
    const ascent = metrics.fontBoundingBoxAscent ?? size * 0.8, descent = metrics.fontBoundingBoxDescent ?? size * 0.2;
    return box.top + (box.height - (ascent + descent)) / 2 + ascent;
  };
  const fontOf = style => `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

  const loadYear = (svg, box) => {
    const id = `${Math.round(box.width)}x${Math.round(box.height)}`;
    if (yearKey === id) return;
    yearKey = id;
    const clone = svg.cloneNode(true);
    clone.setAttribute('width', box.width);
    clone.setAttribute('height', box.height);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    // CSS classes do not reach an SVG drawn as an image; inline the two that matter.
    clone.querySelectorAll('.hero-year-base').forEach(path => path.setAttribute('stroke', 'none'));
    clone.querySelectorAll('.hero-year-stars').forEach(group => group.setAttribute('opacity', '0.42'));
    // The glitch layer is hidden by a utility class, which an image cannot see either.
    clone.querySelectorAll('[data-year-noise]').forEach(group => group.remove());
    const image = new Image();
    image.onload = () => { if (!disposed && yearKey === id) { year = image; key = ''; } };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  };

  const update = (width, height, dpr) => {
    const stage = document.querySelector('[data-portal-stage]');
    if (!stage || !width || !height) return false;
    const next = `${width}x${height}@${dpr}:${year ? 1 : 0}:${document.fonts?.status}`;
    if (next === key) return true;
    key = next;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const yearSvg = stage.querySelector('[data-hero-year] svg:not([data-year-contours])');
    if (yearSvg) {
      const box = yearSvg.getBoundingClientRect();
      loadYear(yearSvg, box);
      if (year) context.drawImage(year, box.left, box.top, box.width, box.height);
    }

    const chars = [...stage.querySelectorAll('[data-portal-char]')];
    context.fillStyle = '#ffffff';
    context.textBaseline = 'alphabetic';
    chars.forEach((span, index) => {
      // The last O is the black hole itself.
      if (index === chars.length - 1) return;
      const box = span.getBoundingClientRect(), style = getComputedStyle(span);
      const font = fontOf(style);
      context.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
      context.fillText(span.firstChild?.textContent ?? '', box.left, baseline(box, parseFloat(style.fontSize), font));
    });
    context.letterSpacing = '0px';

    for (const [selector, alpha] of [['[data-hero-decode]', 1], ['[data-hero-role]', 0.7]]) {
      const node = stage.querySelector(selector);
      if (!node) continue;
      const box = node.getBoundingClientRect(), style = getComputedStyle(node);
      context.font = fontOf(style);
      context.textBaseline = 'middle';
      context.fillStyle = `rgba(255,255,255,${alpha})`;
      context.fillText(node.textContent, box.left, box.top + box.height / 2);
    }
    texture.needsUpdate = true;
    return true;
  };

  return { texture, update, dispose: () => { disposed = true; texture.dispose(); } };
}
