import fs from 'node:fs';
const out='outputs/redesign/r6.1',pack=JSON.parse(fs.readFileSync('outputs/redesign/r0.3/content-index.json'));
const blocks=pack.sections.flatMap(s=>s.blocks).filter(b=>b.status==='ready');
const selected=JSON.parse(fs.readFileSync(out+'/selected-assets.json')).assets;
const owner=JSON.parse(fs.readFileSync(out+'/owner-addendum.json')).facts;
const controls={
  vi:{eyebrow:'Thiết kế sản phẩm · Concept & prototype',skip:'Đi đến nội dung dự án',return:'Trở lại dự án',viewOriginal:'Xem ảnh gốc',behance:'Hồ sơ dự án trên Behance',decisions:'Các quyết định UI',artifacts:'Giao diện và định hướng',reflection:'Nhìn lại đồ án',results:'Thiết kế được thể hiện dưới dạng concept và prototype UI/UX trên Figma.'},
  en:{eyebrow:'Product Design · Concept & prototype',skip:'Skip to project content',return:'Back to projects',viewOriginal:'View original image',behance:'Source project on Behance',decisions:'UI decisions',artifacts:'Interface and direction',reflection:'Project reflection',results:'The design takes the form of a UI/UX concept and Figma prototype.'},
};
const captions={
  vi:['Bản tổng quan giao diện EDURA; số liệu trong mockup là dữ liệu minh họa.','Cách đặt vấn đề trong tài liệu concept EDURA.','Định hướng giải pháp của concept EDURA. Trích dẫn trong slide là thông điệp thiết kế.'],
  en:['EDURA interface overview; figures within the mockup are sample interface data.','The problem as framed in the EDURA concept materials.','The EDURA concept’s proposed solution. The quote in this slide is a design statement.'],
};
for(const lang of ['vi','en']){
  const path=`src/i18n/locales/${lang}.json`,locale=JSON.parse(fs.readFileSync(path)),copy={};
  for(const b of blocks){const [section,key]=b.id.split('.');copy[section]??={};copy[section][key]={heading:b.heading[lang],body:b.body[lang]};}
  Object.assign(copy,{eyebrow:controls[lang].eyebrow,skip:controls[lang].skip,return:controls[lang].return,viewOriginal:controls[lang].viewOriginal,behance:controls[lang].behance,context:owner[0][lang]});
  copy.decisions.heading=controls[lang].decisions;copy.artifacts.heading=controls[lang].artifacts;
  copy.results.deliverables.body=controls[lang].results;
  copy.reflection={heading:controls[lang].reflection,prototype:owner[1][lang],references:owner[2][lang]};
  copy.figures=Object.fromEntries(selected.map((a,i)=>{const id=['overview','problem','solution'][i];return[id,{alt:a.alt[lang],caption:captions[lang][i],name:a.classification==='edura-ui-overview'?copy.artifacts.overview.heading:a.id==='A07'?copy.problem.framing.heading:copy.artifacts.direction.heading}];}));
  delete copy.artifacts.overview.heading;delete copy.artifacts.direction.heading;
  locale.edura=copy;fs.writeFileSync(path,JSON.stringify(locale,null,2)+'\n');
}
for(const a of selected){fs.mkdirSync('public/projects/edura',{recursive:true});fs.copyFileSync(a.sourcePath,a.recommendedPublicPath);}
fs.writeFileSync(out+'/copy-provenance.json',JSON.stringify({blocks:blocks.map(b=>({id:b.id,claims:b.claimIds,assets:b.assetIds,status:b.status})),ownerAddendum:'owner-addendum.json',overrides:{'results.deliverables.body':'C04 owner-confirmed concept/Figma prototype; remove audit-process prose','figures.*.caption':'Concise factual captions preserving original restrictions'},omitted:['results.evaluation','Complete walkthrough','Design-system tokens/components','Measured outcomes','Invented lesson or recovery']},null,2));
