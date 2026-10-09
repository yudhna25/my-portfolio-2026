import fs from 'node:fs';
const additions = {
vi: { selectLabel: 'Chọn dự án', interactionHint: 'Di chuột hoặc dùng Tab để xem. Chạm / nhấn để giữ lựa chọn; chạm lại, chạm nền hoặc Escape để bỏ chọn.', readerPending: 'Case study nội bộ đang được chuẩn bị.', behanceReference: 'Tham khảo trên Behance', comingSoon: 'Case study sắp ra mắt', constellations: { edura: 'Centaurus', veris: 'Gemini', vie: 'Cygnus' }, alts: ['Ảnh giới thiệu dự án EDURA LMS', 'Ảnh giới thiệu ứng dụng VERIS', 'Ảnh nhận diện thương hiệu nước hoa VIE'] },
en: { selectLabel: 'Select a project', interactionHint: 'Hover or Tab to preview. Tap / press to keep a selection; tap again, tap the background or press Escape to clear.', readerPending: 'The internal case study is being prepared.', behanceReference: 'Reference on Behance', comingSoon: 'Case study coming soon', constellations: { edura: 'Centaurus', veris: 'Gemini', vie: 'Cygnus' }, alts: ['EDURA LMS project cover', 'VERIS app project cover', 'VIE perfume brand identity cover'] }
};
for(const lang of ['vi','en']) {
 const file='src/i18n/locales/'+lang+'.json', data=JSON.parse(fs.readFileSync(file)), {alts,...copy}=additions[lang];
 delete data.works.filters; delete data.works.filterLabel; delete data.works.targetLocked;
 Object.assign(data.works,copy);
 ['eduraLms','verisApp','viePerfume'].forEach((key,index)=>data.works.projects[key].previewAlt=alts[index]);
 fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
}
