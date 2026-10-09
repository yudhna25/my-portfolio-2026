import fs from 'node:fs';let text=fs.readFileSync('src/components/Work.jsx','utf8');
text=text.replace("import { gsap, ScrollTrigger }", "import { gsap, ScrollTrigger, ScrollSmoother }");
text=text.replace("    if (!active) { interact('Hover', null); interact('Focus', null); }", `    if (!active) { interact('Hover', null); interact('Focus', null); }
    else {
      const focused = document.activeElement;
      if (focused?.matches('[data-work-target]:focus-visible')) interact('Focus', focused.dataset.workTarget);
    }`);
text=text.replace("    const shift = gsap.quickSetter(root.current, 'y', 'px');", "    const shift = gsap.quickSetter(root.current, 'y', 'px');\n    let previous = -1;");
text=text.replace("      if (state.storyChapter === 'works') shift(state.chapterProgress * height);", "      const next = state.storyChapter === 'works' ? state.chapterProgress * height : 0;\n      if (next !== previous) { previous = next; shift(next); }");
text=text.replace(' hidden={!active}', '');
text=text.replace(' [&[hidden]]:hidden', '');
text=text.replace("  const dismiss = () => { root.current.focus({ preventScroll: true }); clear(); };", `  const dismiss = () => { root.current.focus({ preventScroll: true }); clear(); };
  const focusProject = (event, id) => {
    if (['touch', 'pen'].includes(pointer.current) || !event.target.matches(':focus-visible')) return;
    if (useScrollStore.getState().storyChapter !== 'works') {
      const smoother = ScrollSmoother.get();
      if (smoother) smoother.scrollTop(smoother.offset(section.current, 'top top'));
      else section.current.scrollIntoView({ block: 'start' });
    }
    interact('Focus', id);
  };`);
text=text.replace("onFocus={event => { if (!['touch', 'pen'].includes(pointer.current) && event.target.matches(':focus-visible')) interact('Focus', item.id); }}", "onFocus={event => focusProject(event, item.id)}");
text=text.replace("onFocusCapture={() => interact('Focus', project.id)}", "onFocusCapture={event => focusProject(event, project.id)}");
fs.writeFileSync('src/components/Work.jsx',text);
