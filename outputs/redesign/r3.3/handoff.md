# R3.3 → R4 — Bàn giao

08/10/2026. R3.3 hoàn tất; không triển khai Skills mới trong phiên này.

## About và asset

`src/components/About.jsx` giữ `#about`, `aria-labelledby=about-heading`; App giữ wrapper `[data-story-chapter="about"]` và parent reading gate. Chân dung `/avatar-cutout.webp` là bản web R0.2 exact hash `6b2fea6dcbd2bd204fc0aa6c545cbe7a696670fc4532c992378c3393d53b511f`, 800×1000/66.084 bytes/alpha. `/avatar.webp` cũ giữ nguyên nhưng About không dùng.

Native portrait button có local color state; grayscale mặc định, hover/focus trả màu, click/tap/Enter/Space toggle, Escape bỏ latch. `.avatar-img` giữ selector lens; không thêm frame, halo, parallax hoặc clip overscan. Hai UI key mới `about.portraitToggle`, `about.portraitHint`; các key nghề nghiệp cũ nguyên vẹn.

Tên và câu đầu bio decode0,9s; semantic name/bio thật ổn định. Intro pause theo chapter/visibility và cleanup qua useGSAP. Không dùng revealHeadings hay animation khác viết đè các node `[data-about-decode]`.

## Contract camera / scroll

CameraRig vẫn writer duy nhất. `storyCameraPath` constant ABOUT mới `[2,5,-154,-36,-16,-200]`; lookX theo bias responsive sẵn có. About/contact giữ pose này; portal p=1, Skills p=0 và finale endpoint cùng dùng nó. Không lấy pixel storyboard làm world pose hoặc khôi phục pose ABOUT cũ `[2,3,-169,-12,0,-200]` khi tích hợp R4. Endpoint đã kiểm liên tục; quan sát render để giữ BH ngoài vùng đọc khi Skills triển khai.

`useScrollProgress` vẫn producer chung của App/lab. Story chapter/progress lấy ranges DOM; manual mode vẫn dùng `controls.seek/hold/resume`. Bản R3.3 giữ chapter/p qua locale rebuild và GSAP media lifecycle: matchMediaInit hold → matchMedia cuối remeasure/seek. Cleanup tháo ticker/listeners. Tránh thêm media producer hay restore native scroll trong từng section: nguyên nhân mất focus là Smoother cleanup reset sau React effect. Live reduced/locale/resize đã verify6/6 giữ portrait focus.

App, useSmoothScroll, store, HDR/ray pipeline, Nav/Menu/Cursor và section data không sửa trong R3.3. Không thêm About useSectionAnchor caller; Planet đã bỏ ở R3.1.

## Tools và năng lực chuyển trách nhiệm cho R4

Giữ nguyên `src/data.js` (`PORTFOLIO_DATA.tools`, `.skills`), `src/data/skills.js`, `src/components/sections/Skills.jsx`, hai locale `about.tools.*`, `about.coreSkills`, `skills.competencies`, `skills.technical`. Chỉ ngừng render các nhóm trong About, không xóa thông tin chuyên môn.

| Dữ liệu hiện tại | Trách nhiệm R4 |
|---|---|
| figma / photoshop / illustrator / afterEffects | Mỗi phần mềm một mục; logo mono chính thức R0.2 |
| videoEditing gộp Premiere/Resolve | Tách hai phần mềm; `public/icons/pr.png` cũ thực tế Resolve, không dùng làm Premiere |
| generativeAi | Một nhóm chứa ChatGPT/Claude/Google Antigravity; không Gemini |
| Design Thinking, AI-Assisted Design, Motion Graphics | Mapping trực tiếp tối đa2–3 nhánh/tool theo kế hoạch |
| Project/Time Management, Adaptability, Teamwork, Attention to Detail | Cụm năng lực chung phía dưới |
| HTML/CSS/JS cơ bản; React đang học; Prototyping(Figma)/Wireframing | Giữ mức đã xác nhận, không thêm proficiency hoặc phần trăm |

Asset nguồn/IDs/mono/logos: `outputs/redesign/r0.2/assets-manifest.json`; nội dung mapping chi tiết `content-audit.md` cùng thư mục. R4 mới dựng sao hội tụ logo và bố cục ba vùng; không kéo toàn StarField vào logo. Không tự thêm color grading/nhãn chuyên môn chưa duyệt.

## Bằng chứng

[verification.md](verification.md): 16 fresh layouts, 20 portal forward/reverse poses, 6 lifecycle, 2 native jumps, interactions, alpha, 8 production preview records. `integrity-results.json` đối chiếu baseline mới R3.3: 5 file sửa/85 giữ, một cutout thêm, HEAD/index và AGENTS prefix nguyên. `*-failure.json` là trace lỗi trước fix/selector test cũ; không dùng để kết luận bản cuối. Final `*-results.json` có timestamp mới và PASS.

Browser fallback Edge154; điện thoại/touch/OS motion là emulation, chưa test vật lý. FPS165,05 idle/164,84 khi lens ở ảnh trên RTX4060/DPR1; không suy thành bảo đảm mọi máy. Warnings Clock/chunk/SplashCursor kế thừa được ghi rõ.
