import fs from 'node:fs';
const base='src/i18n/locales/';
for (const lang of ['vi','en']) {
 const path=base+lang+'/lab.json'; const data=JSON.parse(fs.readFileSync(path,'utf8'));
 if (lang==='vi') {
  data.scene='Hố đen mono với ánh sáng bị bẻ cong, camera tiến sát đĩa bồi tụ';
  data.quality={high:'Cao — 24k sao',medium:'Trung bình — 12k',low:'Thấp — 6k'};
  data.running='Cuộn trang để lượn qua trường sao và bay sát mặt đĩa bồi tụ.';
  data.start.description='Camera khởi đầu gần hố đen, giữa trường sao 24.000 điểm. Cuộn xuống để quan sát ánh sáng bị bẻ cong từ nhiều góc nhìn.';
  data.travel.description='Camera lượn trái–phải–trái–phải–trái. Sao lớn lên rất nhẹ khi tiến tới, các dải khí nóng xoay nhanh hơn ở phía trong.';
  data.end.description='Ánh sáng phía trước đi ngang bóng hố đen, phía sau bị uốn thành hai cung. Camera dừng ngay trên mặt đĩa phát sáng, với hố đen bên phải.';
 } else {
  data.scene='Monochrome black hole with bent light and a camera approaching the accretion disk';
  data.quality={high:'High — 24k stars',medium:'Medium — 12k',low:'Low — 6k'};
  data.running='Scroll to weave through the stars and fly just above the accretion disk.';
  data.start.description='The camera starts close to the black hole amid 24,000 stars. Scroll down to observe bent light from changing viewpoints.';
  data.travel.description='The camera weaves left–right–left–right–left. Stars grow very slightly on approach; hot gas lanes rotate faster near the center.';
  data.end.description='Foreground light crosses the shadow while the rear disk bends into two arcs. The camera stops just above the emitting disk, with the black hole on the right.';
 }
 fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');
}
