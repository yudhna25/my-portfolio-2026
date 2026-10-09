import fs from 'node:fs';
for (const lang of ['vi','en']) {
 const file=`src/i18n/locales/${lang}.json`,locale=JSON.parse(fs.readFileSync(file));
 locale.about.portraitToggle=lang==='vi'?'Giữ màu chân dung':'Keep portrait in color';
 locale.about.portraitHint=lang==='vi'?'Di chuột hoặc dùng Tab để xem màu. Chạm để bật hoặc tắt màu.':'Hover or use Tab to reveal color. Tap to keep or turn off color.';
 fs.writeFileSync(file,JSON.stringify(locale,null,2)+'\n');
}