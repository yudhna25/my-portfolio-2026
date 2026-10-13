import { BufferGeometry, Float32BufferAttribute } from 'three';

// Sample the existing cutout; transparent pixels never become a rectangular star field.
export function buildPortraitGeometry(pixels, width, height) {
  const positions = [], tones = [], seeds = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (pixels[i + 3] < 64) continue;
    const seed = Math.sin((y * width + x + 1) * 12.9898) * 43758.5453;
    const random = seed - Math.floor(seed);
    positions.push((x + 0.5 + (random - 0.5) * 0.8) / width - 0.5,
      0.5 - (y + 0.5 + ((random * 37.13 % 1) - 0.5) * 0.8) / height, 0);
    tones.push((0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) / 255);
    seeds.push(random);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aTone', new Float32BufferAttribute(tones, 1));
  geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
  return geometry;
}
