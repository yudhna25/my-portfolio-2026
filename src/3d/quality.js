export const QUALITY = Object.freeze({ high: 24000, medium: 12000, low: 1500 });

export const RAY_QUALITY = Object.freeze({
  high: { steps: 192, step: 0.09, octaves: 4, crossings: 3 },
  medium: { steps: 160, step: 0.11, octaves: 3, crossings: 3 },
  low: { steps: 128, step: 0.14, octaves: 2, crossings: 2 },
});
