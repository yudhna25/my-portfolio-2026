import { clampStoryProgress } from './cameraPath.js';

export const portalSmooth = (a, b, value) => {
  const t = clampStoryProgress((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function portalProgress(chapter, progress, frozen = false) {
  return chapter === 'hero' ? 0 : chapter === 'portal' ? frozen ? 1 : clampStoryProgress(progress) : 1;
}

// Einstein–Rosen bridge. The Hero leans back into a sheet of spacetime that sinks into a
// funnel at the O; the camera plunges down its spinning throat, flies through the far
// mouth's ring of light, and About unwinds back out of the hole into its place.
export function portalState(progress, out = {}) {
  const p = clampStoryProgress(progress);
  // The sheet replaces the live Hero from the first scrolled pixel.
  out.sheet = p > 0 ? 1 - portalSmooth(0.42, 0.47, p) : 0;
  out.cover = portalSmooth(0, 0.05, p) * (1 - portalSmooth(0.64, 0.66, p));
  out.tilt = 0.14 * portalSmooth(0.02, 0.22, p) * (1 - portalSmooth(0.28, 0.42, p));
  out.depth = portalSmooth(0.04, 0.30, p);
  out.slide = portalSmooth(0.06, 0.42, p);
  const dive = portalSmooth(0.20, 0.47, p);
  out.dolly = dive * dive;
  out.pan = portalSmooth(0.03, 0.30, p);
  // The plunge: starlight and nebular gas wound into a spiral by the spinning throat, and
  // ahead the far mouth's photon ring, a window onto the other side.
  out.warp = portalSmooth(0.40, 0.45, p) * (1 - portalSmooth(0.63, 0.66, p));
  out.speed = portalSmooth(0.42, 0.58, p);
  out.drift = portalSmooth(0.46, 0.56, p);
  // We fly through the ring: it sweeps past the frame and leaves the About sky inside it.
  out.pass = portalSmooth(0.555, 0.645, p);
  out.ring = portalSmooth(0.42, 0.50, p) * (1 - portalSmooth(0.62, 0.66, p));
  out.reveal = portalSmooth(0.60, 0.64, p);
  // Looking back, the mouth unwinds what fell in: About rides spiral ribbons into place.
  out.emerge = 1 - portalSmooth(0.61, 0.88, p);
  out.outflow = portalSmooth(0.60, 0.63, p) * (1 - portalSmooth(0.88, 0.93, p));
  out.ribbon = portalSmooth(0.60, 0.66, p) * (1 - portalSmooth(0.80, 0.92, p));
  out.aboutText = portalSmooth(0.87, 0.92, p);
  out.lit = portalSmooth(0.80, 0.95, p);
  out.bridge = p > 0 && p < 1;
  // The exterior observer is rebased inside the throat, while the tunnel hides the hole.
  out.mini = p < 0.5 ? 1 : 0;
  out.visibility = p < 0.5 ? 1 - portalSmooth(0.39, 0.45, p) : portalSmooth(0.60, 0.66, p);
  out.backdrop = p < 0.06 || p > 0.55;
  out.heroOpacity = p > 0 ? 0 : 1;
  out.aboutOpacity = p > 0.58 ? 1 : 0;
  out.aboutInteractive = p >= 0.9;
  out.controlsOpacity = p < 0.5 ? 1 - portalSmooth(0, 0.05, p) : portalSmooth(0.90, 0.96, p);
  out.controlsInteractive = p === 0 || p >= 0.96;
  // The backdrop keeps its own shape; the bridge carries all of the motion.
  out.intake = 0;
  out.eject = 1;
  out.center = 0;
  return out;
}

// Pixel-space camera over the sheet, shared by the scene and the DOM so both agree on
// where the throat is. Sheet points are relative to the O; z points away from the viewer.
export function bridgeCamera(phase, anchor, width, height, out = {}) {
  const ox = anchor ? anchor.left + anchor.width / 2 : width * 0.75;
  const oy = anchor ? anchor.top + anchor.height / 2 : height * 0.4;
  out.originX = ox; out.originY = oy;
  out.pivotX = ox + (width * 0.5 - ox) * phase.pan;
  out.pivotY = oy + (height * 0.56 - oy) * phase.pan;
  out.focal = height * 1.1;
  // Past the rim the camera is inside the funnel, looking down its throat.
  out.distance = out.focal * (1 - 1.9 * phase.dolly);
  out.depth = phase.depth * height * 2.2;
  out.throat = height * 0.08;
  out.tilt = phase.tilt;
  out.cos = Math.cos(phase.tilt); out.sin = Math.sin(phase.tilt);
  // Tilting swings the deep throat down the screen; lift the sheet halfway so neither the
  // throat nor the rim leaves the frame.
  out.lift = out.depth * out.sin * 0.5;
  return out;
}

export function bridgeDepth(camera, r) {
  return camera.depth * Math.pow(camera.throat / (r + camera.throat), 1.3);
}

export function bridgeProject(camera, x, y, out = {}) {
  const z = bridgeDepth(camera, Math.hypot(x, y));
  const ry = y * camera.cos + z * camera.sin - camera.lift, rz = -y * camera.sin + z * camera.cos;
  const w = (camera.distance + rz) / camera.focal;
  out.w = w;
  out.x = camera.pivotX + x / Math.max(w, 0.0001);
  out.y = camera.pivotY + ry / Math.max(w, 0.0001);
  return out;
}
