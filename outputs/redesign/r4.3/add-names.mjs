import fs from 'node:fs';
for(const lang of ['vi','en']){const p='src/i18n/locales/'+lang+'.json',j=JSON.parse(fs.readFileSync(p));j.education.constellations={saigonUniversity:'Circinus',greenAcademy:'Telescopium',arenaMultimedia:'Pictor'};fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');}
