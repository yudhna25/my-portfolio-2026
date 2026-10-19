import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, Vector4 } from 'three';

// Mirrors the live Hero year (the stream canvas, or its SVG fallback) into a square around
// the O every frame, so the idle lens bends exactly what the DOM shows outside its reach.
// `rect` is that square as a UV rect of the viewport.
export function createYearMirror() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  // Mipmaps turn the compressed far-side image inside the Einstein radius into a glow, not noise.
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  // The canvas holds sRGB pixels; decoding them keeps the lensed year as dark as the DOM copy.
  texture.colorSpace = SRGBColorSpace;
  const rect = new Vector4(0, 0, 1, 1);
  const paths = new Map();

  const pathFor = d => {
    let path = paths.get(d);
    if (!path) { path = new Path2D(d); paths.set(d, path); }
    return path;
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
    const stream = layer.dataset.yearGl === 'true' && layer.querySelector('[data-year-stream]');
    if (stream) {
      if (stream.dataset.ready !== 'true') return false;
      const box = stream.getBoundingClientRect();
      context.globalAlpha = +getComputedStyle(stream).opacity;
      context.drawImage(stream, k * (box.left - left), k * (box.top - top), k * box.width, k * box.height);
    } else {
      for (const node of layer.querySelectorAll('.hero-year-stream')) {
        const m = node.getScreenCTM(), style = getComputedStyle(node);
        if (!m) continue;
        const unit = Math.hypot(m.a, m.b) || 1;
        context.setTransform(k * m.a, k * m.b, k * m.c, k * m.d, k * (m.e - left), k * (m.f - top));
        context.strokeStyle = style.stroke;
        context.lineCap = context.lineJoin = 'round';
        // Non-scaling stroke: CSS pixels, whatever the glyph transform.
        context.lineWidth = parseFloat(style.strokeWidth) / unit;
        context.stroke(pathFor(node.getAttribute('d')));
      }
    }
    context.globalAlpha = 1;
    texture.needsUpdate = true;
    return true;
  };

  return { texture, rect, update, dispose: () => { texture.dispose(); paths.clear(); } };
}
