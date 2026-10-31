import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { bridgeMouth, exitCamera, portalProgress, portalState } from '@/3d/utils/portal';
import { funnelMatrix, matrixCss, parseColor, splitWords } from '@/3d/utils/funnelFlow';
import '@/styles/about.css';

export default function About({ portrait }) {
  const root = useRef(null);
  const portraitButton = useRef(null);
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const fallback = useScrollStore(state => state.sceneFallback);
  const frozen = reduced || fallback;
  const [held, setHeld] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const name = t('about.heading').split(' / ');
  const bio = t('about.bioFirst');
  const split = bio.indexOf('. ') + 1 || bio.length;
  const opening = bio.slice(0, split);

  useGSAP(() => {
    if (!portrait) return;
    gsap.to(portrait.current, { intent: held || hovered || focused ? 1 : 0, duration: frozen ? 0 : 0.85, ease: 'power3.inOut', overwrite: true });
  }, { scope: root, dependencies: [held, hovered, focused, frozen, portrait] });

  useGSAP(() => {
    const q = gsap.utils.selector(root);
    const stage = root.current;
    let active = true;
    const frames = q('[data-about-motion]');
    gsap.set([...frames, ...q('[data-about-group]')], { transform: 'none', opacity: 1 });
    const phase = {};
    let range = 0;
    gsap.set(stage, { autoAlpha: 0 });
    const visibility = gsap.quickSetter(stage, 'visibility');
    const shifts = frames.map(node => value => { node.style.transform = value; });
    const backdrop = gsap.quickSetter(q('[data-about-backdrop]')[0], 'opacity');
    gsap.set(stage, { opacity: 1 });
    // About pours out of the far mouth as itself: every word and the portrait ride the
    // bridge's exit flow out of a shallow well at the hole and settle into their places.
    const roots = q('[data-about-flow]');
    const cam = {}, flow = {};
    let outflow = null;
    const enterOutflow = () => {
      const words = splitWords(roots);
      const nodes = [...words.units, ...roots.flatMap(node => [...node.querySelectorAll('img')])];
      const units = nodes.map(node => {
        const root = roots.find(item => item.contains(node));
        const box = node.getBoundingClientRect(), base = root.getBoundingClientRect();
        node.style.willChange = 'transform, opacity';
        const color = node.tagName === 'IMG' ? null : parseColor(getComputedStyle(node).color);
        return { node, root, x: box.left + box.width / 2 - base.left, y: box.top + box.height / 2 - base.top, color };
      });
      outflow = { units, restore: words.restore };
    };
    const leaveOutflow = () => {
      if (!outflow) return;
      outflow.units.forEach(({ node }) => ['transform', 'opacity', 'color', 'will-change'].forEach(key => node.style.removeProperty(key)));
      outflow.restore();
      outflow = null;
    };
    const pour = () => {
      if (!outflow) return;
      const height = window.innerHeight;
      exitCamera(phase, bridgeMouth, height, cam);
      const bases = new Map(roots.map(node => [node, node.getBoundingClientRect()]));
      outflow.units.forEach(unit => {
        const base = bases.get(unit.root);
        funnelMatrix(cam, phase.emerge, height, base.left + unit.x, base.top + unit.y, flow, unit.color ? undefined : PICTURE);
        const alpha = flow.alpha * phase.outflow;
        const style = unit.node.style;
        style.opacity = alpha.toFixed(3);
        if (alpha < 0.002) return;
        style.transform = matrixCss(flow);
        // Fresh out of the mouth the words run hot, cooling to their own colour as they settle.
        if (unit.color) style.color = hot(unit.color, 1 - flow.stretch);
      });
    };
    const draw = () => {
      const state = useScrollStore.getState();
      const p = portalProgress(state.storyChapter, state.chapterProgress, frozen);
      portalState(p, phase);
      const entering = state.storyChapter === 'portal' && !frozen;
      const visible = phase.aboutOpacity > 0;
      visibility(visible ? 'visible' : 'hidden');
      stage.inert = !phase.aboutInteractive;
      stage.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (stage.inert && stage.contains(document.activeElement)) {
        document.getElementById('smooth-content')?.focus({ preventScroll: true });
      }
      // Only inner visuals move; section/marker/footprint remain in document flow.
      shifts.forEach(shift => shift(`translateY(${entering ? -(1 - p) * range : 0}px)`));
      backdrop(phase.aboutOpacity);
      const pouring = entering && visible && phase.emerge > 0 && bridgeMouth.ready;
      if (pouring && !outflow) { enterOutflow(); gsap.ticker.add(pour); }
      else if (!pouring && outflow) { gsap.ticker.remove(pour); leaveOutflow(); }
      pour();
      if (portrait && portraitButton.current) {
        const data = portrait.current;
        data.node = portraitButton.current;
        data.visible = false;
        if (!visible || frozen) return;
        const rect = portraitButton.current.getBoundingClientRect();
        data.rect = rect;
        data.visible = rect.bottom > 0 && rect.top < window.innerHeight;
        // The photo rides out of the bridge with the text, so no stars gather into it.
        data.morph = 1;
        data.opacity = 0;
      }
    };
    const measure = () => {
      if (!active) return;
      // Rest offsets are taken with nothing moved; take them again for the new layout.
      if (outflow) { gsap.ticker.remove(pour); leaveOutflow(); }
      shifts.forEach(shift => shift('none'));
      const base = stage.getBoundingClientRect();
      const content = document.getElementById('smooth-content');
      const portal = content?.querySelector('[data-story-chapter="portal"]');
      range = portal ? base.top - portal.getBoundingClientRect().top : 0;
      draw();
    };
    measure();
    const unsubscribe = useScrollStore.subscribe(draw);
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener('resize', measure);
    ScrollTrigger.addEventListener('refresh', measure);
    document.fonts?.ready.then(() => { if (active) measure(); });
    ScrollTrigger.refresh(true);
    return () => {
      active = false;
      unsubscribe();
      gsap.ticker.remove(pour);
      leaveOutflow();
      observer.disconnect();
      window.removeEventListener('resize', measure);
      ScrollTrigger.removeEventListener('refresh', measure);
    };
  }, { scope: root, dependencies: [frozen, i18n.resolvedLanguage, portrait], revertOnUpdate: true });

  return <section ref={root} id="about" aria-labelledby="about-heading" className="relative isolate min-h-screen px-6 py-28 text-(--text-primary) sm:px-8 lg:px-16 lg:py-36">
    <div data-about-motion data-about-backdrop aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_72%_62%,rgba(7,8,13,0.44)_15%,rgba(7,8,13,0.18)_42%,transparent_78%)]" />
    <div data-about-motion className="mx-auto grid max-w-7xl grid-cols-12 items-start gap-y-10 lg:gap-x-16 lg:gap-y-8">
      <header data-about-group="heading" data-about-flow className="col-span-12 min-w-0 lg:col-span-7 lg:col-start-6 lg:row-start-1">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-(--text-secondary)">{t('about.sectionLabel')}</p>
        <h2 key={i18n.resolvedLanguage} id="about-heading" aria-label={t('hero.name')} className="font-display text-[clamp(1.75rem,5vw,4rem)] font-bold uppercase leading-[1.18] tracking-[-0.035em]">
          <span className="sr-only">{t('hero.name')}</span>
          {name.map(line => <span key={line} aria-hidden="true" className="relative block">
            <span className="invisible block">{line}</span>
            <span data-about-decode className="absolute inset-0">{line}</span>
          </span>)}
        </h2>
        <p className="mt-5 font-body text-sm text-(--text-secondary) sm:text-base">{t('about.subLabel')}</p>
      </header>

      <figure data-about-group="avatar" data-about-flow className="col-span-12 m-0 min-w-0 lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-center">
        <button ref={portraitButton} data-portrait type="button" aria-label={t('about.portraitToggle')} aria-describedby="about-portrait-hint" aria-pressed={held}
          onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onClick={() => setHeld(value => !value)} onKeyDown={event => { if (event.key === 'Escape') { setHeld(false); setFocused(false); } }}
          className="group relative mx-auto block w-full max-w-md cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-8">
          <img src={`${import.meta.env.BASE_URL}avatar-cutout.webp`} alt={t('about.avatarAlt')} width="800" height="1000" loading="lazy" decoding="async"
            className="avatar-img block aspect-[4/5] h-auto w-full object-contain" />
        </button>
        <p id="about-portrait-hint" className="mx-auto mt-5 max-w-md text-center font-body text-xs leading-relaxed text-(--text-secondary)">{t('about.portraitHint')}</p>
      </figure>

      <div data-about-group="bio" data-about-flow className="col-span-12 min-w-0 lg:col-span-7 lg:col-start-6 lg:row-start-2">
        <div className="max-w-[56ch] space-y-6 font-body text-base leading-[1.8] lg:text-lg">
          <p data-about-bio className="text-base leading-[1.8] lg:text-lg">
            <span key={i18n.resolvedLanguage} className="relative block">
              <span className="sr-only">{opening}</span>
              <span aria-hidden="true" className="invisible block">{opening}</span>
              <span aria-hidden="true" data-about-decode className="absolute inset-0">{opening}</span>
            </span>{bio.slice(split)}
          </p>
          <p data-about-bio className="text-base leading-[1.8] lg:text-lg">{t('about.bioSecond')}</p>
          <blockquote data-about-bio className="pt-4 font-body text-xl font-light italic leading-relaxed text-(--text-primary) sm:text-2xl">{t('about.quote')}</blockquote>
        </div>
      </div>
    </div>
  </section>;
}

// The portrait comes out whole: turned and growing to size, never smeared.
const PICTURE = { rigid: true, limit: 1 };
const GLOW = [255, 219, 158];

function hot([r, g, b, a], heat) {
  const t = Math.min(0.9, Math.max(0, heat * 1.4));
  const mix = (from, to) => Math.round(Math.min(255, from + (Math.min(255, to * 1.6) - from) * t));
  return `rgba(${mix(r, GLOW[0])},${mix(g, GLOW[1])},${mix(b, GLOW[2])},${a})`;
}
