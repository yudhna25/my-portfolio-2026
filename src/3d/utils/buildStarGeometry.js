import { BufferAttribute, BufferGeometry } from 'three';

// Called only when a StarField is mounted or its count changes, never per frame.
//
// Uniform directions on a distant shell. StarField moves its center with the
// observer: distant stars do not rush toward a vanishing point during travel.
export function buildStarGeometry(count) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const MIN_R = 280;
  const MAX_R = 340;

  for (let i = 0; i < count; i++) {
    // Uniform direction on the sphere
    const u = Math.random() * 2 - 1; // cos(theta)
    const phi = Math.random() * Math.PI * 2;
    const r = MIN_R + (MAX_R - MIN_R) * Math.random();
    const sinTheta = Math.sqrt(1 - u * u);
    positions[i * 3] = r * sinTheta * Math.cos(phi);
    positions[i * 3 + 1] = r * sinTheta * Math.sin(phi);
    positions[i * 3 + 2] = r * u;

    // Real-star size mix: mostly tiny pinpoints, a few brighter, rare large.
    const roll = Math.random();
    if (roll < 0.82) sizes[i] = 0.8 + Math.random() * 0.4; // 82% tiny
    else if (roll < 0.97) sizes[i] = 1.25 + Math.random() * 0.6; // 15% medium
    else sizes[i] = 2.0 + Math.random(); // 3% bright; sizes are CSS pixels
    seeds[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  return geometry;
}
