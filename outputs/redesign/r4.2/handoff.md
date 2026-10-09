# R4.2 → R4.3

Production Skills mới đã nối renderer R4.1. Không còn card/bar/OrbitalSkills, không thay BH bằng set piece. R4.3 chỉ làm Education theo kế hoạch; không cần viết lại Skills hoặc logo engine.

- `src/stores/useSkillsStore.js`: `interact('hover'|'focus'|'selection', id|null)`, `clear()`, `setVisible(boolean)`; selector `activeSkill` ưu tiên focus→touch selection→hover. Không persist selection. Section owns input/reset, IntersectionObserver owns visibility. Escape không blur; keyboard activation sau Escape có phản hồi. Pointer background move không clear focus; intentional background click clear.
- `src/components/sections/Skills.jsx`: `stageRef` từ App, window `data-skills-stage` nằm trong figure và chừa44pxclear/48pxcaption. SVG connection endpoints toolrightcenter→windowcenter→abilityleftcenter, RO+ScrollTriggerrefresh+locale remeasure, labelmask giữ chữ. Tối đa3branches từdata; không lấy vị trí particle làm hit target.
- `src/3d/components/SkillsSymbols.jsx`: bridge12lines nhậnanchor và đọc stores/reduced. Gọi đúng `SymbolStars`. Instance giữ pool/resources khi inactive, outer renderer bị ẩn/reset exact, không upload; unmount dispose. App có một stableSkillsref/mộtCanvas.
- R4.3 nên chuyển bridge nhỏ này sang chọn **một consumer active** Skills/Education và ref tương ứng; tiếp tục một `SymbolStars` chung. Chưa cần thêm abstraction/context/renderer thứ hai. Education sở hữu selection riêng như contractR4.1, và clearoffchapter/offwindow như Skills. Không trộn selection Skills với Works orbit controller hoặc portal anchor.
- CameraRig source nguyên, SKILLS endpoint `[2,5,-145,-50,-35,-200]`, ABOUT nguyên `[2,5,-154,-36,-16,-200]`; Educationstart tự dùng SKILLSconstant nên continuous. Đo lại window/nhánh Education thật ở các viewports; không phục hồi pose trước R3.3 hoặc ghi camera từ DOM section.
- MainVi/En Skills namespace36stringleaf/locale; `toolNames`, `abilityNames`, `technicalNames`, `activeTool` interpolation, stage/hint/clear/AIlabel đều có key. HTML/CSS/JS nền tảng, React đang học, không proficiency/colorgrading. Dữ liệu `data.js` cũ giữ nguyên.
- `PortalHeading` opacity quickSetter sửa cleanup locale làm Hero bật lại; cùng portalState và bend/glitch. Giữ fix này khi R4.3 đổi locale/refresh.

Đã verify53browserstates/3StrictModelifecycles/12Heroregressions,0consoleerror, maxanchor0.00011536px/maxendpoint0.00012208px; RTX4060DPR1 khoảng165FPS. Renderer/data/anchor/shader/quality/pipeline R4.1 giữhash. Chi tiết/giới hạn/commands trong `verification.md`.
