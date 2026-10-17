import { portalIntake, portalParticle, portalSmooth, portalState } from '@/3d/utils/portal';
import { samplePortalParticles } from './portalParticles';
import '@/styles/portal-trails.css';

const SVG = 'http://www.w3.org/2000/svg';
const fontProperties = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'color', 'textTransform'];

function visualClone(node, width, height) {
  let clone;
  if (node instanceof SVGElement && node.tagName !== 'svg') {
    const box = node.getBBox();
    clone = document.createElementNS(SVG, 'svg');
    clone.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
    const glyph = node.cloneNode(true);
    glyph.removeAttribute('transform');
    const base = node.querySelector('.hero-year-base');
    if (base) glyph.querySelector('.hero-year-base').style.stroke = getComputedStyle(base).stroke;
    const contour = node.ownerSVGElement.parentElement.querySelector(`[data-year-contour-glyph="${node.dataset.portalYearGlyph}"]`);
    if (contour) glyph.append(...[...contour.childNodes].map(child => child.cloneNode(true)));
    clone.append(glyph);
    clone.setAttribute('fill', node.ownerSVGElement.getAttribute('fill') || 'none');
    clone.setAttribute('stroke', node.ownerSVGElement.getAttribute('stroke') || 'white');
    clone.classList.add('portal-trail-year');
  } else {
    clone = document.createElement('div');
    const source = node.cloneNode(true);
    clone.append(...source.childNodes);
    const computed = getComputedStyle(node);
    for (const key of fontProperties) clone.style[key] = computed[key];
    clone.style.display = computed.display;
    clone.style.alignItems = computed.alignItems;
    clone.style.justifyContent = computed.justifyContent;
    clone.style.gap = computed.gap;
    clone.style.border = 'none';
    clone.style.borderRadius = computed.borderRadius;
  }
  clone.querySelectorAll('.sr-only, .invisible, [data-story-anchor], [data-year-noise]').forEach(child => child.remove());
  for (const element of [clone, ...clone.querySelectorAll('*')]) {
    for (const attribute of [...element.attributes]) {
      if (attribute.name === 'id' || attribute.name.startsWith('on') || attribute.name.startsWith('aria-') || attribute.name.startsWith('data-')
        || (attribute.name === 'href' && !(element.tagName === 'image' && attribute.value.startsWith('data:image/png;base64,')))
        || ['tabindex', 'title', 'name', 'for'].includes(attribute.name)) element.removeAttribute(attribute.name);
    }
  }
  clone.classList.add('portal-trail-image');
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  return clone;
}

function textFragments(node) {
  const fragments = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let text;
  while ((text = walker.nextNode())) {
    if (text.parentElement.closest('.sr-only, .invisible')) continue;
    for (const match of text.textContent.matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(text, match.index); range.setEnd(text, match.index + match[0].length);
      fragments.push({ text: match[0], range, node: text.parentElement });
    }
  }
  return fragments;
}

// Snapshots have no controls or IDs. This is one decoration pool, never a new renderer/progress owner.
export function createPortalTrails(definitions, className = '') {
  const layer = document.createElement('div');
  layer.className = `portal-trails ${className}`;
  layer.setAttribute('aria-hidden', 'true'); layer.inert = true;
  const ribbon = document.createElementNS(SVG, 'svg');
  ribbon.classList.add('portal-trail-ribbons');
  ribbon.setAttribute('aria-hidden', 'true'); ribbon.setAttribute('focusable', 'false');
  layer.append(ribbon);
  document.body.append(layer);
  const count = 1;
  const raster = document.createElement('canvas');
  const sources = definitions.flatMap(definition => definition.words
    ? textFragments(definition.node).map((fragment, wordIndex) => ({ ...fragment, wordIndex, source: definition.node }))
    : [{ ...definition, source: definition.node }]);
  const originals = definitions.map(({ node }) => ({ node, opacity: node.style.opacity }));
  const items = sources.map(source => {
    const path = document.createElementNS(SVG, 'path');
    path.classList.add('portal-trail-particles');
    ribbon.append(path);
    const images = Array.from({ length: count }, () => {
      const image = document.createElement('div');
      image.className = 'portal-trail-copy'; layer.append(image); return image;
    });
    return { ...source, images, path, layout: {}, pose: {}, sample: {}, previous: {}, particles: [] };
  });
  layer.dataset.portalTrails = '';
  layer.dataset.sourceCount = String(items.length);
  layer.dataset.copyCount = String(items.length * count);
  let absorbing = false;
  const phase = {};
  const measure = () => {
    originals.forEach(({ node, opacity }) => { node.style.opacity = opacity; });
    ribbon.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    const words = new Map(definitions.filter(item => item.words).map(item => [item.node, textFragments(item.node)]));
    items.forEach(item => {
      if (item.range) item.range = words.get(item.source)[item.wordIndex]?.range;
      const rect = item.range ? item.range.getBoundingClientRect() : item.node.getBoundingClientRect();
      Object.assign(item.layout, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, width: rect.width, height: rect.height });
      item.available = rect.width > 0 && rect.height > 0;
      item.particles = item.available ? samplePortalParticles(item.node, item.text ?? item.node.textContent, rect, raster, window.innerWidth < 768 ? 80 : 150) : [];
      let visual;
      if (item.text) {
        visual = document.createElement('span'); visual.textContent = item.text;
        visual.className = 'portal-trail-image';
        const computed = getComputedStyle(item.node);
        for (const key of fontProperties) visual.style[key] = computed[key];
        visual.style.width = `${rect.width}px`; visual.style.height = `${rect.height}px`;
        visual.style.lineHeight = `${rect.height}px`;
      } else visual = visualClone(item.node, rect.width, rect.height);
      item.images.forEach((image, index) => {
        image.replaceChildren(index ? visual.cloneNode(true) : visual);
        image.style.left = `${item.layout.x}px`; image.style.top = `${item.layout.y}px`;
      });
    });
    layer.dataset.particleCount = String(items.reduce((total, item) => total + item.particles.length, 0));
  };
  const draw = (p, anchor, enabled = true) => {
    const next = enabled && p > 0 && p < 0.435 && !document.hidden;
    if (next !== absorbing) items.forEach(item => item.images.forEach(image => {
      image.style.willChange = next ? 'transform, opacity' : '';
    }));
    if (next && !absorbing) measure();
    absorbing = next;
    layer.hidden = !next;
    layer.dataset.progress = String(p);
    originals.forEach(({ node, opacity }) => { node.style.opacity = enabled && p > 0 && p < 0.5 ? '0' : opacity; });
    if (!next) return;
    const width = window.innerWidth, height = window.innerHeight;
    portalState(p, phase);
    const ox = anchor ? anchor.left + anchor.width / 2 : width * 0.75;
    const oy = anchor ? anchor.top + anchor.height / 2 : height * 0.4;
    const cx = ox + (width * 0.5 - ox) * phase.center;
    const cy = oy + (height * 0.45 - oy) * phase.center;
    // Match BlackHole's projected shadow radius; decorations disappear inside its horizon.
    const core = (anchor?.height || 40) * 0.48 * phase.growth;
    layer.style.maskImage = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${core * 0.98}px, black ${core + 2}px)`;
    const dissolve = portalSmooth(0.015, 0.09, p);
    const fade = 1 - portalSmooth(0.34, 0.435, p);
    items.forEach((item, index) => {
      if (!item.available) return;
      portalIntake(p, item.layout, anchor, width, height, index, item.pose);
      let dots = '';
      for (const particle of item.particles) {
        const pose = portalParticle(p, particle.x, particle.y, particle.seed, cx, cy, item.sample);
        const tail = portalParticle(Math.max(0, p - 0.002 - 0.006 * pose.t), particle.x, particle.y, particle.seed, cx, cy, item.previous);
        const dx = tail.x - pose.x, dy = tail.y - pose.y;
        const length = Math.hypot(dx, dy), ratio = Math.min(1, 16 / Math.max(0.001, length));
        dots += `M${pose.x.toFixed(2)},${pose.y.toFixed(2)}l${(dx * ratio + 0.01).toFixed(2)},${(dy * ratio).toFixed(2)}`;
      }
      item.path.setAttribute('d', dots);
      item.path.style.opacity = String(dissolve * fade * 0.8);
      item.images.forEach(image => {
        const pose = item.pose;
        image.style.transform = `translate(-50%, -50%) translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotation}deg) scale(${pose.scaleX}, ${pose.scaleY})`;
        image.style.opacity = String(1 - dissolve);
      });
    });
  };
  measure();
  return { measure, draw, dispose: () => {
    originals.forEach(({ node, opacity }) => { node.style.opacity = opacity; });
    layer.remove();
  }, sources: items.length, copies: items.length * count };
}
