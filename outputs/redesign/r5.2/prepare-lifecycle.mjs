import fs from 'node:fs';let text=fs.readFileSync('outputs/redesign/r5.2/verify-lifecycle.mjs','utf8');
text=text.replace("assert.equal(mounted.story.chapter, 'experience');", "assert.equal(mounted.story.chapter, 'works');");
text=text.replace("assert.equal(mounted.meteor.visible, true);", "assert.equal(mounted.meteor.visible, false);");
text=text.replace('assert(mounted.meteor.uniforms.headOpacity > 0);','assert.equal(mounted.meteor.uniforms.headOpacity, 0);');
text=text.replace('meteor: {\n          visible:', "works: { visible: works.root.visible, groups: works.root.children.length, phase: state.worksOrbit.phase },\n        meteor: {\n          visible:");
text=text.replace('assert.equal(mounted.canvas, 1);', 'assert.equal(mounted.canvas, 1);\n    assert.equal(mounted.works.visible, true);\n    assert.equal(mounted.works.groups, 4);\n    assert(Number.isFinite(mounted.works.phase));');
fs.writeFileSync('outputs/redesign/r5.2/verify-lifecycle.mjs',text);
