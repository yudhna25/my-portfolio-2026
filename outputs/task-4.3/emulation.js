(() => {
 const requested=new URLSearchParams(location.search).get('reducedMotion');
 const nativeMatch=window.matchMedia.bind(window), queries=new Map(), originals=new Map();
 const qa=window.motionAudit={mode:requested?'simulated':'os',preference:requested,events:[],errors:[],preloader:[]};
 window.addEventListener('error',e=>qa.errors.push(e.message));
 window.addEventListener('unhandledrejection',e=>qa.errors.push(String(e.reason)));
 if(requested) {
  window.matchMedia=query=>{
   if(!query.includes('prefers-reduced-motion')) return nativeMatch(query);
   if(queries.has(query)) return queries.get(query);
   const listeners=new Set();
   const q={media:query,get matches(){return query.includes('no-preference')?qa.preference==='no-preference':qa.preference==='reduce';},onchange:null,
    addEventListener:(type,fn)=>{if(type==='change')listeners.add(fn);},removeEventListener:(type,fn)=>{if(type==='change')listeners.delete(fn);},
    addListener:fn=>listeners.add(fn),removeListener:fn=>listeners.delete(fn),dispatchEvent:event=>{listeners.forEach(fn=>typeof fn==='function'?fn(event):fn.handleEvent(event));q.onchange?.(event);return true;}};
   queries.set(query,q);return q;
  };
  qa.css=()=>{
   const walk=rules=>Array.from(rules).forEach(rule=>{
    if(rule.type===4 && (originals.get(rule)||rule.media.mediaText).includes('prefers-reduced-motion')) {
     if(!originals.has(rule)) originals.set(rule,rule.media.mediaText);
     rule.media.mediaText=originals.get(rule).replace(/\(prefers-reduced-motion:\s*(reduce|no-preference)\)/g,(_,p)=>p===qa.preference?'(min-width:0px)':'(max-width:0px)');
    }
    if(rule.cssRules)walk(rule.cssRules);
   });
   for(const sheet of document.styleSheets){try{walk(sheet.cssRules);}catch{ /* Cross-origin font CSS has no motion rules. */ }}
  };
  qa.set=preference=>{qa.preference=preference;qa.css();queries.forEach(q=>{q.dispatchEvent({matches:q.matches,media:q.media});});};
 }
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 qa.events.push({time:performance.now(),matches:media.matches,initial:true});
 media.addEventListener('change',e=>qa.events.push({time:performance.now(),matches:e.matches,initial:false}));
 const observer=new MutationObserver(records=>{
  for(const record of records) {
   for(const n of record.addedNodes) { const e=n.nodeType===1?(n.matches('[data-preloader]')?n:n.querySelector('[data-preloader]')):null;if(e)qa.preloader.push({kind:'mount',time:performance.now()}); }
   for(const n of record.removedNodes) { const e=n.nodeType===1?(n.matches('[data-preloader]')?n:n.querySelector('[data-preloader]')):null;if(e)qa.preloader.push({kind:'remove',time:performance.now()}); }
  }
 });
 observer.observe(document,{childList:true,subtree:true});
})();