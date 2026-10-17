import { CanvasTexture, LinearFilter, RepeatWrapping, SRGBColorSpace } from 'three';

// The open project's name as one seamless strip, wrapped around the lens by its shader.
export function createRingText() {
  const canvas = document.createElement('canvas');
  canvas.width = 4096; canvas.height = 192;
  const context = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;
  let current = '';
  return {
    texture,
    update(text) {
      if (text === current) return;
      current = text;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (!text) { texture.needsUpdate = true; return; }
      context.font = `700 120px 'Unbounded Variable', 'Unbounded', sans-serif`;
      context.textBaseline = 'middle';
      context.fillStyle = '#FFFFFF';
      const unit = context.measureText(text).width;
      // Whole repeats only, stretched to the strip, so the seam never shows.
      const repeats = Math.max(1, Math.round(canvas.width / unit));
      context.save();
      context.scale(canvas.width / (unit * repeats), 1);
      for (let i = 0; i < repeats; i++) context.fillText(text, i * unit, canvas.height / 2);
      context.restore();
      texture.needsUpdate = true;
    },
    dispose() { texture.dispose(); },
  };
}
