import fs from 'node:fs';
const file='src/components/Work.jsx';let text=fs.readFileSync(file,'utf8');
text=text.replace("import { createPortal } from 'react-dom';\n",'');
text=text.replace('    {createPortal(<div ref={root}', '    <div ref={root}');
text=text.replace('className="fixed inset-0 z-20 px-4', 'className="absolute inset-x-0 top-0 z-20 h-screen px-4');
text=text.replace("    </div>, document.getElementById('root'))}", '    </div>');
const before='  useGSAP(() => {\n    const preview = root.current.querySelector';
const replacement=`  useGSAP(() => {
    // Keep DOM order inside main; the existing story producer supplies visible scroll.
    let height = section.current.getBoundingClientRect().height;
    const shift = gsap.quickSetter(root.current, 'y', 'px');
    const draw = () => {
      const state = useScrollStore.getState();
      if (state.storyChapter === 'works') shift(state.chapterProgress * height);
    };
    const measure = () => { height = section.current.getBoundingClientRect().height; draw(); };
    const observer = new ResizeObserver(measure);
    observer.observe(section.current);
    const unsubscribe = useScrollStore.subscribe(draw);
    draw();
    return () => { unsubscribe(); observer.disconnect(); };
  }, { scope: section });

  useGSAP(() => {
    const preview = root.current.querySelector`;
text=text.replace(before,replacement);fs.writeFileSync(file,text);
const renderer='src/3d/components/WorksConstellations.jsx';let scene=fs.readFileSync(renderer,'utf8');
scene=scene.replace('(selected && selected !== WORKS_IDS[i] ? 0.35 : 1)', '(selected ? selected === WORKS_IDS[i] ? 1.2 : 0.35 : 1)');fs.writeFileSync(renderer,scene);
