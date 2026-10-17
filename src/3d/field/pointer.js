// One window-level pointer shared by every gravity-field consumer. The Canvas never
// receives pointer events (it sits under the DOM), so the field listens on window.
const pointer = {
  x: 0.5, y: 0.5, // viewport uv, y up
  inside: false,
  touch: false,
  down: false,
  moved: 0, // performance.now() of the last movement
};

let users = 0;

const write = (event) => {
  pointer.x = event.clientX / Math.max(1, window.innerWidth);
  pointer.y = 1 - event.clientY / Math.max(1, window.innerHeight);
  pointer.touch = event.pointerType === 'touch';
  pointer.moved = performance.now();
};
const move = (event) => { write(event); pointer.inside = true; };
const press = (event) => { write(event); pointer.down = true; pointer.inside = true; };
const release = () => { pointer.down = false; };
const leave = () => { pointer.inside = false; pointer.down = false; };
const visibility = () => { if (document.hidden) leave(); };

export function retainPointer() {
  if (users++ === 0 && typeof window !== 'undefined') {
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', press, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', leave, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    document.addEventListener('visibilitychange', visibility);
  }
  return pointer;
}

export function releasePointer() {
  if (--users === 0 && typeof window !== 'undefined') {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerdown', press);
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', leave);
    document.documentElement.removeEventListener('pointerleave', leave);
    window.removeEventListener('blur', leave);
    document.removeEventListener('visibilitychange', visibility);
  }
}

// Mouse: present while inside the window. Touch: only while a finger is held,
// so a phone "presses and holds" to open the hidden spectrum.
export const pointerPresent = () => pointer.inside && (!pointer.touch || pointer.down);
