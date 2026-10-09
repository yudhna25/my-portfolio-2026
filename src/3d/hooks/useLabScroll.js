import { useScrollProgress } from '@/3d/hooks/useScrollProgress';

// Lab and App each mount this same bridge once; manual mode pauses its producer.
export function useLabScroll(options) {
  return useScrollProgress(options);
}
