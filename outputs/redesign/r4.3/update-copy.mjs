import fs from 'node:fs';
const vi={mapNote:'Ba hướng học tập song song, cùng nuôi dưỡng tư duy thiết kế.',interactionHint:'Di chuột hoặc dùng Tab để đánh thức một chòm sao. Chạm để chọn; chạm nền hoặc Escape để bỏ chọn.',clearSelection:'Tan về nền sao'};
const en={mapNote:'Three overlapping paths of study, shaping one design practice.',interactionHint:'Hover or use Tab to awaken a constellation. Tap to select; tap the background or press Escape to clear.',clearSelection:'Return to the star field'};
for(const [lang,copy] of Object.entries({vi,en})){const p='src/i18n/locales/'+lang+'.json',j=JSON.parse(fs.readFileSync(p));Object.assign(j.education,copy);fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');}
