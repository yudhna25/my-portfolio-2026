# R3.1 → R3.2

08/10/2026. R3.1 cleanup hoàn thành. Chỉ bàn giao; phiên này không chạy R3.2.

- App giữ một GalaxyScene, hiện vẫn `story=false`. Planet/OrbitalSkills và refs/props/windows/pause cũ đã gỡ; scene children API còn vì LabTelemetry dùng. Không khôi phục các module đã bỏ.
- Dark cố định ở HTML/body/bootstrap/CSS/store; không còn ThemeToggle hoặc light actions. Sound ở Nav, Lang ở Menu; Cursor/VIEW/magnetic/lens vẫn dùng listener/cleanup cũ. Lens selector thêm `.avatar-img`; map R/G là displacement data, không phải accent UI.
- GalaxyScene chỉ bỏ Constellations cũ/StardustWake. Giữ StarField, ShootingStars trắng, WorksConstellations mới, PortalBackdrop, HDR/bloom/mask, chất lượng/hidden/fallback. Không thay CameraRig/cameraPath/store progress/R2 renderer. Dùng contract R2.1 và portal R2.2 hiện có khi tích hợp Hero.
- DOM IDs còn: `hero`, `about`, `skills`, `education`, `experience`, `work`, `transmission`, Footer `contact`. Navigation vẫn dùng `transmission` cho section Contact. Không phục hồi Playground/marquee.
- Bootstrap chỉ đổi `stellar-theme` → dark. Không đụng `stellar-audio` hoặc Lang. Metadata/PWA registration/config/icons/public images giữ nguyên, ngoài theme bootstrap.

## Phần còn chờ owner section

| Owner | Phần đang giữ tạm |
|---|---|
| R3.2 | Hero production vẫn tên lớn/BH lớn/quỹ đạo camera legacy; chưa PORTFOLIO/year/O cuối/portal/glitch mới. Nối vào shared story contract, không tạo camera/Canvas khác. |
| R3.3 | About giữ nội dung/caption/tools/năng lực cũ và avatar có halo nhúng; chưa đổi sang cutout R0.2, chưa làm grayscale→màu hoặc text decode mới. |
| R4 | Dataset tools/năng lực nguyên hash; Skills tạm là 10 nhãn static + ba nhóm nội dung cũ. Không còn orbit/pause/vector map cũ. R4 sở hữu bố cục/logos/liên kết thật và chuyển tools khỏi About. |
| R4/R5.1 | Education/Experience chỉ đổi mặt kính/màu; chưa có chòm sao/meteor dẫn chuyện mới. |
| R5.2 | Work grid/filter/action/reticle giữ hành vi cũ, mono; EDURA vẫn Behance, chưa reader nội bộ. VERIS/VIE vẫn disabled. Chưa preview/ba chòm production. |
| R7.1/R7.2 | Contact terminal/equalizer/copy/mail/contactProgress legacy còn nguyên, mono. Thay ở task riêng; copy failure/timeout cũ đã được R0.1 nêu, chưa sửa trong cleanup. |

Các vùng nội dung hiện có dùng nền tối đặc thay kính để chữ đọc được khi BH legacy sáng phía sau. Đây là styling tạm của wrapper sẵn có, không HUD mới; không cần giữ wrapper khi section được redesign. Giữ tương phản khi thay bố cục/camera.

Xem [verification](verification.md), [integrity](integrity.json) và [caller audit](caller-audit.md). Lệnh nhỏ để kiểm nền/ownership: `node tools/check-stores.mjs`, `node outputs/redesign/r3.1/verify-integrity.mjs`.
