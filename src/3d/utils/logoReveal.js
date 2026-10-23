import marks from '@/3d/data/logoMarks.json';

// Outline loops per logo mark, in mark units (longest side spans 2, y up). Built by outputs/redesign/r5-skills-logo.
export const LOGO_LOOPS = Object.fromEntries(Object.entries(marks).map(([id, mark]) => [id, mark.loops.map(flat => {
  const loop = [];
  for (let i = 0; i < flat.length; i += 2) loop.push([flat[i] / 1000, flat[i + 1] / 1000]);
  return loop;
})]));

const clamp = value => Math.max(0, Math.min(1, value));
export const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };

// One beat, in seconds after the hover: the band reaches the logo, engraves its outline, flows on to the
// abilities; the inside darkens into an eclipse and the corona flares from the point where the band closed.
const IN = 0.1, RIM = 0.4, OUT = 0.55;
export const U_RIM = 0.2, U_OUT = 0.75;
export function logoBeat(t) {
  const head = t < IN ? U_RIM * t / IN : t < RIM ? U_RIM + (U_OUT - U_RIM) * (t - IN) / (RIM - IN)
    : U_OUT + (1 - U_OUT) * clamp((t - RIM) / (OUT - RIM));
  const settle = smooth((t - OUT) / 0.4);
  return {
    head,
    silhouette: smooth((t - 0.3) / 0.2),
    corona: smooth((t - 0.36) / 0.3),
    bead: Math.exp(-((t - RIM - 0.03) ** 2) / 0.006),
    link: 1 - 0.65 * settle,
    bridge: 1 - settle,
    rim: 1 - 0.45 * settle,
    pulse: settle,
  };
}
export function leaveBeat(t) {
  return { tail: smooth(t / 0.3), fade: 1 - smooth((t - 0.08) / 0.22), logo: 1 - smooth(t / 0.25) };
}

export function partPlacement(target, part, phase) {
  const ai = target.id === 'ai', angle = phase + part * Math.PI * 2 / 3;
  return { x: ai ? Math.cos(angle) * 0.68 : 0, y: ai ? Math.sin(angle) * 0.68 : 0, scale: ai ? 0.42 : 0.9 };
}

// Ribbon points with an arc parameter u: link in [0, U_RIM], outline and bridges [U_RIM, U_OUT], each fan [U_OUT, 1].
// kind: 0 link, 1 outline, 2 bridge between loops, 3 fan to an ability. A point with `start` begins a new stroke.
export function bandPoints(target, phase, route, out) {
  out.length = 0;
  const push = (x, y, kind, start = false) => out.push({ x, y, u: 0, kind, start });
  const curve = (a, b, c, d, kind, n) => { for (let i = 1; i <= n; i++) { const t = i / n, m = 1 - t;
    push(m ** 3 * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t ** 3 * d[0],
      m ** 3 * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t ** 3 * d[1], kind); } };
  const loops = [];
  target.parts.forEach((logo, part) => {
    const { x, y, scale } = partPlacement(target, part, phase);
    for (const loop of LOGO_LOOPS[logo.id] ?? []) loops.push(loop.map(p => [p[0] * scale + x, p[1] * scale + y]));
  });
  loops.sort((a, b) => a[0][0] - b[0][0]);
  if (!loops.length) return out;
  const from = route?.from ?? [-2.6, 0.2], first = loops[0][0];
  push(from[0], from[1], 0, true);
  curve(from, [(from[0] + first[0]) / 2, from[1]], [(from[0] + first[0]) / 2, first[1]], first, 0, 36);
  const linkEnd = out.length;
  loops.forEach((loop, i) => {
    const start = loop[0];
    if (i) {
      // A gentle arc over to the next loop; it fades once the outline is engraved.
      const prev = out[out.length - 1], dx = start[0] - prev.x, dy = start[1] - prev.y, bend = 0.18;
      curve([prev.x, prev.y], [prev.x + dx / 3 - dy * bend, prev.y + dy / 3 + dx * bend],
        [prev.x + dx * 2 / 3 - dy * bend, prev.y + dy * 2 / 3 + dx * bend], start, 2, 18);
    }
    for (let j = 1; j <= loop.length; j++) { const p = loop[j % loop.length]; push(p[0], p[1], 1); }
  });
  const rimEnd = out.length;
  let edge = loops[0][0];
  for (const loop of loops) for (const p of loop) if (p[0] > edge[0]) edge = p;
  const fans = [];
  for (const to of route?.to ?? []) {
    const begin = out.length;
    push(edge[0], edge[1], 3, true);
    curve(edge, [(edge[0] + to[0]) / 2, edge[1]], [(edge[0] + to[0]) / 2, to[1]], to, 3, 36);
    fans.push([begin, out.length]);
  }
  const param = (begin, end, u0, u1) => {
    let length = 0;
    for (let i = begin + 1; i < end; i++) length += Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y);
    let run = 0;
    out[begin].u = u0;
    for (let i = begin + 1; i < end; i++) {
      run += Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y);
      out[i].u = u0 + (u1 - u0) * run / Math.max(length, 1e-6);
    }
  };
  param(0, linkEnd, 0, U_RIM);
  param(linkEnd - 1, rimEnd, U_RIM, U_OUT);
  fans.forEach(([begin, end]) => param(begin, end, U_OUT, 1));
  out.end = loops[loops.length - 1][0];
  return out;
}

// Signed distance to the logo mark, in mark units, packed into a byte texture.
export const SDF_RANGE = 0.6;
export function logoDistance(image, logo, size = 192) {
  const longest = Math.max(logo.width, logo.height);
  const width = Math.max(8, Math.round(size * logo.width / longest)), height = Math.max(8, Math.round(size * logo.height / longest));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const inside = new Uint8Array(width * height);
  for (let i = 0; i < inside.length; i++) inside[i] = pixels[i * 4 + 3] > 127 ? 1 : 0;
  const chamfer = wanted => {
    const d = new Float32Array(width * height);
    for (let i = 0; i < d.length; i++) d[i] = inside[i] === wanted ? 0 : 1e6;
    const pass = (x, y, dx, dy, cost) => {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
      const i = y * width + x, j = ny * width + nx;
      if (d[j] + cost < d[i]) d[i] = d[j] + cost;
    };
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      pass(x, y, -1, 0, 1); pass(x, y, 0, -1, 1); pass(x, y, -1, -1, 1.4142); pass(x, y, 1, -1, 1.4142);
    }
    for (let y = height - 1; y >= 0; y--) for (let x = width - 1; x >= 0; x--) {
      pass(x, y, 1, 0, 1); pass(x, y, 0, 1, 1); pass(x, y, 1, 1, 1.4142); pass(x, y, -1, 1, 1.4142);
    }
    return d;
  };
  const toInside = chamfer(1), toOutside = chamfer(0), unit = 2 / size;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    // Canvas rows run top-down; textures sample bottom-up.
    const i = y * width + x, o = ((height - 1 - y) * width + x) * 4;
    const signed = (inside[i] ? -(toOutside[i] - 0.5) : toInside[i] - 0.5) * unit;
    data[o] = Math.round(Math.max(0, Math.min(1, 0.5 + 0.5 * signed / SDF_RANGE)) * 255);
    data[o + 3] = 255;
  }
  return { data, width, height };
}
