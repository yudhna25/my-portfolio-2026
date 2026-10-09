# R4.3 — Read-only integration review

08/10/2026. Đọc bản tích hợp Education/App/SkillsSymbols/store/anchor/camera. Không sửa source. **Mục đầu là lịch sử review bản tích hợp đầu tiên; các vấn đề 1–3 đã được root sửa và đối chiếu lại source ở phần “Trạng thái hiện tại” cuối file.** Rủi ro focus chưa tái hiện không được gọi là lỗi render.

## Lịch sử phát hiện ở bản tích hợp đầu tiên

1. **HTML content model — đã sửa.** Ở bản đầu, `<h3>` là con trực tiếp của `<button>`. Button chỉ cho phrasing content; heading là flow content. Bản hiện tại đã chuyển period/constellation là sibling trước; `<h3 className="..."><button ... className="min-h-11 ...">school name</button></h3>`; degree và description là sibling sau. H3 giữ typography, button giữ handlers/focus/aria-pressed/target44px; không thêm role/custom keyboard.

2. **Chapter entry clear — source-level event-order risk.** `useEffect(() => { if (!active) clear(); return clear; }, [active, clear])` cleanup gọi clear cả lúc chapter chuyển false→true. Native Tab có thể focus/set focus-channel trước scroll producer cập nhật chapter; cleanup sau đó xóa state nhưng focus native không đổi. Test Tab thực từ cuối Skills đến school đầu Education. Nếu tái hiện, bỏ `return clear` trong effect active; observer/useGSAP cleanup đã clear khi unmount. Đây là sửa root cause, không cần timeout/refocus trong section.

3. **Locale while focused — source-level risk.** Locale-dependent useGSAP observer cleanup gọi clear; observer mới chỉ reobserve/sync, không phục hồi focus đang ở school. Locale toggle giữ native :focus-visible nhưng có thể mất active constellation cho đến Tab/Enter tiếp theo. Test đổi Vi/En khi native focus giữ tại school, không dùng store manual. Cách nhỏ hơn restore state: observer không cần teardown trên locale (elements keyed stable, IntersectionObserver tự theo bounds); bỏ locale dependency tại observer effect, vẫn refresh khi locale đổi qua effect riêng hoặc app refresh có sẵn. `useSectionAnchor` hiện ResizeObserver(content, element)+ScrollTrigger refresh nên source không yêu cầu lifecycle observer theo locale. Kiểm lại source với Browser trước khi chọn fix.

4. **Keyboard label vs stage visibility — verification watch.** Các stage nằm trước label button. Native focus phải giữ stage còn ít nhất một phần trong viewport; nếu Tab làm button visible nhưng stage hoàn toàn phía trên viewport, IO false làm renderer tắt mặc dù button focus. Test 320/390/768 full native Tab từng school, screenshot có cả chòm và label. Chưa chứng minh là lỗi, không thêm auto-scroll khi bằng chứng chưa cần.

## Những phần hiện đạt ở source

- Ba target đúng `saigonUniversity→Circinus`, `greenAcademy→Telescopium`, `arenaMultimedia→Pictor`. Checker source mapping/positions/context/edges/copy vẫn dùng được sau tích hợp; geometry không đổi. Data array dùng thứ tự không gian SGU/Green/Arena, semantic `ul` và period cùng tồn tại, không nối timeline tuyến tính.
- Store active ưu tiên **focus→touch selection→hover**, cập nhật anchorId từ active target, không lấy hover thấp ưu tiên làm đổi anchor khi school khác đang focus. One-target state; rejected channel/ID guarded. Clear không đổi anchor cuối nên pool return về đúng vùng cũ; target=null không tự khôi phục selection.
- IO map key theo stageID, active stage offscreen clear rồi setVisible(false); subscribe sync có guard state visible nên không lặp vô hạn. IO cleanup disconnect/unsubscribe; store retained metadata anchor cuối là có chủ đích. Swap anchor reference đổi thì shared `useSectionAnchor` đo lại window và cleanup observer cũ.
- App stable ref map, bridge chọn Skills hoặc Education trong **một SymbolStars**; không thêm Canvas/composer/camera writer. R4.1 stage renderer giữ pool192, exact base reset, no per-frame React state; reduced frozen endpoint. Production root đầu đủ refs; không cần defensive fallback dành cho caller giả không tồn tại.
- Escape clear nhưng giữ focus, Enter/Space native click(detail0) có thể bật lại focus channel; touch tap item chọn/tap lại clear, tap nền clear. Background predicate không vô tình clear khi click school/clear control. Pointer pen/touch không fake-hover/focus channel. Root background clear không tự blur native focus.
- Name/period/degree/description vẫn luôn DOM ở mọi mode và WebGL fallback; không ScrollTrigger opacity entrance ẩn nội dung. Labels gradients nhường nền tối, không border/panel quanh mỗi school. Header/labels trắng-xám, không cyan/amber.
- Camera chỉ thay EDUCATION endpoint chung `[2,5,-154,-42,-28,-200]`; section/store/bridge không write camera. Skills→Education và Education→Experience tiếp tục cùng constants; observer radius ngoài chân trời. Bố cục desktop `lg:min-h175vh`, ba grid nhánh bất đối xứng; mobile stack có stage lớn chứ không scale toàn map.

## Giới hạn review

Read-only code review và source checker không thay Browser chứng minh final layout/interaction/IO/framebuffer. Exact geometry đã xác minh; real projection pixel→DOM anchor, camera read zones, lifecycle và native focus phải đối chiếu browser-results/screenshot của root hoặc Browser agent. Không dùng screenshot storyboard R1.1 làm bằng chứng production.

## Trạng thái hiện tại — source đã đối chiếu lại sau fix

- Đã đọc lại `src/components/Education.jsx`, `src/stores/useEducationStore.js` và `src/3d/components/SkillsSymbols.jsx` sau thông báo freeze của root. **Không còn blocker đã xác nhận trong phạm vi code review này.** Đây không phải kết luận thay Browser DoD.
- Finding1 resolved: mỗi H3 bao một button chỉ có tên trường; period/constellation/degree/description là sibling semantic. Button native ≥44px và aria-pressed/keyboard/focus giữ nguyên. Không còn heading con của button.
- Finding2 resolved ở source: active effect chỉ `if (!active) clear()`, không return cleanup clear khi false→true. Observer unmount cleanup vẫn clear nên không mất cleanup thật.
- Finding3 resolved ở source: IO setup không phụ thuộc locale và không teardown/clear khi đổi Vi/En; một useGSAP locale khác chỉ refresh ScrollTrigger. Shared anchor RO/refresh tiếp tục đo layout. Native focus cần Browser xác nhận sau đổi locale, không thêm restore focus nhân tạo.
- Mobile grid hiện 1cột, desktop lg12cột; stage mobile92%/88%/84% chiều ngang, nhánh giữa lệch phải, nhánh cuối lệch trái, desktop stagefull. Không ảnh hưởng tọa độ projection hoặc mapping, không thu nhỏ cả map thành chữ bé.
- Finding4 vẫn là mục kiểm chứng native Tab→stage visibility, chưa phát hiện bug từ source. Không yêu cầu auto-scroll nếu Browser chứng minh stage/labels còn xem được.
- Checker `node outputs/redesign/r4.3/check-source.mjs` chạy lại sau fix pass: đủ ba mapping/source/context/cạnh, pool float32, base reset exact và copy học vấn Vi/En nguyên.
