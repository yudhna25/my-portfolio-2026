# Task 4B.3 — Deep Space Web Audio Engine

**✅ Xong — 07/10/2026.** Build pass (8.52s); lint 0 errors / 2 warnings SplashCursor cũ. Edge 154 / Playwright: **62/62 checks pass**, 0 runtime/console errors, **0 audio requests / 0 bytes MP3/WAV hoặc media audio khác**. Không thêm dependency hay audio asset.

## Implementation

| File | Thay đổi |
| --- | --- |
| `src/lib/audioEngine.js` | Singleton tạo lazy từ thao tác Sound, hai sine oscillator 43.65Hz + 55Hz → lowpass 110Hz/Q 0.5 → drone gain 0.1 → master 0.35. LFO sine 0.07Hz/depth 22Hz điều biến cutoff. |
| `src/lib/audioEngine.js` | Radio click square 1400Hz → highpass 700Hz → lowpass 2600Hz để giảm hài chói → envelope gain 0→0.04→0, attack 0.8ms, dừng tại 5ms. Cooldown 40ms tránh chồng click khi giữ phím. `onended` disconnect các node tạm. |
| `src/lib/audioEngine.js` | `setMuted(boolean)` dùng AudioParam ramp đúng 0.2s, cancel/hold để ngắt được ramp cũ. Mute/tab ẩn đưa gain về 0 rồi suspend sau 220ms; tab hiện lại chỉ resume context đã được cho phép. `disposeAudio` dừng/disconnect sources, gỡ listener, hủy timer và close context; HMR cũng cleanup. |
| `src/stores/useAudioStore.js` | Zustand persist `stellar-audio` lưu `isMuted`. `isStarted` chỉ thuộc phiên hiện tại, không hydrate; lựa chọn ON đã lưu vẫn hiển thị OFF và không tạo context sau reload cho tới khi bấm Sound. Guard async và validate state; storage bị chặn không làm hỏng control. |
| `src/components/ui/SoundToggle.jsx` | Native button `role=switch`, aria-checked/label/status Vi/En, SOUND: [OFF/ON]. Dial SVG 24 khía, gradient kim loại trắng/xám, xoay nhẹ ±28°/0.32s/back.out trong useGSAP; reduced-motion giữ tĩnh. Cleanup audio khi unmount. |
| `Nav.jsx`, `ThemeToggle.jsx`, `Work.jsx` | Gắn Sound vào Nav và radio click vào Menu/Theme/project links. FX không tạo/resume context khi OFF; chỉ phát trên activation, không phát theo hover. |
| `locales/vi.json`, `locales/en.json` | Thêm 7 keys `common.audio`/locale, parity đúng. |

Nav xếp Sound cạnh Menu, label hai dòng trên mobile để giữ target 44px và không tràn 320px. Link Nav inline hiện từ 1280px; kích thước nhỏ hơn dùng Menu sẵn có. Skip link vẫn là Tab đầu; không đổi loading, theme store, architecture 3D hoặc nội dung cũ. Bảo toàn thay đổi đồng thời 4B.1/4B.4.

## Autoplay / permission

Không tạo AudioContext ở module import, mount, hydrate, Menu/Theme khi muted hoặc reload. Khởi tạo đầu tiên cần transient user activation; resume được gọi từ Sound click/Enter/Space. ON lưu trong localStorage **không** tự cấp quyền phát cho lần tải mới. Browser chạy với `--autoplay-policy=user-gesture-required`, không dùng flag bypass autoplay. Đây là cách khởi tạo/resume trong user gesture được nêu trong [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

Ramp dùng [AudioParam.cancelAndHoldAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelAndHoldAtTime) nếu có, fallback giữ giá trị hiện tại trước khi hủy scheduling. Không dùng setInterval, fetch/decodeAudioData, `<audio>`, MP3/WAV hoặc sample buffer.

## Verification

Chạy lại tại project root, dev server :5173 đang chạy:

```powershell
node outputs/task-4b.3/check.mjs
```

Một script [check.mjs](./check.mjs) dùng Playwright đã có trong bundled runtime; kết quả đầy đủ tại [browser-results.json](./browser-results.json). Online instrumentation ghi nhận native context/nodes mà không thay DSP. Offline render chạy **cùng source audioEngine.js**, chỉ dùng adapter context/timestamp để schedule graph trên native OfflineAudioContext, stereo 48kHz / 2s. Không tạo file âm thanh.

Các kiểm tra bao gồm:

- Fresh OFF, context count 0; Menu/Theme OFF không khởi tạo audio. Timer thực sau khi hết user activation không thể start. Sound click → `audioCtx.state === 'running'`, 1 singleton/1 visibility listener.
- Tần số 43.65/55/LFO0.07 đúng trong sai số float AudioParam. Menu/Theme/project link phát đúng một click. Mọi click đã hoàn tất dừng tại 5ms và disconnect.
- OFF về gain 0, state suspended; ramp chính xác 0.2s. Enter/Space hoạt động; 12 lần toggle nhanh không tạo context thứ hai và kết thúc muted.
- Mô phỏng document.hidden: fade/suspend, trở lại visible reuse context đã opt-in. Reload với preference ON vẫn OFF/silent.
- Mount/unmount SoundToggle bằng React StrictMode thật: context closed, listener 0; hai oscillator nền + LFO stop/disconnect. Bật lại tạo một context mới.
- Unsupported AudioContext và resume rejection: control vẫn OFF, status có thông báo; rejection cleanup context. Blocked/corrupt localStorage: control vẫn hoạt động, không hydrate quyền phát.
- UI 320/390/768/1024/1280/1920px không overflow, target cao 44px, Space giữ focus ring 2px/offset4. Reduced-motion không thay đổi rotation. English label/title đúng.
- Theo dõi request URL và response Content-Type: **0 audio requests**; console/page errors: **[]**. Warning THREE.Clock cũ vẫn còn.

## Signal / clipping

| Phép đo | Peak | Peak dBFS | RMS | Kết quả |
| --- | ---: | ---: | ---: | --- |
| Live drone + click lặp trong 120 lượt đo | 0.092175 | −20.71 | 0.038016 | Còn >20dB headroom |
| Offline drone | 0.076967 | −22.27 | 0.036789 | Không sample chạm ±1 |
| Offline 100 click request cùng thời điểm (cooldown) | 0.076967 | −22.27 | 0.036791 | Không stacking/clipping |
| Offline mute tại t=1s | 0.071061 | −22.97 | 0.017223 | Tail sau t=1.22s = **0** |
| Offline ngắt mute/unmute giữa ramp | 0.076967 | −22.27 | 0.035814 | Không clipping/pop lớn |

Max chênh lệch sample liên tiếp: drone ~0.000499; click ~0.005133; các trường hợp đều dưới 0.025. Kết quả xác nhận tín hiệu số không clipping. Chưa đo SPL/độ méo của loa hoặc tai nghe vật lý; mức nghe thực phụ thuộc volume và khả năng tái tạo sub-bass của thiết bị.

## Browser và ảnh

Browser plugin: switch Vi 0→1 khi click, Space trả 0, reload OFF, console errors [].

![Sound ON trên Nav](./browser-sound-on.png)

Ảnh bổ sung: `sound-desktop.png`, `sound-mobile.png`; source trước sửa: `source-baseline.json`. Các lỗi từng gặp ở harness (float precision, interop React và HMR trong fixture offline) đã sửa trước lượt cuối; không bỏ qua application errors.

Skill ui-ux-pro-max được đọc và áp dụng native control/ARIA/focus/target/micro-motion/reduced-motion. Dataset haptic chỉ có match mobile, nên không thêm vibration và không dùng làm chuẩn audio web. Skill clean-code không tồn tại trong các thư mục local đã tìm; lifecycle được triển khai trực tiếp theo Web Audio và quy tắc repo.
