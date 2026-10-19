import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap, useGSAPSetup } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useLangStore } from '@/stores/useLangStore';
import '@/styles/gate.css';

const LANGS = ['vi', 'en'];
// Warm and cool members of the pair; the survivor cools to the First Light's white.
const TINTS = [[255, 206, 150], [196, 216, 255]];
const FIRST_LIGHT = [255, 246, 232];
const mix = (a, b, t) => a.map((value, i) => value + (b[i] - value) * t);
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, a)})`;
const quad = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

function layout(width, height) {
  const portrait = width < 640 || height > width * 1.2;
  const half = portrait ? Math.min(height * 0.13, 130) : Math.min(width * 0.19, 280);
  const cx = width / 2, cy = portrait ? height * 0.54 : height * 0.53;
  return {
    portrait,
    stars: portrait ? [{ x: cx, y: cy - half }, { x: cx, y: cy + half }] : [{ x: cx - half, y: cy }, { x: cx + half, y: cy }],
    radius: portrait ? 4.2 : 5,
  };
}

function preferredIndex() {
  const languages = typeof navigator === 'undefined' ? [] : navigator.languages || [navigator.language];
  const first = languages.find(language => /^(vi|en)\b/i.test(language || ''));
  return first && /^en/i.test(first) ? 1 : 0;
}

function anchorPoint(width, height) {
  const rect = document.querySelector('[data-story-anchor="portal"]')?.getBoundingClientRect();
  return rect?.height ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: width * 0.75, y: height * 0.2 };
}

// A binary pair, one star per language. The chosen star drains its companion through
// their shared bridge of light, then glides into the last O and becomes the First Light.
export function LanguageGate({ opening, loading, onArrive, onDone }) {
  const root = useRef(null), canvas = useRef(null);
  const buttons = useRef([]), labels = useRef([]), prompt = useRef(null);
  const live = useRef({ loading, onArrive, onDone });
  const reduced = useReducedMotion();
  const setLang = useLangStore(state => state.setLang);
  const { t } = useTranslation();
  useLayoutEffect(() => { live.current = { loading, onArrive, onDone }; }, [loading, onArrive, onDone]);

  useGSAPSetup((context, contextSafe) => {
    const stage = root.current, context2d = canvas.current.getContext('2d');
    const s = { intro: reduced ? 1 : 0, text: reduced ? 1 : 0, hover: [0, 0], target: -1, chosen: -1, absorb: 0, flight: 0, fade: 0, from: null, to: null };
    let width = 0, height = 0, ratio = 1, geometry, field = [], pointer = { x: 0, y: 0 }, leaving = false;
    const start = performance.now();

    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth; height = window.innerHeight;
      canvas.current.width = Math.round(width * ratio); canvas.current.height = Math.round(height * ratio);
      geometry = layout(width, height);
      const count = Math.round(Math.min(260, width * height / 5200));
      let seed = 7;
      const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      field = Array.from({ length: count }, () => ({ x: random(), y: random(), r: 0.3 + random() ** 3 * 1.1, phase: random() * 6.28, speed: 0.4 + random() * 1.4, depth: 0.3 + random() * 0.7 }));
      if (s.to) s.to = anchorPoint(width, height);
    };

    const starAt = (index, time) => {
      const base = geometry.stars[index];
      // Both members orbit a shared barycentre; the wobble stops once one is chosen.
      const calm = reduced ? 0 : 1 - Math.min(1, s.absorb * 2);
      const angle = time * 0.39 + index * Math.PI;
      let x = base.x + Math.cos(angle) * 9 * calm, y = base.y + Math.sin(angle) * 5 * calm;
      if (index === s.chosen && s.from) {
        const control = { x: (s.from.x + s.to.x) / 2, y: Math.min(s.from.y, s.to.y) - Math.min(width, height) * 0.16 };
        x = quad(s.from.x, control.x, s.to.x, s.flight); y = quad(s.from.y, control.y, s.to.y, s.flight);
      } else if (s.chosen >= 0 && index !== s.chosen) {
        const winner = geometry.stars[s.chosen], pull = 0.22 * s.absorb * s.absorb;
        x += (winner.x - x) * pull; y += (winner.y - y) * pull;
      }
      return { x, y };
    };

    const drawStar = (x, y, r, color, intensity, spike) => {
      if (intensity <= 0.002) return;
      const halo = r * (9 + 5 * intensity);
      const glow = context2d.createRadialGradient(x, y, 0, x, y, halo);
      glow.addColorStop(0, rgba(color, 0.7 * intensity));
      glow.addColorStop(0.07, rgba(color, 0.32 * intensity));
      glow.addColorStop(0.3, rgba(color, 0.07 * intensity));
      glow.addColorStop(1, rgba(color, 0));
      context2d.fillStyle = glow;
      context2d.fillRect(x - halo, y - halo, halo * 2, halo * 2);
      const length = r * 9 * spike;
      if (length > 1) for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const ray = context2d.createLinearGradient(x - dx * length, y - dy * length, x + dx * length, y + dy * length);
        ray.addColorStop(0, rgba(color, 0)); ray.addColorStop(0.5, rgba(color, 0.55 * intensity)); ray.addColorStop(1, rgba(color, 0));
        context2d.fillStyle = ray;
        context2d.fillRect(x - dx * length - dy * 0.6, y - dy * length - dx * 0.6, dx * length * 2 + dy * 1.2, dy * length * 2 + dx * 1.2);
      }
      context2d.fillStyle = rgba(mix(color, [255, 255, 255], 0.7), Math.min(1, intensity));
      context2d.beginPath(); context2d.arc(x, y, r * 0.55, 0, Math.PI * 2); context2d.fill();
    };

    // One continuous band of light between the pair, tapered at both ends.
    const drawBridge = (a, b, time) => {
      const leanTo = s.chosen >= 0 ? s.chosen : s.hover[0] > s.hover[1] ? 0 : 1;
      const lean = s.chosen >= 0 ? 1 : Math.abs(s.hover[0] - s.hover[1]);
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || 1;
      const nx = -dy / distance, ny = dx / distance;
      const sag = distance * (0.1 + 0.02 * Math.sin(time * 0.7)) * (1 - s.absorb * 0.6);
      const shift = (leanTo === 0 ? -1 : 1) * lean * 0.18;
      const control = { x: a.x + dx * (0.5 + shift) + nx * sag, y: a.y + dy * (0.5 + shift) + ny * sag };
      const drain = s.chosen < 0 ? 0 : s.absorb ** 1.6;
      const strength = s.intro * (0.16 + 0.12 * lean) + (s.chosen >= 0 ? Math.sin(Math.PI * Math.min(1, s.absorb * 1.15)) * 0.75 : 0);
      if (strength <= 0.003) return;
      const steps = 56, left = [], right = [];
      // Drain from the loser's end toward the winner's.
      const loserFirst = s.chosen === 1;
      const from = loserFirst ? drain : 0, to = loserFirst ? 1 : 1 - drain;
      for (let i = 0; i <= steps; i++) {
        const u = from + (to - from) * (i / steps);
        const x = quad(a.x, control.x, b.x, u), y = quad(a.y, control.y, b.y, u);
        const tx = 2 * (1 - u) * (control.x - a.x) + 2 * u * (b.x - control.x), ty = 2 * (1 - u) * (control.y - a.y) + 2 * u * (b.y - control.y);
        const tl = Math.hypot(tx, ty) || 1, w = 1.1 + 2.6 * Math.sin(Math.PI * u) * (1 + s.absorb);
        left.push([x - ty / tl * w, y + tx / tl * w]); right.push([x + ty / tl * w, y - tx / tl * w]);
      }
      const band = new Path2D();
      band.moveTo(...left[0]); left.forEach(point => band.lineTo(...point));
      right.reverse().forEach(point => band.lineTo(...point)); band.closePath();
      const gradient = context2d.createLinearGradient(a.x, a.y, b.x, b.y);
      const ca = TINTS[0], cb = TINTS[1];
      // Light travels toward the survivor: a slow crest while idle, a strong current when chosen.
      const flowSpeed = s.chosen >= 0 ? 1.4 : 0.12;
      const crest = ((time * flowSpeed) % 1 + 1) % 1, head = s.chosen === 0 || (s.chosen < 0 && leanTo === 0) ? 1 - crest : crest;
      for (let i = 0; i <= 10; i++) {
        const u = i / 10, near = Math.max(0, 1 - Math.abs(u - head) * 4);
        gradient.addColorStop(u, rgba(mix(ca, cb, u), strength * (0.35 + 0.65 * near)));
      }
      context2d.save();
      context2d.filter = 'blur(5px)'; context2d.fillStyle = gradient; context2d.fill(band);
      context2d.filter = 'none'; context2d.globalAlpha = 0.8; context2d.fill(band);
      context2d.restore();
    };

    const draw = () => {
      const time = (performance.now() - start) / 1000;
      const motion = reduced ? 0 : 1;
      for (let i = 0; i < 2; i++) {
        const target = s.chosen >= 0 ? 0 : s.target === i ? 1 : 0;
        s.hover[i] += (target - s.hover[i]) * (reduced ? 1 : 0.12);
      }
      context2d.setTransform(ratio, 0, 0, ratio, 0, 0);
      context2d.globalCompositeOperation = 'source-over';
      context2d.fillStyle = '#07080D'; context2d.fillRect(0, 0, width, height);
      context2d.globalCompositeOperation = 'lighter';
      const px = (pointer.x / (width || 1) - 0.5) * 10 * motion, py = (pointer.y / (height || 1) - 0.5) * 8 * motion;
      for (const star of field) {
        const twinkle = motion ? 0.55 + 0.45 * Math.sin(time * star.speed + star.phase) : 0.8;
        context2d.fillStyle = rgba([226, 228, 240], 0.7 * twinkle * s.intro * (1 - 0.4 * s.flight));
        context2d.fillRect(star.x * width - px * star.depth, star.y * height - py * star.depth, star.r, star.r);
      }
      const a = starAt(0, time * motion), b = starAt(1, time * motion);
      if (s.flight < 0.35) {
        context2d.save(); context2d.globalAlpha = 1 - s.flight / 0.35; drawBridge(a, b, time); context2d.restore();
      }
      for (let i = 0; i < 2; i++) {
        const { x, y } = i === 0 ? a : b;
        const twinkle = motion ? 0.93 + 0.07 * Math.sin(time * 2.1 + i * 2.4) : 1;
        let intensity = s.intro * twinkle * (0.85 + 0.35 * s.hover[i]), r = geometry.radius * (1 + 0.25 * s.hover[i]), spike = 0.35 + 0.35 * s.hover[i];
        let color = TINTS[i];
        if (s.chosen === i) {
          intensity *= 1 + 0.7 * s.absorb - 0.55 * s.flight;
          r = geometry.radius * (1 + 0.35 * s.absorb) * (1 - 0.5 * s.flight);
          spike = 0.5 + 0.5 * s.flight;
          color = mix(TINTS[i], FIRST_LIGHT, s.flight);
        } else if (s.chosen >= 0) {
          intensity *= 1 - s.absorb;
          r *= 1 - 0.6 * s.absorb;
        }
        drawStar(x, y, r, color, intensity, spike);
      }
      // Labels ride with their stars.
      for (let i = 0; i < 2; i++) {
        const point = i === 0 ? a : b, button = buttons.current[i];
        if (!button) continue;
        button.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -3rem)`;
        const label = labels.current[i];
        label.style.opacity = String(s.text * (0.72 + 0.28 * s.hover[i]));
        label.style.filter = s.chosen >= 0 ? `blur(${(1 - s.text) * 6}px)` : 'none';
      }
      prompt.current.style.opacity = String(s.text * 0.9);
      prompt.current.style.top = `${geometry.portrait ? geometry.stars[0].y - Math.min(height * 0.16, 150) : geometry.stars[0].y - Math.min(height * 0.24, 210)}px`;
      stage.style.opacity = String(1 - s.fade);
    };

    const finish = () => {
      if (leaving) return;
      leaving = true;
      gsap.to(s, { fade: 1, duration: reduced ? 0.25 : 0.5, ease: 'power1.inOut', onComplete: () => live.current.onDone?.() });
    };
    // Hold the arrived star until the preloader's own First Light has taken over the O.
    const watch = () => {
      draw();
      if (s.flight >= 1 || (reduced && s.chosen >= 0)) {
        const takenOver = (opening?.current.active && opening.current.p > 0.0005) || !live.current.loading;
        if (takenOver) finish();
      }
    };

    const choose = contextSafe(index => {
      if (s.chosen >= 0) return;
      s.chosen = index;
      stage.setAttribute('aria-busy', 'true');
      stage.dataset.chosen = LANGS[index];
      setLang(LANGS[index]);
      if (reduced) { s.text = 0; live.current.onArrive?.(); return; }
      gsap.timeline()
        .to(s, { text: 0, duration: 0.7, ease: 'power2.in' }, 0)
        .to(s, { absorb: 1, duration: 1.15, ease: 'power2.inOut' }, 0)
        .add(() => {
          s.from = starAt(index, (performance.now() - start) / 1000);
          s.to = anchorPoint(width, height);
        }, 0.85)
        .to(s, { flight: 1, duration: 1.45, ease: 'power3.inOut' }, 0.85)
        .add(() => live.current.onArrive?.());
    });

    const onKey = event => {
      if (s.chosen >= 0) { if (event.key === 'Tab') event.preventDefault(); return; }
      const current = buttons.current.indexOf(document.activeElement);
      const next = { ArrowLeft: 0, ArrowUp: 0, ArrowRight: 1, ArrowDown: 1, Home: 0, End: 1 }[event.key];
      if (event.key === 'Tab') { event.preventDefault(); buttons.current[current === 0 ? 1 : 0]?.focus(); return; }
      if (next !== undefined) { event.preventDefault(); buttons.current[next]?.focus(); }
    };
    const onMove = event => { pointer = { x: event.clientX, y: event.clientY }; };
    const handlers = buttons.current.map((button, index) => {
      const enter = () => { if (s.chosen < 0) s.target = index; };
      const leave = () => { if (s.chosen < 0) s.target = buttons.current.indexOf(document.activeElement); };
      const click = () => choose(index);
      button.addEventListener('pointerenter', enter); button.addEventListener('focus', enter);
      button.addEventListener('pointerleave', leave); button.addEventListener('blur', leave);
      button.addEventListener('click', click);
      return () => {
        button.removeEventListener('pointerenter', enter); button.removeEventListener('focus', enter);
        button.removeEventListener('pointerleave', leave); button.removeEventListener('blur', leave);
        button.removeEventListener('click', click);
      };
    });

    resize();
    pointer = { x: width / 2, y: height / 2 };
    stage.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    buttons.current[preferredIndex()]?.focus({ preventScroll: true });
    if (!reduced) gsap.timeline({ delay: 0.15 })
      .to(s, { intro: 1, duration: 1.6, ease: 'power2.out' })
      .to(s, { text: 1, duration: 1.1, ease: 'power2.out' }, 0.6);
    gsap.ticker.add(watch);
    return () => {
      gsap.ticker.remove(watch);
      handlers.forEach(remove => remove());
      stage.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  const option = (lng, index) => (
    <button key={lng} ref={node => { buttons.current[index] = node; }} type="button" lang={lng}
      className="language-gate__option" data-gate-option={lng}>
      <span ref={node => { labels.current[index] = node; }} className="language-gate__label">
        <span className="language-gate__name">{t('gate.option', { lng })}</span>
        <span className="language-gate__depart" aria-hidden="true">{t('gate.depart', { lng })}</span>
      </span>
    </button>
  );

  return <div ref={root} role="dialog" aria-modal="true" aria-labelledby="language-gate-prompt"
    className="language-gate" data-language-gate>
    <canvas ref={canvas} className="language-gate__sky" aria-hidden="true" />
    <p ref={prompt} id="language-gate-prompt" className="language-gate__prompt">
      <span lang="vi">{t('gate.prompt', { lng: 'vi' })}</span>
      <span lang="en">{t('gate.prompt', { lng: 'en' })}</span>
    </p>
    {LANGS.map(option)}
  </div>;
}

export default LanguageGate;
