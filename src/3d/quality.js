export const QUALITY = Object.freeze({ high: 24000, medium: 12000, low: 1500 });

export const RAY_QUALITY = Object.freeze({
  high: { steps: 192, step: 0.09, octaves: 4, crossings: 3 },
  medium: { steps: 160, step: 0.11, octaves: 3, crossings: 3 },
  low: { steps: 128, step: 0.14, octaves: 2, crossings: 2 },
});

// Resolution of the HDR black-hole ray pass, as a fraction of the drawing buffer.
// Floor 0.7: at 0.5 the photon-ring edge visibly stair-steps in Contact.
// Written only by AdaptiveQuality: it stays 1 unless the GPU cannot hold the frame rate.
export const RAY_SCALE_LEVELS = Object.freeze([1, 0.85, 0.7]);
export const renderBudget = { ray: 1, level: 0 };
