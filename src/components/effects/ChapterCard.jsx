import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap, useGSAPSetup } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { starlightTimeline } from '@/lib/textReveal';

// Giant chapter title cards: on entering a chapter its name is born from starlight at
// ~12vw over the sky, holds for a beat, then recedes behind the content it introduces.
const CHAPTERS = ['about', 'skills', 'education', 'experience', 'works'];
const NUMERALS = ['I', 'II', 'III', 'IV', 'V'];
const SETTLE_MS = 260; // a chapter must hold this long, so flying past stays quiet
const REPEAT_MS = 6000; // and the same card never repeats back to back

export function ChapterCard() {
  const root = useRef(null);
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const fallback = useScrollStore(state => state.sceneFallback);
  const [chapter, setChapter] = useState(null);
  const shown = useRef({ id: null, at: 0 });

  // Decide which card to show; the render below then plays it.
  useGSAPSetup(() => {
    if (reduced || fallback) return;
    let timer;
    let current = useScrollStore.getState().storyChapter;
    const unsubscribe = useScrollStore.subscribe((state) => {
      if (state.storyChapter === current) return;
      current = state.storyChapter;
      window.clearTimeout(timer);
      if (!CHAPTERS.includes(current)) { setChapter(null); return; }
      timer = window.setTimeout(() => {
        const last = shown.current;
        if (useScrollStore.getState().storyChapter !== current) return;
        if (last.id === current && performance.now() - last.at < REPEAT_MS) return;
        shown.current = { id: current, at: performance.now() };
        setChapter({ id: current, key: shown.current.at });
      }, SETTLE_MS);
    });
    return () => { unsubscribe(); window.clearTimeout(timer); };
  }, { dependencies: [reduced, fallback] });

  useGSAPSetup(() => {
    const card = root.current?.querySelector('[data-chapter-card]');
    if (!card) return;
    const chars = [];
    card.querySelectorAll('[data-chapter-title] .chapter-word').forEach((word) => {
      // Split by hand: the accent <em> keeps its serif while each glyph is animated.
      word.querySelectorAll('[data-glyph]').forEach(glyph => chars.push(glyph));
    });
    const meta = card.querySelector('[data-chapter-meta]');
    gsap.timeline({ onComplete: () => setChapter(null) })
      .set(card, { autoAlpha: 1 })
      .fromTo(meta, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0)
      .add(starlightTimeline(chars, { scatter: 2.2, glow: 10 }), 0.05)
      .to(card, { autoAlpha: 0, scale: 0.94, yPercent: -8, filter: 'blur(10px)', duration: 0.9, ease: 'power2.in' }, 1.9);
  }, { scope: root, dependencies: [chapter?.key], revertOnUpdate: true });

  if (!chapter) return <div ref={root} aria-hidden="true" />;
  const index = CHAPTERS.indexOf(chapter.id);
  const copy = t(`chapters.${chapter.id}`, { returnObjects: true });
  return <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] grid items-center overflow-hidden">
    <div data-chapter-card lang={i18n.resolvedLanguage} className="invisible mx-[6vw] max-w-[88vw] origin-left">
      <p data-chapter-meta className="mb-[2vh] flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.24em] text-(--text-secondary)">
        <span className="text-amber">{t('chapters.label')} {NUMERALS[index]}</span>
        <span aria-hidden="true" className="h-px w-12 bg-(--text-muted)" />
        <span>{copy.coord}</span>
      </p>
      <p data-chapter-title className="chapter-title font-display font-extrabold uppercase leading-[0.92] tracking-[-0.045em]">
        <GlyphText text={copy.title} accent={copy.accent} />
      </p>
    </div>
  </div>;
}

// Words stay unbroken; every glyph is its own span for the starlight reveal.
function GlyphText({ text, accent }) {
  const at = accent ? text.toLocaleLowerCase().indexOf(accent.toLocaleLowerCase()) : -1;
  const parts = at < 0 ? [[text, false]] : [[text.slice(0, at), false], [text.slice(at, at + accent.length), true], [text.slice(at + accent.length), false]];
  return parts.filter(([part]) => part).map(([part, emphasis], partIndex) => {
    const words = part.split(/(\s+)/).map((word, wordIndex) => /^\s+$/.test(word) ? ' '
      : <span key={wordIndex} className="chapter-word inline-block whitespace-nowrap">
        {Array.from(word, (glyph, glyphIndex) => <span key={glyphIndex} data-glyph className="inline-block">{glyph}</span>)}
      </span>);
    return emphasis ? <em key={partIndex} className="mix-em">{words}</em> : <span key={partIndex}>{words}</span>;
  });
}

export default ChapterCard;
