// Per-frame camera response shared with the sky shaders. CameraRig writes it first each
// frame; StarField reads it. Time- and velocity-driven, so it never feeds the pure story
// path that world-placed DOM companions (comet, Works figures) are solved against.
export const cameraMotion = { speed: 0, direction: 0, defocus: 0 };

const smooth = (a, b, value) => {
  const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// About rack focus: the sky falls out of focus while the portrait is read, then returns.
export function aboutDefocus(chapter, progress) {
  return chapter === 'about' ? smooth(0.0, 0.3, progress) * (1 - smooth(0.7, 1.0, progress)) : 0;
}

// Chapters whose DOM companions follow the live camera, so FOV and roll can react to speed.
export const VELOCITY_CHAPTERS = { about: 1, skills: 1, education: 1 };
