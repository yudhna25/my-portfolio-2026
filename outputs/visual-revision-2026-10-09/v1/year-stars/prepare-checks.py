from pathlib import Path
root = Path('outputs/visual-revision-2026-10-09/v1')
source = (root / 'check-browser.mjs').read_text(encoding='utf-8')
source = source.replace("const out = 'outputs/visual-revision-2026-10-09/v1';", "const out = 'outputs/visual-revision-2026-10-09/v1/year-stars';")
source = source.replace('`${base}/${out}/fixture.html`', '`${base}/outputs/visual-revision-2026-10-09/v1/fixture.html`')
source = source.replace('hero-year-dash', 'hero-year-meteors')
source = source.replace("svg.querySelector('tspan[data-year-glyph]')", "svg.querySelector('.hero-year-base')")
source = source.replace("document.querySelector('[data-year-dash]')", "document.querySelector('.hero-year-head')")
source = source.replace("check(`${label}: contour 2px`,m.stroke==='2px'", "check(`${label}: faint contour 0.6px`,m.stroke==='0.6px'")
source = source.replace("dash:v1.gsap.gsap.getById('hero-year-meteors').duration()", "dash:v1.gsap.gsap.getById('hero-year-meteors').getChildren().map(t=>t.duration())")
source = source.replace("check('cycle 15.8s / dash 6s',Math.abs(timing.flash-15.8)<0.001&&timing.dash===6,timing);", "check('cycle unchanged / five meteor laps 4–5.2s',Math.abs(timing.flash-15.8)<0.001&&JSON.stringify(timing.dash)===JSON.stringify([4,4.3,4.6,4.9,5.2]),timing);")
source = source.replace("['hero-year-glitch','hero-year-meteors','hero-name-decode']", "['hero-year-glitch','hero-year-meteors','hero-year-twinkle','hero-name-decode']")
source = source.replace("!v1.gsap.gsap.getById('hero-year-meteors')", "!v1.gsap.gsap.getById('hero-year-meteors')&&!v1.gsap.gsap.getById('hero-year-twinkle')")
source = source.replace("      await snap(page,`${width}-${lang}`);", """      check(`${width}-${lang}: five meteors and white transparent star fill`,await page.evaluate(()=>document.querySelectorAll('[data-year-meteor]').length===5&&document.querySelectorAll('[data-year-twinkle] circle').length===1500&&[...document.querySelectorAll('.hero-year-base')].every(x=>getComputedStyle(x).fill.startsWith('url('))));
      await snap(page,`${width}-${lang}`);""")
source = source.replace("      await page.waitForTimeout(250);", """      check('hidden resets twinkle and meteor clocks',await page.evaluate(()=>['hero-year-meteors','hero-year-twinkle'].every(id=>v1.gsap.gsap.getById(id).paused()&&v1.gsap.gsap.getById(id).time()===0)));
      await page.waitForTimeout(250);""")
source = source.replace("      const timing=", """      const twinkleBefore=await page.evaluate(()=>[...document.querySelectorAll('[data-year-twinkle]')].map(x=>getComputedStyle(x).opacity));
      await page.waitForTimeout(1100);
      check('stars twinkle asynchronously at moderate pace',await page.evaluate(before=>{const now=[...document.querySelectorAll('[data-year-twinkle]')].map(x=>getComputedStyle(x).opacity);return now.some((value,i)=>value!==before[i])&&new Set(now).size>3&&v1.gsap.gsap.getById('hero-year-twinkle').getChildren().every(t=>t.duration()>=1.4&&t.duration()<=2.15&&t.vars.repeatDelay>=1.8);},twinkleBefore));
      const timing=""")
source = source.replace("const paused=await page.evaluate(()=>({", "const paused=await page.evaluate(()=>({twinkle:v1.gsap.gsap.getById('hero-year-twinkle').paused()&&v1.gsap.gsap.getById('hero-year-twinkle').time()===0,")
source = source.replace("paused.flash&&paused.dash", "paused.twinkle&&paused.flash&&paused.dash")
(root / 'year-stars/check-browser.mjs').write_text(source, encoding='utf-8')
build = (root / 'check-build.mjs').read_text(encoding='utf-8').replace("const out='outputs/visual-revision-2026-10-09/v1';", "const out='outputs/visual-revision-2026-10-09/v1/year-stars';")
(root / 'year-stars/check-build.mjs').write_text(build, encoding='utf-8')
production = (root / 'check-production.mjs').read_text(encoding='utf-8').replace("const out='outputs/visual-revision-2026-10-09/v1'", "const out='outputs/visual-revision-2026-10-09/v1/year-stars'")
production = production.replace('[data-year-dash]', '.hero-year-head').replace('dash runs continuously', 'meteor runs continuously')
(root / 'year-stars/check-production.mjs').write_text(production, encoding='utf-8')
