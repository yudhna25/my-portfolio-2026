import { useRef, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { portalProgress, portalState } from '@/3d/utils/portal';

const desktopQuery = typeof window === 'undefined'
  ? null
  : window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
const subscribe = (notify) => {
  desktopQuery?.addEventListener('change', notify);
  return () => desktopQuery?.removeEventListener('change', notify);
};
const isDesktop = () => desktopQuery?.matches ?? false;
const serverSnapshot = () => false;
// Keep the existing Work cards working until their Phase 2 migration.
const viewSelector = '[data-cursor="view"], .work-card';
const linkSelector = 'a, button, [role="link"], [role="button"]';
const lensSelector = '[data-project-image], .avatar-img, #hero-heading, main h1, main h2, [data-project-card] h3';
// Neutral at the edge; inward R/G gradients bend only the 80px backdrop.
const lensMap = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
  <defs>
    <linearGradient id="x"><stop stop-color="#ff0000"/><stop offset="1" stop-color="#000000"/></linearGradient>
    <linearGradient id="y" x2="0" y2="1"><stop stop-color="#00ff00"/><stop offset="1" stop-color="#000000"/></linearGradient>
    <radialGradient id="falloff"><stop stop-color="white"/><stop offset=".45" stop-color="white" stop-opacity=".8"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient>
    <mask id="m"><rect width="80" height="80" fill="url(#falloff)"/></mask>
  </defs>
  <rect width="80" height="80" fill="rgb(50%,50%,0%)"/>
  <g mask="url(#m)"><rect width="80" height="80" fill="url(#x)"/><rect width="80" height="80" fill="url(#y)" style="mix-blend-mode:screen"/></g>
</svg>`)}`;

function DesktopCursor() {
  const root = useRef(null);
  const lastPointer = useRef(null);
  const reducedMotion = useReducedMotion();
  const fallback = useScrollStore(state => state.sceneFallback);
  const { t } = useTranslation();

  useGSAP((context, contextSafe) => {
    const stage = root.current;
    const dot = stage.querySelector('.gsap-cursor-dot');
    const ring = stage.querySelector('.gsap-cursor-ring');
    const shape = stage.querySelector('[data-cursor-shape]');
    const fill = stage.querySelector('[data-cursor-fill]');
    const label = stage.querySelector('[data-cursor-label]');
    const lens = stage.querySelector('[data-cursor-lens]');
    const lensEnabled = lens && !window.matchMedia('(any-pointer: coarse)').matches
      && navigator.maxTouchPoints === 0 && CSS.supports('backdrop-filter', 'url("#cursor-gravity")');
    const magnets = new Map();
    const clamp = gsap.utils.clamp(-1, 1);
    let activeMagnet = null;
    let mode = 'default';
    let visible = false;

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    gsap.set(shape, { scale: 28 / 64, transformOrigin: '50% 50%' });
    gsap.set([fill, label], { opacity: 0 });
    gsap.set(stage, { visibility: 'hidden' });
    stage.dataset.cursorState = mode;

    const setter = (target, property, duration) => reducedMotion
      ? gsap.quickSetter(target, property, property === 'x' || property === 'y' ? 'px' : undefined)
      : gsap.quickTo(target, property, { duration, ease: 'power3.out' });
    const dotX = setter(dot, 'x', 0.08);
    const dotY = setter(dot, 'y', 0.08);
    const ringX = setter(ring, 'x', 0.3);
    const ringY = setter(ring, 'y', 0.3);
    const ringScaleX = setter(shape, 'scaleX', 0.24);
    const ringScaleY = setter(shape, 'scaleY', 0.24);
    const fillOpacity = setter(fill, 'opacity', 0.18);
    const labelOpacity = setter(label, 'opacity', 0.18);
    const dotOpacity = setter(dot, 'opacity', 0.18);
    const stageVisibility = gsap.quickSetter(stage, 'visibility');
    if (lens) gsap.set(lens, {
      xPercent: -50, yPercent: -50, visibility: 'hidden',
      backdropFilter: 'url("#cursor-gravity")',
    });
    const lensX = lensEnabled ? gsap.quickSetter(lens, 'x', 'px') : null;
    const lensY = lensEnabled ? gsap.quickSetter(lens, 'y', 'px') : null;
    const lensVisibility = lensEnabled ? gsap.quickSetter(lens, 'visibility') : null;
    const hideLens = () => {
      if (lens?.dataset.active !== 'true') return;
      lensVisibility?.('hidden');
      lens.dataset.active = 'false';
    };
    const moveLens = (event) => {
      if (!lensEnabled) return;
      const element = targetElement(event.target);
      let eligible = element?.closest(lensSelector);
      // The fixed semantic Hero passes events through; backdrop distortion never moves its O.
      const hero = document.getElementById('hero-heading');
      if (hero && useScrollStore.getState().storyChapter === 'hero' && hero.closest('[data-portal-stage]')?.getAttribute('aria-hidden') === 'false') {
        const rect = hero.getBoundingClientRect();
        eligible = event.clientX >= rect.left && event.clientX <= rect.right
          && event.clientY >= rect.top && event.clientY <= rect.bottom;
      }
      if (!eligible || event.pointerType === 'touch') { hideLens(); return; }
      lensX(event.clientX); lensY(event.clientY);
      if (lens.dataset.active !== 'true') {
        lensVisibility('visible');
        lens.dataset.active = 'true';
      }
    };

    const setMode = (next) => {
      if (mode === next) return;
      mode = next;
      stage.dataset.cursorState = next;
      const scale = next === 'view' ? 1 : next === 'link' ? 18 / 64 : 28 / 64;
      ringScaleX(scale);
      ringScaleY(scale);
      fillOpacity(next === 'view' ? 1 : 0);
      labelOpacity(next === 'view' ? 1 : 0);
      dotOpacity(next === 'view' ? 0 : 1);
    };

    const getMagnet = contextSafe((element) => {
      if (magnets.has(element)) return magnets.get(element);
      // Individual translate composes with section entrance/Flip transforms.
      // Restore only this property; never clear the section's transform.
      const original = element.style.getPropertyValue('translate');
      const priority = element.style.getPropertyPriority('translate');
      const offset = { x: 0, y: 0 };
      const translate = gsap.quickSetter(element, 'translate');
      const render = () => translate(`${offset.x}px ${offset.y}px`);
      const options = { duration: 0.3, ease: 'power3.out', onUpdate: render };
      const x = reducedMotion ? (value) => { offset.x = value; render(); }
        : gsap.quickTo(offset, 'x', options);
      const y = reducedMotion ? (value) => { offset.y = value; render(); }
        : gsap.quickTo(offset, 'y', options);
      const magnet = {
        offset, x, y,
        restore: () => {
          x.tween?.kill();
          y.tween?.kill();
          if (original) element.style.setProperty('translate', original, priority);
          else element.style.removeProperty('translate');
        },
      };
      magnets.set(element, magnet);
      return magnet;
    });

    const resetMagnet = () => {
      if (!activeMagnet) return;
      const magnet = magnets.get(activeMagnet);
      magnet.x(0);
      magnet.y(0);
      activeMagnet = null;
    };
    const targetElement = (target) => target instanceof Element ? target : null;
    const updateTarget = (target) => {
      const element = targetElement(target);
      const disabled = element?.closest(':disabled, [aria-disabled="true"]');
      setMode(disabled ? 'default' : element?.closest(viewSelector) ? 'view'
        : element?.closest(linkSelector) ? 'link' : 'default');
      const nextMagnet = disabled || reducedMotion ? null : element?.closest('[data-magnetic]') ?? null;
      if (nextMagnet !== activeMagnet) {
        resetMagnet();
        // Filtered/replaced cards must not accumulate cached DOM references.
        for (const [node, magnet] of magnets) {
          if (!node.isConnected) { magnet.restore(); magnets.delete(node); }
        }
        if (nextMagnet) { getMagnet(nextMagnet); activeMagnet = nextMagnet; }
      }
    };

    const move = (event) => {
      if (event.pointerType === 'touch') { hideLens(); return; }
      const state = useScrollStore.getState();
      const p = portalProgress(state.storyChapter, state.chapterProgress, reducedMotion || fallback);
      if (p > 0 && p < 0.96) { hideLens(); return; }
      // Read the target rectangle before any transform writes.
      updateTarget(event.target);
      const magnet = activeMagnet ? magnets.get(activeMagnet) : null;
      const rect = activeMagnet?.getBoundingClientRect();
      moveLens(event);
      const { clientX: x, clientY: y } = event;
      lastPointer.current = { clientX: x, clientY: y };
      dotX(x); dotY(y); ringX(x); ringY(y);
      if (!visible) {
        // Land on the first point immediately; never fly in from off-screen.
        [dotX, dotY, ringX, ringY].forEach((follow) => follow.tween?.progress(1));
        stageVisibility('visible');
        visible = true;
      }
      if (rect) {
        // Subtract our own translation to avoid a moving-center feedback loop.
        const dx = clamp((x - rect.left + magnet.offset.x - rect.width / 2) / (rect.width / 2 || 1));
        const dy = clamp((y - rect.top + magnet.offset.y - rect.height / 2) / (rect.height / 2 || 1));
        const distance = Math.max(1, Math.hypot(dx, dy));
        magnet.x(dx * 8 / distance);
        magnet.y(dy * 8 / distance);
      }
    };
    const over = (event) => {
      if (event.pointerType !== 'touch') updateTarget(event.target);
    };
    const out = (event) => {
      if (event.pointerType !== 'touch') updateTarget(event.relatedTarget);
      if (!targetElement(event.relatedTarget)?.closest(lensSelector)) hideLens();
    };
    const hide = () => {
      hideLens();
      stageVisibility('hidden');
      visible = false;
      lastPointer.current = null;
      resetMagnet();
      setMode('default');
    };
    const keyboard = (event) => { if (event.key === 'Tab') hide(); };
    const visibility = () => { if (document.hidden) hide(); };

    // Delegation also covers cards mounted later by filtering or route changes.
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('pointerout', out, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    document.addEventListener('keydown', keyboard);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', hide);
    window.addEventListener('scroll', hideLens, { passive: true });
    window.addEventListener('resize', hideLens, { passive: true });
    let swallowing = false;
    const syncPortal = () => {
      hideLens();
      const state = useScrollStore.getState();
      const p = portalProgress(state.storyChapter, state.chapterProgress, reducedMotion || fallback);
      const next = p > 0 && p < 0.96;
      if (next && !swallowing) [dotX, dotY, ringX, ringY, ringScaleX, ringScaleY, fillOpacity, labelOpacity, dotOpacity]
        .forEach(set => set.tween?.progress(1).pause());
      swallowing = next;
    };
    const unsubscribe = useScrollStore.subscribe(syncPortal);
    syncPortal();
    if (lastPointer.current) {
      const point = lastPointer.current;
      move({ ...point, target: document.elementFromPoint(point.clientX, point.clientY) });
    }

    return () => {
      unsubscribe();
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      document.documentElement.removeEventListener('pointerleave', hide);
      document.removeEventListener('keydown', keyboard);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', hide);
      window.removeEventListener('scroll', hideLens);
      window.removeEventListener('resize', hideLens);
      magnets.forEach((magnet) => magnet.restore());
      magnets.clear();
    };
  }, { scope: root, dependencies: [reducedMotion, fallback], revertOnUpdate: true });

  useGSAP(() => {
    const stage = root.current.querySelector('[data-cursor-portal]');
    const phase = {};
    gsap.set(stage, { transform: 'none', opacity: 1 });
    const opacity = gsap.quickSetter(stage, 'opacity');
    const draw = () => {
      const state = useScrollStore.getState();
      const p = portalProgress(state.storyChapter, state.chapterProgress, reducedMotion || fallback);
      portalState(p, phase);
      const s = p < 0.5 ? Math.max(0.01, Math.pow(1 - phase.intake, 2)) : 1;
      const anchor = state.storyAnchor;
      const ox = anchor ? anchor.left + anchor.width / 2 : window.innerWidth * 0.5;
      const oy = anchor ? anchor.top + anchor.height / 2 : window.innerHeight * 0.45;
      stage.style.transform = `translate(${(ox + (window.innerWidth * 0.5 - ox) * phase.center) * (1 - s)}px, ${(oy + (window.innerHeight * 0.45 - oy) * phase.center) * (1 - s)}px) scale(${s})`;
      opacity(phase.controlsOpacity);
    };
    draw();
    return useScrollStore.subscribe(draw);
  }, { scope: root, dependencies: [reducedMotion, fallback], revertOnUpdate: true });

  return (
    <div ref={root} data-custom-cursor aria-hidden="true"
      className="pointer-events-none invisible contents">
      {!reducedMotion && <>
        <svg className="absolute size-0" aria-hidden="true" focusable="false">
          <defs>
            <filter id="cursor-gravity" x="0" y="0" width="80" height="80"
              filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feImage href={lensMap} x="0" y="0" width="80" height="80" result="curvature" />
              <feDisplacementMap in="SourceGraphic" in2="curvature" scale="6" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        {/* Warp page content beneath navigation. */}
        <div data-cursor-lens data-active="false" aria-hidden="true"
          className="invisible fixed top-0 left-0 z-30 size-20 [clip-path:circle(50%)]" />
      </>}
      <div data-cursor-portal className="fixed inset-0 z-[9998] origin-top-left">
      <div className="gsap-cursor-ring fixed top-0 left-0 size-16 mix-blend-difference" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="absolute inset-0 size-full"
          aria-hidden="true" focusable="false">
          <g data-cursor-shape>
            <circle data-cursor-fill cx="32" cy="32" r="32" className="fill-(--text-primary) opacity-0" />
            <circle cx="32" cy="32" r="31.5" fill="none" strokeWidth="1"
              vectorEffect="non-scaling-stroke" className="stroke-white/40" />
          </g>
        </svg>
        <span data-cursor-label
          className="absolute inset-0 grid place-items-center font-display text-[12px] font-medium text-black opacity-0">
          {t('works.cursorCta')}
        </span>
      </div>
      <div className="gsap-cursor-dot fixed top-0 left-0 size-1 rounded-full bg-white mix-blend-difference" aria-hidden="true" />
      </div>
    </div>
  );
}

export function Cursor() {
  const enabled = useSyncExternalStore(subscribe, isDesktop, serverSnapshot);
  return enabled ? <DesktopCursor /> : null;
}

export default Cursor;
