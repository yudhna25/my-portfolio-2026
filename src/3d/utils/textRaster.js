import { CanvasTexture, LinearFilter } from 'three';

// Rasterizes the visible text under the matching nodes, word by word at its measured
// screen position, so a shader can carry it and hand it back to the DOM in place.
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
    const next = `${width}x${height}@${dpr}:${document.documentElement.lang}:${document.fonts?.status}:`
      + boxes.map(box => `${Math.round(box.left)},${Math.round(box.top)},${Math.round(box.width)},${Math.round(box.height)}`).join(';');
    if (next === key) return true;
    key = next;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.textBaseline = 'middle';
    roots.forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        const parent = text.parentElement;
        // Layout twins and screen-reader copies are not what the eye sees.
        if (!parent || parent.closest('.invisible, .sr-only, [data-portrait], figure')) continue;
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
