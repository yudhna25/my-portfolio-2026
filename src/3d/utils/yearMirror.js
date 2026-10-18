import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, Vector4 } from 'three';

// The glitch layer's CSS clip bands, as fractions of each path's height.
const NOISE_BANDS = { 'hero-noise-upper': [[0.12, 0.26], [0.52, 0.57]], 'hero-noise-lower': [[0.36, 0.43], [0.70, 0.88]] };

// Mirrors the live Hero year (twinkling star fills, meteor dashes on the contours and the
// glitch layer) into a square around the O every frame, so the idle lens bends exactly
// what the DOM shows outside its reach. `rect` is that square as a UV rect of the viewport.
export function createYearMirror() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  // Mipmaps turn the compressed far-side image inside the Einstein radius into a glow, not noise.
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  const rect = new Vector4(0, 0, 1, 1);
  const images = new Map(), paths = new Map(), lengths = new Map();

  const imageFor = href => {
    let image = images.get(href);
    if (!image) { image = new Image(); image.src = href; images.set(href, image); }
    return image.complete && image.naturalWidth ? image : null;
  };
  const pathFor = d => {
    let path = paths.get(d);
    if (!path) { path = new Path2D(d); paths.set(d, path); }
    return path;
  };
  const opacityOf = (node, root) => {
    let value = 1;
    for (let item = node; item && item !== root.parentElement; item = item.parentElement) value *= +getComputedStyle(item).opacity;
    return value;
  };

  const update = (cssWidth, cssHeight, x, y, reach, scale) => {
    const layer = document.querySelector('[data-hero-year]');
    if (!layer || !cssWidth || !cssHeight) return false;
    const size = Math.ceil(reach * 2 + 8), left = x - size / 2, top = y - size / 2;
    const pixels = Math.max(2, Math.round(size * scale));
    if (canvas.width !== pixels) canvas.width = canvas.height = pixels;
    const k = pixels / size;
    rect.set(left / cssWidth, 1 - (top + size) / cssHeight, size / cssWidth, size / cssHeight);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, pixels, pixels);
    const place = node => {
      const m = node.getScreenCTM();
      if (!m) return 0;
      context.setTransform(k * m.a, k * m.b, k * m.c, k * m.d, k * (m.e - left), k * (m.f - top));
      return Math.hypot(m.a, m.b) || 1;
    };
    let complete = true;
    context.fillStyle = context.strokeStyle = '#EDEBE3';
    for (const node of layer.querySelectorAll('.hero-year-stars image')) {
      const image = imageFor(node.getAttribute('href'));
      if (!image) { complete = false; continue; }
      context.globalAlpha = opacityOf(node, layer);
      if (!context.globalAlpha || !place(node)) continue;
      context.drawImage(image, +node.getAttribute('x'), +node.getAttribute('y'), +node.getAttribute('width'), +node.getAttribute('height'));
    }
    for (const node of layer.querySelectorAll('[data-year-meteor] path')) {
      const style = getComputedStyle(node), d = node.getAttribute('d');
      const alpha = opacityOf(node, layer) * +style.strokeOpacity;
      if (!alpha || style.visibility === 'hidden' || !place(node)) continue;
      let length = lengths.get(d);
      if (length === undefined) { length = node.getTotalLength(); lengths.set(d, length); }
      // Dash values are authored against pathLength="1000".
      const unit = length / 1000;
      context.globalAlpha = alpha;
      context.lineWidth = parseFloat(style.strokeWidth);
      context.lineCap = style.strokeLinecap;
      context.setLineDash(style.strokeDasharray.split(/[\s,]+/).map(value => parseFloat(value) * unit));
      context.lineDashOffset = parseFloat(style.strokeDashoffset) * unit;
      context.stroke(pathFor(d));
    }
    context.setLineDash([]);
    context.lineCap = 'butt';
    for (const node of layer.querySelectorAll('[data-year-noise] path')) {
      const style = getComputedStyle(node);
      const alpha = opacityOf(node, layer) * +style.strokeOpacity;
      const unit = alpha && place(node);
      if (!unit) continue;
      // Non-scaling strokes: CSS pixels, whatever the glyph transform.
      context.globalAlpha = alpha;
      context.lineWidth = parseFloat(style.strokeWidth) / unit;
      context.setLineDash(style.strokeDasharray === 'none' ? [] : style.strokeDasharray.split(/[\s,]+/).map(value => parseFloat(value) / unit));
      const bands = NOISE_BANDS[[...node.classList].find(name => NOISE_BANDS[name])];
      context.save();
      if (bands) {
        const box = node.getBBox();
        context.beginPath();
        for (const [from, to] of bands) context.rect(box.x - 20, box.y + box.height * from, box.width + 40, box.height * (to - from));
        context.clip();
      }
      context.stroke(pathFor(node.getAttribute('d')));
      context.restore();
    }
    context.globalAlpha = 1;
    context.setLineDash([]);
    texture.needsUpdate = true;
    return complete;
  };

  return { texture, rect, update, dispose: () => { texture.dispose(); images.clear(); paths.clear(); } };
}
