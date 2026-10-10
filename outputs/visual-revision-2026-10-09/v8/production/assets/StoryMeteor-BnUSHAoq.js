import{r as g,a4 as v,j as h,a as W,a5 as E,a6 as P}from"./useSmoothScroll-BLZjN79x.js";import{B as R,a as y,D as b,V as j,b as C,P as F,u as _,A}from"./events-9ce18a08.esm-DVZH2Ekb.js";const M=`
  attribute vec2 aNormal;
  attribute float aSide, aAlong;
  uniform vec2 uViewport;
  uniform float uWidth;
  varying float vAlong, vAcross;
  void main() {
    vAlong = aAlong; vAcross = aSide;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float taper = pow(max(0.0, 1.0 - aAlong), 0.7) * mix(0.12, 1.0, smoothstep(0.0, 0.18, aAlong));
    clip.xy += aNormal * aSide * uWidth * taper / uViewport * clip.w;
    gl_Position = clip;
  }
`,S=`
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
`,k=`
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
  uniform float uOpacity, uCore, uDiameter;
  varying vec2 vPixel;
  void main() {
    float radius = length(vPixel);
    float core = 1.0 - smoothstep(uCore * 0.43, uCore * 0.5, radius);
    float halo = pow(max(0.0, 1.0 - radius / (uDiameter * 0.5)), 2.8) * 0.30;
    vec3 light = vec3(1.0) * core + vec3(0.64, 0.91, 0.98) * halo * (1.0 - core);
    gl_FragColor = vec4(light, uOpacity);
  }
`;function U({layout:O,frozen:V=!1}){const n=g.useRef(null),x=g.useRef(null),D=g.useRef({point:{},pose:{},metrics:{},points:new Float64Array(10),journey:-1,width:0,height:0,range:0}),s=g.useMemo(()=>{const u=new R,a=v*2,l=new Float32Array(a*3),f=new Float32Array(a*2),r=new Float32Array(a),e=new Float32Array(a),o=new Uint16Array((v-1)*6);for(let t=0;t<v;t++)if(r[t*2]=-1,r[t*2+1]=1,e[t*2]=e[t*2+1]=t/(v-1),t<v-1){const c=t*2,i=t*6;o[i]=c,o[i+1]=c+1,o[i+2]=c+2,o[i+3]=c+1,o[i+4]=c+3,o[i+5]=c+2}u.setAttribute("position",new y(l,3).setUsage(b)),u.setAttribute("aNormal",new y(f,2).setUsage(b)),u.setAttribute("aSide",new y(r,1)),u.setAttribute("aAlong",new y(e,1)),u.setIndex(new y(o,1));const d=()=>({uOpacity:{value:0},uViewport:{value:new j(1,1)},uWidth:{value:76},uJourney:{value:0},uWake:{value:0}}),p=d(),m=d();return m.uWake.value=1,{geometry:u,head:new F(2,2),screen:new Float64Array(v*2),ribbon:p,wake:m,headUniforms:{uHead:{value:new C},uOpacity:{value:0},uViewport:{value:new j(1,1)},uCore:{value:16},uDiameter:{value:80}}}},[]);return g.useEffect(()=>(x.current=s,()=>{x.current=null,s.geometry.dispose(),s.head.dispose()}),[s]),_(({camera:u,size:a})=>{const l=x.current;if(!l||!n.current)return;const f=W.getState(),r=O.current,e=D.current,o=n.current.children[0].material.uniforms,d=n.current.children[1].material.uniforms,p=n.current.children[2].material.uniforms,m=E(f.storyChapter,f.chapterProgress);if(n.current.visible=!V&&!document.hidden&&r?.range>0&&m>0,!n.current.visible){e.journey=-1;return}const t=(f.storyChapter==="departure"?1:0)+f.chapterProgress;let c=t!==e.journey||r.width!==e.width||r.height!==e.height||r.range!==e.range;for(let w=0;w<r.points.length;w++)r.points[w]!==e.points[w]&&(c=!0);c&&(u.updateMatrixWorld(),P(r,t,l.geometry.attributes.position.array,l.geometry.attributes.aNormal.array,l.screen,u.matrixWorldInverse.elements,u.projectionMatrix.elements,e.point,e.pose,e.metrics),l.geometry.attributes.position.needsUpdate=l.geometry.attributes.aNormal.needsUpdate=!0,p.uHead.value.fromArray(l.geometry.attributes.position.array),e.journey=t,e.width=r.width,e.height=r.height,e.range=r.range,e.points.set(r.points));const i=a.width<768;d.uViewport.value.set(a.width,a.height),d.uWidth.value=i?48:76,d.uJourney.value=t,d.uOpacity.value=m,o.uViewport.value.set(a.width,a.height),o.uWidth.value=i?84:160,o.uJourney.value=t,o.uOpacity.value=m,p.uViewport.value.set(a.width,a.height),p.uCore.value=i?10:16,p.uDiameter.value=i?52:80,p.uOpacity.value=m,n.current.userData.journey=t,n.current.userData.tailPixels=e.metrics.tailPixels,n.current.userData.span=e.metrics.span}),h.jsxs("group",{ref:n,name:"story-meteor",visible:!1,children:[h.jsx("mesh",{name:"story-meteor-wake",geometry:s.geometry,frustumCulled:!1,renderOrder:20,children:h.jsx("shaderMaterial",{vertexShader:M,fragmentShader:S,uniforms:s.wake,transparent:!0,blending:A,depthWrite:!1,depthTest:!1,toneMapped:!1})}),h.jsx("mesh",{name:"story-meteor-trail",geometry:s.geometry,frustumCulled:!1,renderOrder:21,children:h.jsx("shaderMaterial",{vertexShader:M,fragmentShader:S,uniforms:s.ribbon,transparent:!0,blending:A,depthWrite:!1,depthTest:!1,toneMapped:!1})}),h.jsx("mesh",{name:"story-meteor-head",geometry:s.head,frustumCulled:!1,renderOrder:22,children:h.jsx("shaderMaterial",{vertexShader:k,fragmentShader:N,uniforms:s.headUniforms,transparent:!0,blending:A,depthWrite:!1,depthTest:!1,toneMapped:!1})})]})}export{U as StoryMeteor};
