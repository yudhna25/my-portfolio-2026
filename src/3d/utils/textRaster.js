import { CanvasTexture, LinearFilter } from 'three';

// Rasterizes the visible text and images under the matching nodes at their measured screen
// positions, so a shader can carry them and hand them back to the DOM in place.
export function createTextRaster(selector) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  const range = document.createRange();
  let key = '';

  const update = (width, height, dpr) => {
    const roots = [...document.querySelectorAll(selector)];
    if (!roots.length || !width || !height) return false;
    const boxes = roots.map(node => node.getBoundingClientRect());
    const images = roots.flatMap(node => [...node.querySelectorAll('img')]);
    const loaded = images.filter(image => image.complete && image.naturalWidth).length;
    const next = `${width}x${height}@${dpr}:${document.documentElement.lang}:${document.fonts?.status}:${loaded}:`
      + boxes.map(box => `${Math.round(box.left)},${Math.round(box.top)},${Math.round(box.width)},${Math.round(box.height)}`).join(';');
    if (next === key) return true;
    key = next;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    images.forEach(image => {
      if (!image.complete || !image.naturalWidth) return;
      const box = image.getBoundingClientRect();
      // object-contain: fit the picture inside its box without cropping.
      const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
      const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
      context.drawImage(image, box.left + (box.width - w) / 2, box.top + (box.height - h) / 2, w, h);
    });
    context.textBaseline = 'middle';
    roots.forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        const parent = text.parentElement;
        // Layout twins and screen-reader copies are not what the eye sees.
        if (!parent || parent.closest('.invisible, .sr-only')) continue;
        const style = getComputedStyle(parent);
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        context.fillStyle = style.color;
        context.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
        const upper = style.textTransform === 'uppercase';
        for (const match of text.textContent.matchAll(/\S+/g)) {
          range.setStart(text, match.index);
          range.setEnd(text, match.index + match[0].length);
          const box = range.getBoundingClientRect();
          if (box.width > 1 && box.height > 1 && box.bottom > 0 && box.top < height) {
            context.fillText(upper ? match[0].toUpperCase() : match[0], box.left, box.top + box.height / 2);
          }
        }
      }
    });
    context.letterSpacing = '0px';
    texture.needsUpdate = true;
    return true;
  };

  return { texture, update, dispose: () => texture.dispose() };
}
