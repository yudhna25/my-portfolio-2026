export const QUALITY = Object.freeze({ high: 24000, medium: 12000, low: 1500 });

export const RAY_QUALITY = Object.freeze({
  high: { steps: 192, step: 0.09, resolution: 0.85, maxResolution: 1280 },
  medium: { steps: 160, step: 0.11, resolution: 0.8, maxResolution: 1024 },
  low: { steps: 128, step: 0.14, resolution: 0.75, maxResolution: 768 },
});
