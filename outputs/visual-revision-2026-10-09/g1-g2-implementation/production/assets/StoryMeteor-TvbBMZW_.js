import{r as g,a4 as v,j as f,a as W,a5 as E,a6 as P,a7 as C}from"./useSmoothScroll-BypRy3Sz.js";import{B as H,a as y,D as j,V as M,b as R,P as _,u as k,A as b}from"./events-9ce18a08.esm-d-HC3t5i.js";const S=`
  attribute vec2 aNormal;
  attribute float aSide, aAlong;
  uniform vec2 uViewport;
  uniform float uWidth;
  varying float vAlong, vAcross;
  void main() {
    vAlong = aAlong; vAcross = aSide;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float taper = pow(max(0.0, 1.0 - aAlong), 0.7) * mix(0.28, 1.0, smoothstep(0.0, 0.18, aAlong));
    clip.xy += aNormal * aSide * uWidth * taper / uViewport * clip.w;
    gl_Position = clip;
  }
`,F=`
  uniform float uOpacity, uJourney, uWake;
  varying float vAlong, vAcross;
  float gas(vec2 p) {
    return sin(p.x * 19.0 + sin(p.y * 5.0)) * sin(p.y * 11.0 + p.x * 3.0);
  }
  void main() {
    float a = abs(vAcross);
    float turbulence = gas(vec2(vAlong * 2.0 - uJourney * 7.0, vAcross * 1.8));
    float ridge = exp(-pow((vAcross + turbulence * 0.045) * 7.0, 2.0));
    float sheath = exp(-a * a * 7.0) * (0.55 + turbulence * 0.12);
    float fade = pow(1.0 - vAlong, 1.5) * (1.0 - smoothstep(0.86, 1.0, a));
    float density = mix(ridge * 0.8 + sheath * 0.24, sheath * 0.065, uWake);
    vec3 color = mix(vec3(0.58, 0.89, 0.96), vec3(1.0), ridge * (1.0 - uWake));
    gl_FragColor = vec4(color, density * fade * uOpacity);
  }
`,B=`
  uniform vec3 uHead;
  uniform vec2 uViewport;
  uniform float uDiameter;
  varying vec2 vPixel;
  void main() {
    vec4 clip = projectionMatrix * viewMatrix * vec4(uHead, 1.0);
    vPixel = position.xy * uDiameter * 0.5;
    clip.xy += position.xy * uDiameter / uViewport * clip.w;
    gl_Position = clip;
  }
`,N=`
  uniform float uOpacity, uCore, uHalo, uDiameter, uFlare;
  varying vec2 vPixel;
  void main() {
    float radius = length(vPixel);
    float core = 1.0 - smoothstep(uCore * 0.43, uCore * 0.5, radius);
    float halo = exp(-1.322 * pow(radius / (uHalo * 0.5), 2.0)) * (0.30 + 0.01 * uFlare);
    // Bound the visible light itself; the compositor can expose very faint tails.
    halo *= 1.0 - smoothstep(uHalo * 0.42, uHalo * 0.5, radius);
    vec3 light = vec3(1.0) * (core + halo * (1.0 - core));
    gl_FragColor = vec4(light, uOpacity);
  }
`;function J({layout:O,frozen:V=!1}){const s=g.useRef(null),x=g.useRef(null),D=g.useRef({point:{},pose:{},metrics:{},points:new Float64Array(10),journey:-1,width:0,height:0,range:0}),n=g.useMemo(()=>{const u=new H,a=v*2,c=new Float32Array(a*3),p=new Float32Array(a*2),r=new Float32Array(a),e=new Float32Array(a),o=new Uint16Array((v-1)*6);for(let t=0;t<v;t++)if(r[t*2]=-1,r[t*2+1]=1,e[t*2]=e[t*2+1]=t/(v-1),t<v-1){const d=t*2,i=t*6;o[i]=d,o[i+1]=d+1,o[i+2]=d+2,o[i+3]=d+1,o[i+4]=d+3,o[i+5]=d+2}u.setAttribute("position",new y(c,3).setUsage(j)),u.setAttribute("aNormal",new y(p,2).setUsage(j)),u.setAttribute("aSide",new y(r,1)),u.setAttribute("aAlong",new y(e,1)),u.setIndex(new y(o,1));const m=()=>({uOpacity:{value:0},uViewport:{value:new M(1,1)},uWidth:{value:76},uJourney:{value:0},uWake:{value:0}}),l=m(),h=m();return h.uWake.value=1,{geometry:u,head:new _(2,2),screen:new Float64Array(v*2),ribbon:l,wake:h,headUniforms:{uHead:{value:new R},uOpacity:{value:0},uViewport:{value:new M(1,1)},uCore:{value:56},uHalo:{value:208},uDiameter:{value:332.8},uFlare:{value:0}}}},[]);return g.useEffect(()=>(x.current=n,()=>{x.current=null,n.geometry.dispose(),n.head.dispose()}),[n]),k(({camera:u,size:a})=>{const c=x.current;if(!c||!s.current)return;const p=W.getState(),r=O.current,e=D.current,o=s.current.children[0].material.uniforms,m=s.current.children[1].material.uniforms,l=s.current.children[2].material.uniforms,h=E(p.storyChapter,p.chapterProgress);if(s.current.visible=!V&&!document.hidden&&r?.range>0&&h>0,!s.current.visible){e.journey=-1;return}const t=(p.storyChapter==="departure"?1:0)+p.chapterProgress;let d=t!==e.journey||r.width!==e.width||r.height!==e.height||r.range!==e.range;for(let w=0;w<r.points.length;w++)r.points[w]!==e.points[w]&&(d=!0);d&&(u.updateMatrixWorld(),P(r,t,c.geometry.attributes.position.array,c.geometry.attributes.aNormal.array,c.screen,u.matrixWorldInverse.elements,u.projectionMatrix.elements,e.point,e.pose,e.metrics),c.geometry.attributes.position.needsUpdate=c.geometry.attributes.aNormal.needsUpdate=!0,l.uHead.value.fromArray(c.geometry.attributes.position.array),e.journey=t,e.width=r.width,e.height=r.height,e.range=r.range,e.points.set(r.points));const i=a.width<768,A=p.storyChapter==="experience"?C(r,p.chapterProgress):0;m.uViewport.value.set(a.width,a.height),m.uWidth.value=i?68:112,m.uJourney.value=t,m.uOpacity.value=h,o.uViewport.value.set(a.width,a.height),o.uWidth.value=i?116:216,o.uJourney.value=t,o.uOpacity.value=h,l.uViewport.value.set(a.width,a.height),l.uCore.value=i?34:56,l.uHalo.value=(i?116:208)+A*(i?20:24),l.uDiameter.value=l.uHalo.value*1.6,l.uFlare.value=A,l.uOpacity.value=h,s.current.userData.journey=t,s.current.userData.tailPixels=e.metrics.tailPixels,s.current.userData.span=e.metrics.span,s.current.userData.flare=A}),f.jsxs("group",{ref:s,name:"story-meteor",visible:!1,children:[f.jsx("mesh",{name:"story-meteor-wake",geometry:n.geometry,frustumCulled:!1,renderOrder:20,children:f.jsx("shaderMaterial",{vertexShader:S,fragmentShader:F,uniforms:n.wake,transparent:!0,blending:b,depthWrite:!1,depthTest:!1,toneMapped:!1})}),f.jsx("mesh",{name:"story-meteor-trail",geometry:n.geometry,frustumCulled:!1,renderOrder:21,children:f.jsx("shaderMaterial",{vertexShader:S,fragmentShader:F,uniforms:n.ribbon,transparent:!0,blending:b,depthWrite:!1,depthTest:!1,toneMapped:!1})}),f.jsx("mesh",{name:"story-meteor-head",geometry:n.head,frustumCulled:!1,renderOrder:22,children:f.jsx("shaderMaterial",{vertexShader:B,fragmentShader:N,uniforms:n.headUniforms,transparent:!0,blending:b,depthWrite:!1,depthTest:!1,toneMapped:!1})})]})}export{J as StoryMeteor};
