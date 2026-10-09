import fs from 'node:fs';let text=fs.readFileSync('src/components/Work.jsx','utf8');
text=text.replace("  const pointer = useRef('');", "  const pointer = useRef('');\n  const focusFrame = useRef(0);");
text=text.replace("  const dismiss = () => { root.current.focus({ preventScroll: true }); clear(); };", "  const dismiss = () => { cancelAnimationFrame(focusFrame.current); root.current.focus({ preventScroll: true }); clear(); };");
const before=`    if (useScrollStore.getState().storyChapter !== 'works') {
      const smoother = ScrollSmoother.get();
      if (smoother) smoother.scrollTop(smoother.offset(section.current, 'top top'));
      else section.current.scrollIntoView({ block: 'start' });
    }`;
const after=`    cancelAnimationFrame(focusFrame.current);
    if (useScrollStore.getState().storyChapter !== 'works') {
      const element = event.target;
      // Native focus/Smoother focusin can seek after React's focus handler.
      focusFrame.current = requestAnimationFrame(() => {
        if (!element.isConnected || document.activeElement !== element) return;
        const smoother = ScrollSmoother.get();
        if (smoother) smoother.scrollTop(smoother.offset(section.current, 'top top'));
        else section.current.scrollIntoView({ block: 'start' });
      });
    }`;
if(!text.includes(before))throw Error('Expected focus block missing');text=text.replace(before,after);
text=text.replace('return () => { unsubscribe(); observer.disconnect(); };', 'return () => { cancelAnimationFrame(focusFrame.current); unsubscribe(); observer.disconnect(); };');
fs.writeFileSync('src/components/Work.jsx',text);
