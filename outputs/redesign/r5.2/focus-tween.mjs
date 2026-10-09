import fs from 'node:fs';let text=fs.readFileSync('src/components/Work.jsx','utf8');
text=text.replace("          // Reuse the R2.3 resume contract; don't leave the visible scrub tween behind.\n          if (trigger) { trigger.update(); trigger.animation.invalidate().progress(trigger.progress); }", `          // Finish the existing scrub too: its next tick must not undo the focus jump.
          if (trigger) {
            trigger.update();
            trigger.getTween()?.progress(1).pause();
            trigger.animation.progress(trigger.progress);
          }`);
fs.writeFileSync('src/components/Work.jsx',text);
