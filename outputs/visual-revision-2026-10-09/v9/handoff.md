# V9 — bàn giao tích hợp, chờ G3

Ngày 13/10/2026. G2 đã được người dùng duyệt trong lệnh V9. V9 chỉ triển khai finale Works → Contact; V10 chưa được phép bắt đầu.

## Phạm vi và điểm nối

- Giữ React/R3F/GSAP/Zustand hiện có. Không thêm dependency, physics engine, Canvas, composer hoặc camera writer.
- App và Lab dùng finale 400vh; reduced/fallback là 0vh. Lab dùng Contact DOM thật để review endpoint.
- CameraRig vẫn là writer duy nhất. cameraPath giữ Works và các chương trước; chỉ đổi Contact aim và thời lượng finale. Từ p=.44 đến Contact, camera giữ cùng pose.
- Producer/store/route và worksOrbit không đổi. Orbit origin capture khi lần đầu vào finale p>0; phase/selection snapshot cũ được giữ khi đảo hướng.
- Contact chỉ đổi lớp nền panel thành gradient trong. Không đổi nội dung, layout, terminal, link, CTA, clipboard hoặc audio. Footer và các section khác không redesign.

## Contract đang chạy

| Dữ liệu / owner | Consumer / file | Hành vi |
|---|---|---|
| storyChapter/chapterProgress — producer useScrollProgress | finaleState, cameraPath, Work, Contact, BH, particles | Một clock 0..1, không tween vụ nổ sau scroll |
| worksOrbit.origin — syncWorksOrbit trong store | WorksConstellations, gas, particles | Capture một lần mỗi lượt rời Works; giữ qua reverse/resize/locale |
| finaleState — utils/finale.js | Tất cả consumer finale | Mốc .12/.34/.44/.70/.96; Contact opacity bắt đầu .96 |
| uFinaleScale — BlackHole.jsx | Ray shader qua portalRayUV | Phóng hướng tia trước RK4, target vẫn đủ drawing buffer; nominal 54vh, actual core khoảng 56–59vh do chiếu phối cảnh |
| uFinaleGas/cloud/collapse/flare/progress — BlackHole.jsx | BLACK_HOLE_COPY | Hai shock shells + ba lát khí; đồng tâm uRayCenter, góc từ captured origin |
| uFinaleHole — BlackHole.jsx | Copy và bloom mask | Hấp thụ khí phía sau từ lúc lõi hình thành; không để lõi trong như bóng ma |
| Seed Float32Array — buildFinaleSeeds | FinaleParticles | 800/1600/2600 hạt, prefix cùng seed khi đổi tier, không tích phân simulation |
| uTime — BlackHole.jsx | Chỉ khí ambient của disk | Tiếp tục chạy trong App theo yêu cầu trước; Lab freeze ambient để so hình chính xác |

World center vẫn là BLACK_HOLE_CENTER. Works basis chuyển về cùng điểm này, shader chiếu chính điểm đó thành uRayCenter, particles đặt tại cùng world center. Không có BH thứ hai.

## Patch tích hợp

11 file source sửa + 1 component mới, liệt kê trong scope-audit.json; 111 hash baseline giữ nguyên. Không có patch rời phải apply. Mọi thay đổi đã nằm trong working tree hiện có; các thay đổi từ phiên trước được giữ. Không commit/push trong V9.

## Cách review

Mở review.html để xem clip desktop tới/lùi, clip mobile và các ảnh checkpoint. Bản production cục bộ: http://127.0.0.1:5215/#work. Lab: http://127.0.0.1:5214/3d-lab.html?story=1&chapter=finale&p=0.44. Các URL cần server local đang chạy; toàn bộ media tham chiếu bằng đường dẫn tương đối trong thư mục V9.

Duyệt G3 dựa trên: quy mô wave và dark field; sự liên tục khí→disk cùng tâm; core lớn ở endpoint; Contact dễ đọc; cuộn ngược hoàn nguyên. Chỉ khi người dùng duyệt G3 mới chạy V10.

## Giới hạn

Đây là chuyển động cinematic theo progress, không phải mô phỏng va chạm sao/GRMHD. Gas là các lát procedural; hạt có độ sâu phối cảnh thật nhưng quỹ đạo được đạo diễn. Ray tracing Schwarzschild/HDR hiện có được tái sử dụng, không phải dữ liệu mô phỏng NASA. Đọc verification.md để xem số đo và giới hạn performance/hardware.
