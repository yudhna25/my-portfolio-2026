import fs from 'node:fs';let text=fs.readFileSync('src/components/Work.jsx','utf8');
text=text.replace("        if (smoother) smoother.scrollTop(smoother.offset(section.current, 'top top'));\n        else section.current.scrollIntoView({ block: 'start' });", `        if (smoother) {
          smoother.scrollTop(smoother.offset(section.current, 'top top'));
          const trigger = smoother.scrollTrigger;
          // Reuse the R2.3 resume contract; don't leave the visible scrub tween behind.
          if (trigger) { trigger.update(); trigger.animation.invalidate().progress(trigger.progress); }
        } else section.current.scrollIntoView({ block: 'start' });`);
fs.writeFileSync('src/components/Work.jsx',text);
