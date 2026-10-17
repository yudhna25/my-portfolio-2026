// Rasterize text only at layout time; the detached 2D canvas is never a scene renderer.
export function samplePortalParticles(node, text, rect, canvas, limit) {
  const points = [];
  const paths = node instanceof SVGElement ? [...node.querySelectorAll('.hero-year-base')] : [];
  if (paths.length) {
    for (const path of paths) {
      const length = path.getTotalLength(), matrix = path.getScreenCTM();
      if (!matrix) continue;
      for (let i = 0; i < limit / paths.length; i++) {
        const point = path.getPointAtLength(length * i / Math.ceil(limit / paths.length)).matrixTransform(matrix);
        points.push({ x: point.x, y: point.y });
      }
    }
  } else if (text?.trim()) {
    const scale = Math.min(1, 600 / Math.max(1, rect.width));
    canvas.width = Math.max(1, Math.ceil(rect.width * scale));
    canvas.height = Math.max(1, Math.ceil(rect.height * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const style = getComputedStyle(node);
    ctx.scale(scale, scale);
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.letterSpacing = style.letterSpacing;
    ctx.textBaseline = 'middle';
    ctx.fillText(text.trim(), 0, rect.height / 2);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let y = 1; y < canvas.height; y += 2) for (let x = 1; x < canvas.width; x += 2) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 100) points.push({ x: rect.left + x / scale, y: rect.top + y / scale });
    }
  }
  if (!points.length) for (let i = 0; i < 24; i++) {
    const a = i * Math.PI * 2 / 24;
    points.push({ x: rect.left + rect.width * (0.5 + Math.cos(a) * 0.45), y: rect.top + rect.height * (0.5 + Math.sin(a) * 0.45) });
  }
  const count = Math.min(limit, points.length);
  return Array.from({ length: count }, (_, i) => ({ ...points[Math.floor(i * points.length / count)], seed: (i * 73 % 127) / 127 }));
}
