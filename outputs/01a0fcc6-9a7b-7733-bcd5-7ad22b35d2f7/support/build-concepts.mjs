import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { FileBlob, Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const out = path.resolve(import.meta.dirname, '..');
// Concepts are original proposals. Preference order comes from the user's answers.
const concepts = [
 ['C01','VEIL ARCHIVE\nMật viện cổ ngữ',
  'Một phòng lưu trữ bí mật trong sương. Bàn nghi lễ, cổ vật và ký hiệu hoạt động như một máy tính ma thuật. Quỷ Bí Chi Chủ dẫn mood; Berserk tạo sức nặng vật liệu. Tên Trần Vũ Anh Duy và UX/UI Designer hiện rõ ngay khi vào.',
  'Spatial UI làm hub; Skeuomorphism cho bàn/cổ vật; Minimalism cho case reader; Glassmorphism nhẹ cho HUD. 3D là cảnh trung tâm, không là mọi thành phần.',
  'P1 Occult Brass. Kim loại xỉn, đá khắc, sương mỏng, ánh đồng. Display có nét bản thảo; body sans rõ. Bộ glyph hư cấu có quy tắc riêng.',
  'Chọn 4 hotspot có nhãn: Edura, Work, About, Contact. Hover đánh thức pháp trận; click mở hồ sơ. Trail vài glyph ở vùng cảnh; particles chỉ bùng lúc kích hoạt. Có một mật thất cho visual playground.',
  'Edura là hồ sơ trung tâm. Mở là thấy Lead UI, scope, 3 quyết định và ảnh thật. Link View Edura, CV và Contact luôn ở ngoài cảnh. Recruiter có thể bỏ qua khám phá và đọc ngay.',
  'Cao: cần concept art, 1 cảnh 3D có bake ánh sáng và sound riêng nếu dùng. Bản nhẹ dùng nền prerender + lớp 2.5D + hotspot DOM. Khi WebGL lỗi, giữ đầy đủ case reader.',
  'Cân nhắc'],
 ['C02','ARCANA OS\nHệ điều hành ma thuật',
  'Một hệ điều hành vận hành bằng cổ ngữ. Ký hiệu đóng vai trò mạch logic, pháp trận là sơ đồ trạng thái. Nghiêng mạnh về giao điểm ma thuật × sci-fi mà bạn đã chọn.',
  'Minimalism giữ hierarchy; Spatial UI cho các module; Bento cho dashboard dự án; Liquid Glass mô phỏng trên web cho dock điều khiển.',
  'P4 Spectral Silver. Obsidian, bạc lạnh, ánh băng nhạt. Sans hình học cho tên và body; mono chỉ cho thông tin hệ thống có ý nghĩa.',
  'Mở module bằng click/Enter; dock phản hồi theo module đang chọn. Orb đi theo pointer trong vùng hero; velocity làm vòng năng lượng chuyển động khi cuộn. Module lên foreground có transition ngắn.',
  'Edura là module đầu và lớn nhất. About là hồ sơ cá nhân, Contact là kênh tín hiệu. Case reader dùng HTML. Không giả terminal uptime, RAM hay chỉ số nghề nghiệp.',
  'Trung bình đến cao. CSS Grid + GSAP đủ cho OS 2.5D; Three.js chỉ cần nếu orb là thể tích thật. Mobile thành dock + list; reduced motion mở thẳng trạng thái cuối.',
  'Cân nhắc'],
 ['C03','SIGIL COMPILER\nBiên dịch ấn chú',
  'Thiết kế được kể như một hệ phép thuật có quy tắc. Chọn input, liên kết quyết định, nhận output giao diện. Diễn giải cá nhân từ sở thích HunterXHunter/Naruto, gắn với tư duy system của Lead UI.',
  'Brutalism cho lưới và kết nối; Skeuomorphism cho các phiến glyph; Minimalism cho nội dung; Bento chỉ cho board artifact.',
  'P1 Occult Brass hoặc P4 Spectral Silver, chốt một palette khi chọn. Glyph là hình trang trí riêng; mọi control vẫn có nhãn đọc được.',
  'Ghép ba phiến bằng button hoặc drag có phương án thay thế: vấn đề → quyết định → bằng chứng. Click Compile khiến đường nối hội tụ và mở màn hình UI thật. Có thể xem ngay kết quả.',
  'Ba phiến là ba quyết định Edura do bạn thật sự sở hữu. Artifacts và feedback lấy từ case gốc. Đây là cách diễn giải quy trình, không giả bộ là app Edura có hệ phép thuật.',
  'Trung bình. DOM/CSS + GSAP đủ cho bản đầu. Không cần physics engine hoặc AI compiler. Keyboard dùng chọn phiến/Compile; mobile dùng stepper và tap.',
  'Cân nhắc'],
 ['C04','ASTROLABE ARCHIVE\nTinh đồ ký ức',
  'Các dự án là điểm sáng trên tinh đồ cổ, được đọc qua thiết bị thiên văn sci-fi. Cảm giác bí ẩn và khám phá theo lớp nối Quỷ Bí Chi Chủ với nhịp hành trình bạn thích ở Frieren.',
  'Spatial UI cho bản đồ; Glassmorphism cho panel ngắn; Skeuomorphism cho astrolabe; Minimalism cho case reader.',
  'P4 Spectral Silver. Nền vũ trụ ít màu, kim loại bạc, sao thưa. Sans cho nội dung; chữ có chân chỉ dùng tên kho lưu trữ nếu cần.',
  'Click điểm sáng để mở case; đường nối hiện vai trò và artifact. Kéo xoay tinh đồ là tùy chọn. Chuyển chapter theo camera rail ngắn; có map button cho mọi điểm.',
  'Edura là điểm sáng chính, tránh biến ba project thành ba thành tích đồng hạng. Menu dự án và link Edura hoạt động độc lập với bản đồ.',
  'Trung bình đến cao. Tinh đồ 2D/2.5D đã đủ rõ. 3D cần camera và hotspot đồng bộ; mobile dùng bản đồ tĩnh + danh sách. Không bắt tìm tọa độ để đọc case.',
  'Cân nhắc'],
 ['C05','RELIC ENGINE\nCổ vật hắc thiết',
  'Một cổ vật cơ khí khối lớn, tối và có sức nặng; vết khắc cổ ngữ lóe sáng khi kích hoạt. Đây là hướng mạnh nhất nếu bạn muốn chất Berserk dẫn vật liệu và cinematic.',
  '3D hard-surface là hình chính; Skeuomorphism cho vật liệu; Brutalism tiết chế cho typography; Minimalism cho thông tin và reader.',
  'P2 Iron Ember. Hắc thiết, bạc xước, đỏ tàn than. Sans condensed đậm cho tên; body sans thoáng. Texture có ý đồ, không phủ noise lên chữ.',
  'Drag để xem cổ vật hoặc dùng nút xoay. Click Activate làm lõi mở và các mặt biến thành project thumbnails. Velocity chỉ tác động vòng/lớp cảnh, không làm lệch text.',
  'Mặt Edura mở đầu. UI thật nằm trên panel phẳng đủ đọc. Role Lead UI được ghi bằng chữ; biểu tượng cổ vật không thay nhãn điều hướng.',
  'Cao nhất về asset. Cần model nguyên bản, UV/texture và ánh sáng tốt. CSS 3D card không thay được cổ vật thể tích này. Bản nhẹ dùng poster + nút xem góc đã render.',
  'Cân nhắc'],
 ['C06','JADE THRESHOLD\nCửa giới ngọc',
  'Một cổng đá khắc cổ ngữ giữa vực mây. Dòng năng lượng phản hồi như hệ điều khiển khoa học viễn tưởng. Naraka và Kiếm Lai dẫn mood phương Đông, tốc độ và đường nét.',
  'Spatial UI cho các cổng; Minimalism cho bố cục; Skeuomorphism cho đá/ngọc; Glassmorphism nhẹ cho bản đồ. Tranh mực làm ngôn ngữ cảnh.',
  'P3 Ink Jade. Đen mực, đá xanh xám, điểm sáng ngọc. Display thiên về nét bút riêng; body sans có dấu tiếng Việt. Không lấy chữ cổ thật làm câu vô nghĩa.',
  'Chọn một cổng để đi tới case. Một nét mực/kiếm quang ngắn phản hồi click; trail bị giới hạn trong scene. Dừng pointer thì motion lắng xuống. Các cổng mở bằng button trên mobile.',
  'Cổng Edura đặt gần nhất và có label rõ. Hành trình học nghề là timeline thực; không gắn cấp tu vi hư cấu cho năng lực Junior.',
  'Cao nếu landscape 3D đầy đủ; trung bình với matte painting + parallax layers. Mobile giữ tranh và 3 cổng dạng list; reduced motion dùng cảnh tĩnh.',
  'Cân nhắc'],
 ['C07','GRIMOIRE PROTOCOL\nBản thảo giao diện',
  'Một sách phép có mạch phát sáng chạy trong trang; bìa cũ, nội dung bên trong chính xác như tài liệu sản phẩm. Mushoku Tensei/Frieren là chất liệu cảm hứng phụ theo thứ tự bạn nêu.',
  'Skeuomorphism cho bìa/trang; Minimalism cho đọc; Spatial UI cho mục lục; Glass chỉ cho toolbar.',
  'P1 Occult Brass. Trang than xám, mực sáng, đồng. Serif cho tên sách hợp chủ đề bản thảo; body sans. Không ép cả case thành blackletter.',
  'Mục lục chọn chapter, page turn ngắn và có nút Next/Previous. Hover soi lớp ký hiệu mờ. Chọn artifact mở ảnh gốc; một bookmark đưa về đúng vị trí.',
  'Edura là chapter đầu, có summary và link Behance đầy đủ. Ngôn ngữ nghề nghiệp luôn rõ bên cạnh tên chapter hư cấu. CV là link tải trực tiếp.',
  'Trung bình. CSS perspective + GSAP page turn; không cần simulation giấy. Mobile đọc dọc, dùng chapter links; giảm motion bỏ lật trang.',
  'Cân nhắc'],
 ['C08','BLACKBOX RITUAL\nHồ sơ cấm',
  'Một kho dữ liệu tối, thô, mang sức ép của bí mật đang được giải mã. Attack on Titan/Berserk/TobeHeroX được diễn giải thành tension, tương phản và nhịp motion graphic.',
  'Brutalism làm layout; Maximalism ở một khu đồ họa; Minimalism ở case; Skeuomorphism cho các tấm hồ sơ.',
  'P2 Iron Ember. Typography nặng, đường phân vùng và đỏ tàn than. Chữ thường dễ đọc; glyph lớn làm bố cục, không thay toàn bộ body.',
  'Nhấn hồ sơ mở panel. Một glitch ngắn trên hình trang trí, seal bị tách để lộ UI. Search hoặc danh sách hồ sơ là đường điều hướng thật; không bắt gõ lệnh.',
  'Edura hiển thị như hồ sơ kỹ thuật có Problem/Role/Decision/Evidence. Giữ contribution đọc được và tránh dùng chỉ số giả để giống terminal.',
  'Trung bình. Chủ yếu CSS + GSAP và assets 2D. Flash/glitch không dùng trên nội dung; giảm motion bỏ hiệu ứng. Chất thô cần kiểm typography kỹ.',
  'Cân nhắc'],
 ['C09','LUMEN CHAMBER\nBuồng phản quang',
  'Một buồng quan trắc ma thuật hiện đại, lõi trong suốt và ký hiệu nổi trong kính. Tối, sạch, có cảm giác đồ vật sống; hợp nếu bạn muốn sci-fi nổi rõ hơn gothic.',
  'Spatial UI cho chiều sâu; Glassmorphism cho vật liệu scene; Liquid Glass mô phỏng cho control; Minimalism cho case. Chọn một kiểu glass trên cùng control.',
  'P4 Spectral Silver. Kính khói, bạc, sáng băng. Độ trong chỉ ở lớp điều khiển/cảnh; nội dung đọc trên nền đủ đặc.',
  'Pointer di chuyển ánh sáng cạnh kính; chọn node làm panel morph. Orb đổi độ sáng theo trạng thái đã chọn. Refraction shader là nâng cấp sau khi visual direction được duyệt.',
  'Edura mở thành reader với UI screenshots giữ đúng màu gốc. Dock cho phép quay về hub và tải CV. Thử phản quang không che CTA.',
  'Trung bình với CSS frosted-glass; cao với refraction 3D. Đây là mô phỏng web, không phải API Liquid Glass native của Apple. Fallback nền đặc và scene tĩnh.',
  'Cân nhắc'],
 ['C10','ECHO INK THEATER\nSân khấu ấn chú',
  'Một sân khấu anime bằng các lớp tranh và cổ ngữ; chuyển cảnh như motion graphic do bạn đạo diễn. TobeHeroX/Naruto là cảm hứng phụ cho nhịp, silhouette và động tác.',
  'Maximalism cho key visual; Minimalism cho reader; Brutalism tiết chế ở title; Spatial UI bằng layer depth.',
  'P2 Iron Ember hoặc P3 Ink Jade; khóa một palette. Minh họa nguyên bản, nét mực có nhịp. Sans đậm; tránh phủ nhiều kiểu font lên một cảnh.',
  'Click scene để phát đoạn motion 10-15 s, con số là đề xuất. Mask chuyển lớp, pháp trận phản hồi âm thanh khi sound bật. Trail trở thành nét mực ngắn trong sân khấu.',
  'Case Edura tách bằng panel đọc rõ và luôn mở được từ menu. Multimedia trở thành playground hỗ trợ vị trí UX/UI, giữ UI product thật làm bằng chứng chính.',
  'Cao về art/motion, trung bình về code. Layer 2D + GSAP, video chỉ tải khi người dùng chọn phát. Mobile dùng poster và nút Play; reduced motion giữ keyframe cuối.',
  'Cân nhắc'],
 ['C11','FAMILIAR FOUNDRY\nXưởng linh vật',
  'Một linh vật nguyên bản trong phòng luyện cổ vật; bí ẩn nhưng có nét gần gũi. Slime là cảm hứng phụ, dùng khi bạn muốn làm mềm những hướng tối ở trên.',
  'Claymorphism cho mascot/vật thể; Neumorphism cho một bảng thao tác có viền rõ; Bento cho work; Minimalism cho text.',
  'P5 Soft Relic. Xám lạnh, gốm nhạt, lilac tiết chế. Cùng một hướng ánh sáng cho clay và shadow; chữ không dựa vào shadow để tạo contrast.',
  'Mascot chỉ dẫn hotspot khi được chọn, ngủ khi đọc case. Nút có feedback press; tile nâng nhẹ. Một easter egg đổi pose, không cần chatbot hoặc hệ pet phức tạp.',
  'Edura là bản thiết kế trên bàn xưởng. Mascot không giải thích thay bạn và không đứng lên screenshots. Recruiter tìm role/case/contact bằng label thông thường.',
  'Trung bình với sprite/illustration, cao nếu mascot 3D có rig. Hướng này ít lạnh/huyền bí hơn ưu tiên đầu của bạn; phù hợp làm chi tiết phụ. Mobile dùng pose tĩnh.',
  'Cân nhắc'],
 ['C12','PALE OBSERVATORY\nĐài quan trắc lặng',
  'Một đài quan trắc cổ trong màn sương; thời gian và những dấu vết đã đi qua là motif. Frieren là cảm hứng phụ, hợp cho cảm xúc lắng sau những cảnh tương tác.',
  'Minimalism làm nền; Skeuomorphism cho astrolabe; Spatial UI cho các điểm nhớ; Glass rất ít ở navigation.',
  'P4 Spectral Silver, giảm độ bóng. Nhiều khoảng trống, vật liệu mờ, ánh sáng tập trung. Chữ thanh nhưng đủ đậm; không làm body chìm vào sương.',
  'Chọn dấu mốc mở artifact; vòng astrolabe xoay chậm khi tương tác rồi dừng. Bản đồ hành trình đổi chi tiết theo mốc. Ambient chỉ phát khi bật.',
  'Experience là mốc thời gian thực, Edura là chương trọng tâm. Có đường đọc nhanh. Tối giản tương tác hơn hướng world/game bạn chọn, nên là variant phụ.',
  'Trung bình với scene 2.5D. Không cần free-roam. Mobile thành timeline + ảnh; reduced motion đọc thẳng. Sức hấp dẫn phụ thuộc chất lượng art và typography.',
  'Cân nhắc']
];

const combinations = [
 ['S01','Minimalism + Spatial UI + Skeuomorphism','Rất hợp','Reader rõ, thế giới có chiều sâu, cổ vật có vật liệu.','C01/C04/C07: cổ vật ở scene; native text/button ở lớp đọc.','Giữ một nguồn sáng và một system shape.'],
 ['S02','Minimalism + Bento Grid + Glassmorphism','Rất hợp','Bento tổ chức work; glass làm dock/panel ngắn.','C02: Edura tile lớn, project phụ nhỏ; nội dung không tràn kính.','Không biến mọi case thành card kính giống nhau.'],
 ['S03','Skeuomorphism + Spatial UI + 3D','Rất hợp','Cổ vật và không gian cùng có quy luật vật lý.','C01/C05: một artifact/hub có hotspot đúng vị trí.','Cần assets/model và fallback; 3D không phải style typography.'],
 ['S04','Brutalism + Minimalism + Motion graphic','Rất hợp','Lưới/chữ mạnh, body gọn, chuyển cảnh có nhịp.','C03/C08: raw board + reader + nghi thức Compile.','Không dùng glitch lên chữ đang đọc hoặc nhãn button.'],
 ['S05','Claymorphism + Neumorphism + Minimalism','Hợp có điều kiện','Cùng hướng ánh sáng và vật liệu mềm tạo consistency.','C11: clay mascot; neo ở bảng tương tác, reader phẳng.','Viền, contrast và active state phải rõ; không chỉ dựa vào bóng.'],
 ['S06','Glassmorphism + Spatial UI + Particles','Rất hợp','Glass phân lớp; hạt chỉ phản hồi năng lượng của scene.','C01/C04/C09: một panel HUD và burst khi click.','Không dùng blur lớn toàn màn hình cộng nhiều hạt liên tục.'],
 ['S07','Liquid Glass mô phỏng + Minimalism + Spatial UI','Rất hợp','Dock nằm trên cảnh, reader giữ bề mặt đọc rõ.','C02/C09: control nổi, highlight theo focus/selection.','Mô phỏng web. Chọn một hệ glass; nền đặc khi cần legibility.'],
 ['S08','Glassmorphism + Liquid Glass cùng một control','Nên chọn một','Hai cách mô tả vật liệu kính trùng vai trò.','Một dock chỉ chọn frosted glass hoặc kiểu phản quang fluid.','Không xếp kính trên kính và không gọi CSS là Liquid Glass native.'],
 ['S09','Maximalism hero + Minimalism reader','Rất hợp','Cảnh đầu nhiều năng lượng; case giữ thông tin dễ skim.','C08/C10: một sân khấu phong phú, case có hierarchy ổn định.','Dùng cùng palette/shape; không để mọi section đều là climax.'],
 ['S10','Brutalism + Neumorphism trên cùng control','Nên chọn một','Hard border/raw type và soft recessed shadow dễ tranh hierarchy.','Nếu C08 làm thô, dùng pressed state rõ, bỏ neo softness.','Có thể chia layer có chủ đích, nhưng không là mix mặc định.'],
 ['S11','Skeuomorphism + Claymorphism','Hợp có điều kiện','Cổ vật cứng và mascot mềm có thể cùng thế giới.','C11: đồ gốm/đá và companion, cùng ánh sáng.','Chọn vật liệu chính. Hắc thiết photoreal + mascot candy dễ lệch mood.'],
 ['S12','Bento Grid + Spatial UI','Rất hợp','Bento là cấu trúc reader; spatial là hub khám phá.','C02/C04: click điểm trên map mở project grid/read panel.','Không bắt người dùng giải bento như mê cung để tìm nội dung.'],
 ['S13','Velocity + 3D + Mouse trail','Hợp có điều kiện','Velocity điều khiển lớp phụ; 3D là vật thể; trail ghi dấu hành động.','C05/C06: vòng/lớp sáng đổi nhịp, trail chỉ quanh scene.','Clamp chuyển động; giữ cursor native; không làm text hoặc CTA lắc.'],
 ['S14','Neumorphism + Glassmorphism','Hợp có điều kiện','Có thể tách dashboard nền đặc và overlay kính.','C11: neo control ở surface đặc, tooltip/panel có nền đủ contrast.','Không đặt shadow nổi/chìm trên nền kính thay đổi liên tục.'],
 ['S15','Brutalism + Maximalism + Spatial UI','Hợp có điều kiện','Mạnh và nổi loạn, hợp sân khấu hồ sơ bí mật.','C08/C10: một cảnh nhiều lớp, text reader vẫn giới hạn.','Không nhồi lore, nhãn kỹ thuật và hiệu ứng vào mọi pixel.'],
 ['S16','Minimalism + Particles + Motion graphic','Rất hợp','Khoảng trống giúp một hiệu ứng có ý nghĩa được nhận ra.','C12: một burst cho chọn mốc; C07: một page turn.','Đặt hiệu ứng vào hành động, không dùng toàn bộ như wallpaper.'],
 ['S17','Liquid Glass + Bento + Claymorphism','Hợp có điều kiện','Dock kính điều khiển tile/mascot mềm, ba vai trò khác nhau.','C11 variant: dock nhỏ; mascot ở scene; work grid đọc được.','Ít hợp chất tối ưu tiên của bạn; tránh dùng như theme chính C01.'],
 ['S18','Cổ ngữ + Sci-fi + Anime + Tu tiên','Rất hợp','Đây là thế giới/thẩm mỹ; có thể thống nhất bằng một hệ ký hiệu và vật liệu.','C01/C06: cổ ngữ biểu diễn trạng thái, sci-fi là logic; anime là nhịp chuyển cảnh.','Chọn một thế giới chính; glyph hư cấu, tên/nhãn nghề nghiệp đọc được.']
];

const taxonomy = [
 ['D01','Minimalism','Ngôn ngữ / mật độ','Khoảng trống, hierarchy, ít yếu tố.','Reader, About, Contact trong mọi concept.','Tối giản nội dung nhưng có hình/UI thật.'],
 ['D02','Maximalism','Ngôn ngữ / mật độ','Nhiều lớp và nhịp hình ảnh, có trọng tâm.','Hero/sân khấu C08/C10.','Có vùng yên để đọc; không tăng mật độ toàn trang.'],
 ['D03','Brutalism','Ngôn ngữ thị giác','Typography mạnh, lưới/viền rõ, cảm giác thô.','Board C03, hồ sơ C08.','Độ thô có chủ đích; không là layout lỗi.'],
 ['D04','Skeuomorphism','Vật liệu / ẩn dụ','Vật thể gợi giấy, đá, kim loại, cơ cấu thật.','Bàn nghi lễ, sách, astrolabe.','Chữ nội dung không cần mang mọi texture.'],
 ['D05','Neumorphism','Vật liệu bề mặt','Bóng nổi/chìm gần cùng màu nền.','Một bảng thao tác C11.','Cần viền/label/state đủ contrast, không dùng bóng làm tín hiệu duy nhất.'],
 ['D06','Glassmorphism','Vật liệu bề mặt','Kính mờ, lớp, blur và viền ánh sáng.','HUD/overlay ngắn của C01/C04.','Test nền phía sau; fallback nền đặc.'],
 ['D07','Claymorphism','Vật liệu / hình khối','Hình mềm như đất sét, bo tròn, ánh sáng có trọng lượng.','Mascot C11, chi tiết phụ.','Ít hợp gothic nặng khi phủ toàn bộ portfolio.'],
 ['D08','Liquid Glass','Vật liệu + hành vi','Vật liệu native Apple; trên website là mô phỏng bằng CSS/shader.','Dock/controls C02/C09.','Đề xuất giữ lớp điều khiển tách reader; xem nguồn Apple ở sheet So thich.'],
 ['D09','Bento Grid','Cấu trúc layout','Grid khác kích thước theo hierarchy.','Work overview C02/C11.','Không là màu/theme; đúng số items, không ô rỗng vô cớ.'],
 ['D10','Spatial UI','Mô hình không gian','Các vùng chức năng có chiều sâu/vị trí liên hệ nhau.','Hub/map của C01/C04/C06.','Có navigation list, label, keyboard và mobile path.'],
 ['D11','3D concept','Cách dựng / asset','Vật thể hoặc scene thể tích, camera/lighting thật; 2.5D là phương án khác.','Cổ vật C05 hoặc hub C01.','Three.js chưa có trong project; chỉ thêm sau khi chọn 3D thật.'],
 ['D12','Velocity','Điều khiển motion','Tốc độ đầu vào như tốc độ cuộn, không là một style màu.','Lớp sáng/vòng scene C05/C06.','Clamp phản hồi, không bẻ layout/reader. Không đồng nghĩa thư viện Velocity.js.'],
 ['D13','Mouse trail','Tương tác / hiệu ứng','Vệt theo pointer mang dấu glyph/mực/năng lượng.','Vùng scene C01/C06/C10.','Pointer fine; mobile tắt hoặc phản hồi tap; cursor native vẫn thấy.'],
 ['D14','Particles','Hiệu ứng / rendering','Hạt thưa hoặc burst; Canvas/3D tùy cảnh.','Kích hoạt seal/portal.','Có giới hạn số hạt, cleanup và pause khi hidden.'],
 ['D15','Motion graphic','Nội dung / nhịp chuyển','Keyframes, masks, typography hoặc clip do bạn đạo diễn.','C10 và visual playground.','Play chủ động, dùng assets gốc; không chặn vào case.'],
 ['D16','Anime / Tu tiên / Occult','Thế giới / cảm hứng','Ảnh, nhịp, lore và motif để cá nhân hóa.','Theo danh sách ưu tiên sheet So thich.','Diễn giải nguyên bản; không là một component library hoặc ngôn ngữ cổ có thật.']
];

const effects = [
 ['M01','Hotspot trong hub','C01/C04/C06','Hover/focus: hiện nhãn và viền; click/Enter: mở case.','Button/link DOM đồng bộ với cảnh; raycast chỉ là enhancement nếu dùng 3D.','Mobile: list hoặc map tap; keyboard tới đủ destinations.','Cốt lõi','Case/role/contact vẫn mở được khi scene chưa tải.'],
 ['M02','Ritual activation','C01/C05','Chọn Activate: glyph hội tụ, lõi sáng và mở panel.','GSAP timeline transform/opacity, 0,4-0,7 s là đề xuất.','Reduce: panel hiện ngay; có Cancel/Back nếu mở flow.','Cốt lõi','Hiệu ứng tạo phản hồi; không là intro khóa nội dung.'],
 ['M03','Rune mouse trail','C01/C06','Di chuyển trong hero: vệt 6-10 glyph tan trong 0,2-0,4 s, ngân sách khởi đầu.','Pool nhỏ + gsap.quickTo hoặc Canvas; không setState mỗi mousemove.','Pointer coarse/reduce: tắt; native cursor giữ nguyên.','Signature','Không phủ body text; dừng khi pointer rời scene.'],
 ['M04','Particles năng lượng','C01/C04/C09','Click seal: một burst; idle chỉ có vài hạt nền nếu cần.','Canvas 2D; dùng Points nếu đã có scene 3D. Số hạt điều chỉnh qua prototype.','Reduce: glow tĩnh; mobile ít hạt hoặc tắt.','Signature','Pause khi offscreen/hidden; không bảo đảm FPS trước khi profile.'],
 ['M05','Scroll velocity response','C02/C05/C06','Cuộn nhanh: vòng/lớp sáng phản hồi mạnh hơn rồi trở về trung tính.','ScrollTrigger.getVelocity() làm input, clamp độ nghiêng/dịch chuyển lớp cảnh.','Reduce: giữ tĩnh; mobile cần test trước khi bật.','Tùy chọn','Không dùng velocity để lắc chữ, đổi tốc độ đọc hoặc khóa cuộn.'],
 ['M06','Inspect cổ vật 3D','C01/C05','Drag xoay hoặc click nút góc nhìn; hover chỉ tilt nhỏ.','Three.js cho model thật; CSS perspective cho plane 2.5D. Chọn renderer theo độ 3D đã duyệt.','Mobile dùng nút góc/poster; fallback nếu WebGL context lost.','Signature','Cần model nguyên bản, texture tối ưu, dispose và scene tải sau nội dung.'],
 ['M07','Compiler board','C03','Chọn Problem → Decision → Evidence rồi Compile; kết quả vẫn có nút mở trực tiếp.','DOM state đơn giản + GSAP path/reveal; drag chỉ tùy chọn.','Tap/keyboard thay drag; không bắt giải puzzle.','Cốt lõi C03','Chỉ dùng ba quyết định Edura có artifact thật.'],
 ['M08','Glass navigation dock','C02/C09','Current section sáng rõ; menu mở từ control bằng morph/crossfade.','CSS backdrop-filter + border/highlight; shader chỉ khi đã chọn direction và profile.','Nền đặc khi blur không phù hợp; focus ring rõ trên mọi cảnh.','Cốt lõi','Web approximation; không cam kết có vật liệu native Apple.'],
 ['M09','Glyph decode','C01/C02/C08','Biểu tượng phụ giải mã khi focus/hover; tên nghề nghiệp đã đọc được từ đầu.','Lớp trang trí aria-hidden; ScrambleText hoặc đổi glyph đơn giản.','Reduce: hiện trạng thái cuối ngay; assistive text ổn định.','Tùy chọn','Không scramble nội dung case, email hoặc nhãn control.'],
 ['M10','Portal transition','C01/C06','Chọn case: mask cổng mở tới reader trong khoảng 0,4-0,6 s đề xuất.','CSS mask/clip + GSAP timeline; dùng một shared element nếu có đủ DOM/asset.','Reduce: navigation ngay; Back hoạt động; deep link mở trực tiếp case.','Signature','Không đợi tải model mới mới cho đọc case.'],
 ['M11','Page turn','C07','Click Next/Previous hoặc mục lục, trang sách xoay rồi trả nội dung đọc rõ.','CSS perspective + GSAP; không simulation vật lý giấy.','Mobile reader dọc; reduce đổi chapter tức thời.','Cốt lõi C07','Không lật theo mọi wheel tick; focus chuyển đúng heading.'],
 ['M12','Camera rail / parallax','C01/C04/C06','Chọn vùng hoặc cuộn chapter: cảnh dịch nhẹ giữa các điểm định sẵn.','GSAP/ScrollTrigger cho scene; cuộn trang dùng hành vi native.','Reduce: một keyframe; mobile layer depth thấp.','Tùy chọn','Tránh pin gallery dài và camera xoay chóng mặt; reader không bị transform.'],
 ['M13','Bento module focus','C02/C11','Chọn module: tile nổi và mở case, active state vẫn có chữ/viền.','CSS Grid + transform; GSAP Flip nếu chuyển bố cục thực sự cần.','Keyboard Enter và native link; không phụ thuộc hover.','Cốt lõi C02','Giữ DOM order đọc hợp lý; không dùng grid dense đảo thứ tự nội dung.'],
 ['M14','Ritual sound','C01/C05/C06','Người dùng bật Sound thì click portal có âm thanh ngắn và ambience nhẹ.','Web Audio/HTML audio; asset nguyên bản hoặc có quyền.','Mặc định tắt; có mute rõ; không cần microphone.','Sau bản đầu','Website đầy đủ khi tắt sound. Không sao chép OST để nhận diện tác phẩm.'],
 ['M15','Familiar companion','C11','Người xem chọn Help: mascot chỉ hotspot; khi đọc case thì ở yên.','Sprite 2D/illustration trước; rig 3D chỉ khi cần nhiều pose.','Reduce/mobile: pose tĩnh; tooltip mở bằng click/focus.','Sau bản đầu','Không chatbot/AI backend; không để mascot che nội dung.'],
 ['M16','Mật thất / easter egg','C01/C08/C10','Một glyph phụ mở visual playground hoặc thay ánh sáng scene.','State nhỏ + link/route; mở/đóng rõ và có Back.','Có nút có tên; keyboard mở được; không yêu cầu phản xạ nhanh.','Sau bản đầu','Bonus không chứa CV, Edura hoặc Contact bắt buộc.'],
 ['M17','Low effects / reduced motion','Mọi concept','Người xem giảm hiệu ứng; nội dung và navigation vẫn đầy đủ.','gsap.matchMedia + một control Low effects; cleanup event/scene.','Tôn trọng prefers-reduced-motion; quality fallback tự giảm theo capability.','Cốt lõi','Giảm particles/camera/trail, không coi giảm motion là lỗi tải.'],
 ['M18','Return waypoint / deep link','Mọi concept','Back hoặc URL case mở đúng điểm nội dung; quay về hub có focus rõ.','Native URL/history + React state vừa đủ; HTML case tồn tại ngoài canvas.','Cùng hành vi trên touch/keyboard; refresh URL case vẫn đọc được.','Cốt lõi','Không dùng memory session độc quyền để mở case; không cần đăng nhập.'],
 ['M19','Motion graphic scene','C10','Click Play: một đoạn 10-15 s đề xuất, controls hiện rõ.','Clip tối ưu có poster, chỉ tải/phát khi được chọn; GSAP cho layer DOM.','Reduce: poster hoặc xem chủ động; mobile không auto-download reel.','Tùy chọn','Kỹ năng motion bổ trợ UX/UI; không mở bằng màn phim bắt buộc.'],
 ['M20','Optional spell puzzle','C03/C06','Ghép glyph hoặc đổi góc cổ vật mở một effect thưởng.','Một puzzle nhỏ với reset và skip; state phía client.','Có giải pháp button/keyboard; giảm motion vẫn chơi hoặc skip được.','Sau bản đầu','Không khóa case study và không biến điểm game thành skill rating nghề nghiệp.']
];

const journey = [
 ['F01','Arrival','Vào URL','Tên, UX/UI Designer, View Edura, Explore archive và Contact đã có. Poster scene hiện trước.','Hero gọn + scene tải độc lập; đúng danh tính, không loading % giả.','Truy cập trực tiếp bằng mobile/reduce/không WebGL vẫn thấy đường đi.'],
 ['F02','Explore hub','Chọn Explore archive','Một phòng 4 hotspot, nhãn rõ và một câu hướng dẫn ngắn.','Poster/cảnh gốc, bộ glyph riêng, native buttons. Không cần WASD trong bản đầu.','Tab/Enter mở mọi hotspot; camera không chứa control duy nhất.'],
 ['F03','Open Edura','Click Edura hoặc View Edura','Summary: app quản lý học tập tại trung tâm; bạn Lead UI. Scope/team/time chỉ ghi khi đối chiếu bằng chứng.','Lấy UI thật và dữ liệu case Behance. Cảnh chuyển bằng portal ngắn.','Role/decision/proof đọc được, copy không pha lore tới mức khó hiểu.'],
 ['F04','Read decisions','Chọn một quyết định','Problem → UI decision → artifact → feedback/change. Mở ảnh hoặc prototype liên quan.','Ba quyết định có thật, phân biệt đóng góp UI cá nhân với research của nhóm.','Không chế metric/award hoặc thiết kế giả để minh họa thành quả.'],
 ['F05','Prototype spotlight','Chọn một flow Edura','Một flow cụ thể của prototype thật; có trạng thái trước/sau và lý do.','Assets từ Figma/Behance. Buttons/tabs cho các bước.','Không trình bày scene magic như UI đã làm cho sản phẩm Edura.'],
 ['F06','About / path','Chọn About','Tên, định vị Junior, experience liên quan, cách làm việc và CV.','Timeline thực; Designveloper và đóng góp cụ thể đọc nhanh.','Không dùng cấp tu vi hoặc progress bar hư cấu để chấm năng lực.'],
 ['F07','Other work','Chọn Work','VERIS/VIE hoặc visual playground có label và đích thật.','Chốt nội dung/URL; chỉ gọi là case study khi có reasoning và contribution.','Không có card giả click hoặc liên kết #.'],
 ['F08','Contact','Chọn Contact','Email/LinkedIn/CV rõ; một effect xác nhận nhỏ khi copy email nếu dùng.','Link native và thông tin đã xác nhận. Không cần backend form.','320 px, keyboard, zoom: đọc và dùng được mọi link.'],
 ['F09','Exit / revisit','Back hoặc link case','Quay lại hub/đúng vị trí reader; có low effects và sound toggle.','URL/histories native + state nhỏ. Ambient pause khi page hidden.','Không cần replay nghi thức khi Back/refresh chỉ để đọc tiếp.']
];

const phases = [
 ['P1','Chốt direction','C01 được đề xuất mạnh nhất; C05 nếu muốn gothic vật liệu, C06 nếu muốn phương Đông.','Chọn 1 world chính, 1 palette, hero storyboard và mức 3D.','Tạo moodboard nguyên bản + wireframe hub/reader.','Đầu ra để duyệt: visual direction và flow, chưa là site đã triển khai.'],
 ['P2','Dựng thế giới lõi','Một room, một artifact trọng tâm, 4 hotspot, Edura reader, About/Contact.','Thêm M01/M02/M10/M17/M18 trước. M03/M04 chỉ khi scene thực sự cần.','Giữ React/Vite/Tailwind v3/GSAP hiện có; 3D thật cần Three.js chưa cài.','Full world/game feel đến từ art và phản hồi; không cần open-world/engine/game account.'],
 ['P3','Nâng tầng trải nghiệm','Tinh chỉnh ánh sáng, camera, sound và một easter egg.','Chọn M05/M14/M16/M20 phù hợp, profile trước khi cộng hiệu ứng.','Test mobile, WebGL failure, keyboard, motion preference và navigation.','Mức tải/FPS/contrast cần đo trong prototype; chưa có kết quả đo cho concept này.']
];

const assets = [
 ['A01','Bộ glyph hư cấu','Vẽ khoảng 8-12 ký hiệu cùng một grammar là đề xuất.','Biểu diễn Problem, Decision, Evidence, Work, About, Contact bằng motif; label thật đi kèm.','Nguyên bản','Không gọi đây là cổ ngữ có lịch sử/nghĩa thật.'],
 ['A02','Hub / mật viện','Một concept art và scene/poster + model nếu chọn C01 3D thật.','Đá, kim loại, kính dùng cùng ánh sáng; scene không chứa text quan trọng bị raster hóa.','Cần tạo','Art mới chỉ trang trí trải nghiệm portfolio, không là screenshot sản phẩm.'],
 ['A03','UI Edura','Màn overview, flow trọng tâm, states/components, feedback công khai được.','Lấy từ case gốc. Cắt/scale đủ đọc và export tối ưu.','Có nguồn Behance','Lead UI do bạn xác nhận; scope/kết quả cần đối chiếu artifact.'],
 ['A04','Portrait / signature','Ảnh cá nhân thật và signature JUE hoặc tên đã duyệt.','Xử lý ánh sáng theo direction, không biến thành nhân vật của tác phẩm.','Cần chọn','JUE đang là signature hiện có; tên concept chưa phải quyết định đổi brand.'],
 ['A05','Sound / motion art','Một âm kích hoạt và ambience hoặc clip gốc nếu chọn.','Mặc định mute, Play chủ động. Dùng tài sản có quyền.','Tùy chọn','Không cần nhạc để hiểu flow hoặc xác nhận button.'],
 ['A06','CV / project links','PDF cập nhật, LinkedIn và URL case thứ hai.','Đặt native links ngoài canvas, public được và mở thẳng.','Cần xác nhận','Không khóa sau quest, login hoặc free-roam.']
];

const prefs = [
 [1,'Quỷ Bí Chi Chủ','Mật viện, bí mật có nhiều lớp, dấu khắc và cơ khí cổ.','C01/C02/C04/C07','Dẫn thế giới chính','Diễn giải thiết kế của tôi từ sở thích; bối cảnh occult/Victorian-steam đối chiếu R01.'],
 [2,'Berserk','Khối nặng, tương phản, hắc thiết và cảm giác tension.','C05/C08; vật liệu C01','Dẫn vật liệu','Không lấy nhân vật, biểu tượng nhận diện hoặc hình tác phẩm làm logo cá nhân.'],
 [3,'Naraka Bladepoints (NARAKA: BLADEPOINT)','Đường nét phương Đông, nhịp tương tác nhanh và cửa giới.','C06; motion C01','Dẫn nhịp / phương Đông','Tên được chuẩn hóa ở ngoặc; dùng cảm hứng, không sao chép UI game.'],
 [4,'Mushoku Tensei','Sách phép, học hỏi và hành trình thiết kế.','C07','Lớp cảm hứng phụ','Đây là motif tôi đề xuất; không tái hiện hệ phép hoặc chữ của tác phẩm.'],
 [5,'Attack on Titan','Kho hồ sơ bí mật, sức ép thị giác và bóc tách thông tin.','C08','Lớp cảm hứng phụ','Biến tension thành reveal có kiểm soát; case reader yên để đọc.'],
 [6,'Slime','Companion gần gũi, vật liệu mềm và feedback dễ hiểu.','C11','Chi tiết tùy chọn','Thấp hơn ba ưu tiên đầu, nên mascot chỉ là phụ nếu bạn muốn.'],
 [7,'HunterXHunter','Quy tắc rõ, điều kiện → phản hồi và giải thích quyết định.','C03','Logic tương tác','Tôi mượn ý niệm hệ thống, không mô tả portfolio là hệ Nen chính thống.'],
 [8,'Naruto','Động tác thi triển, trình tự glyph và đường năng lượng.','C03/C10; M02/M03','Nhịp / gesture tùy chọn','Một interaction có thể là dấu ấn; không cần thao tác nhanh hoặc biết lore mới dùng được.'],
 [9,'TobeHeroX','Sân khấu motion graphic, silhouette và typography có sức bật.','C10/C08','Visual playground','Minh họa/keyframes gốc. Không lấy footage của tác phẩm làm case năng lực cá nhân.'],
 [10,'Kiếm Lai','Tranh mực, vực mây, cổ vật và nhịp không gian phương Đông.','C06','Lớp cảnh phụ','Bộ chữ/glyph tự thiết kế; không giả nghĩa Hán/cổ ngữ để làm label.'],
 [11,'Frieren','Dấu vết hành trình, tĩnh lặng, ký ức và chiều thời gian.','C12/C04/C07','Vùng nghỉ / kể chuyện','Đưa vào reader/experience hoặc hậu cảnh; không thay ưu tiên world/game đã chốt.']
];

const sources = [
 ['R01','Quỷ Bí Chi Chủ: nguồn phân phối chính thức','https://www.crunchyroll.com/series/GEXH3W2EZ/lord-of-mysteries','Đối chiếu bối cảnh Victorian, steam và occult. Concept C01 do tôi sáng tạo, không từ source này.'],
 ['R02','NARAKA: BLADEPOINT: website chính thức','https://www.narakathegame.com/','Đối chiếu game và trọng tâm combat nhanh. Chỉ dùng nhịp làm cảm hứng, không copy assets.'],
 ['R03','Apple: Meet Liquid Glass, WWDC25','https://developer.apple.com/videos/play/wwdc2025/219/','Nguồn về vật liệu native và phân lớp controls/navigation. Web approximation là đề xuất riêng.'],
 ['R04','GSAP: getVelocity','https://gsap.com/docs/v3/Plugins/ScrollTrigger/getVelocity()/','Velocity là tốc độ cuộn dùng làm input cho hiệu ứng.'],
 ['R05','GSAP: quickTo','https://gsap.com/docs/v3/GSAP/gsap.quickTo()/','Tái sử dụng tween cho phản hồi pointer thường xuyên.'],
 ['R06','GSAP: matchMedia','https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/','Responsive/reduced motion và cleanup.'],
 ['R07','MDN: WebGL best practices','https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices','Capability, memory, buffer và fallback cần kiểm qua prototype; không bảo đảm performance cho concept.'],
 ['R08','Người dùng: câu trả lời ngày 02/10/2026','Cuộc trò chuyện này','Nguồn thứ tự tác phẩm, thế giới cổ ngữ × công nghệ, world/game; Junior product team, Edura Lead UI từ lượt trước.'],
 ['R09','Skills đã áp dụng','ui-ux-pro-max; design-taste-frontend; gpt-taste; ui-styling; gsap-core; gsap-scrolltrigger; gsap-performance; redesign-existing-projects; ponytail','Dataset trả Brutalism/Minimalism là gợi ý tham khảo. Direction cá nhân hóa ở đây do tôi tổng hợp từ brief, không lấy nguyên theme tự động.']
];

const palette = [
 ['P1','Occult Brass','#111419','#24282D','#ECEEF0','#CFB58B','C01/C03/C07'],
 ['P2','Iron Ember','#151316','#29272D','#F0ECED','#D66B63','C05/C08/C10'],
 ['P3','Ink Jade','#0E1716','#20312E','#E7F0ED','#8CCBB0','C06'],
 ['P4','Spectral Silver','#0F141D','#252D3C','#EDF1F7','#A8D6EE','C02/C04/C09/C12'],
 ['P5','Soft Relic','#EEEFF4','#E0E2EA','#252838','#62558C','C11']
];

const ritualMode = process.argv.find(a=>a==='--ritual-inspect'||a==='--ritual');
const wb = ritualMode
 ? await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(out,'Portfolio-Concepts-2026-10-02.xlsx')))
 : Workbook.create();
const ink = '#252933', muted = '#5C6370', accent = '#92764E';
function base(name,title,widths,rows) {
 const s = wb.worksheets.add(name); s.showGridLines=false;
 const end = String.fromCharCode(64+widths.length);
 s.getRange('A1:'+end+rows).format.font={name:'Arial',size:10,color:ink};
 s.getRange('A1:'+end+rows).format.verticalAlignment='center';
 widths.forEach((w,n)=>s.getRangeByIndexes(0,n,rows,1).format.columnWidth=w);
 s.getRange('A2').values=[[title]]; s.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:ink};
 s.getRange('A2:'+end+'2').format.rowHeight=28;
 s.getRange('A3:'+end+'3').format.borders={bottom:{style:'thin',color:accent}};
 return s;
}
function table(s,row,headers,data,name,height=92,freeze=false) {
 assert.ok(data.every(r=>r.length===headers.length),name+' shape');
 const end=String.fromCharCode(64+headers.length), last=row+data.length;
 s.getRange('A'+row+':'+end+last).values=[headers,...data];
 const t=s.tables.add('A'+row+':'+end+last,true,name); t.style='TableStyleLight1'; t.showFilterButton=true;
 const body=s.getRange('A'+(row+1)+':'+end+last);
 body.format.wrapText=true; body.format.verticalAlignment='top'; body.format.rowHeight=height;
 const header=s.getRange('A'+row+':'+end+row);
 header.format.fill=ink; header.format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};
 header.format.rowHeight=34; header.format.wrapText=true; header.format.horizontalAlignment='center';
 header.format.borders={insideVertical:{style:'thin',color:'#FFFFFF'}};
 if(freeze){s.freezePanes.freezeRows(row);s.freezePanes.freezeColumns(2);}
 return last;
}
function section(s,row,title) {
 s.getRange('A'+row).values=[[title]];
 s.getRange('A'+row).format.font={name:'Arial',size:12,bold:true,color:ink};
 s.getRange('A'+row).format.rowHeight=24;
}

if (ritualMode) {
 await updateRitual();
 process.exit(0);
}

assert.equal(concepts.length,12); assert.equal(new Set(concepts.map(r=>r[0])).size,12);
assert.ok(prefs.every((r,n)=>r[0]===n+1)); assert.ok(effects.every(r=>r.length===8));

const c=base('Concepts','Portfolio mới: cổ ngữ × công nghệ',[9,29,58,43,39,60,58,58,19],40); c.tabColor=ink;
 c.getRange('A3').values=[['02/10/2026. World/game nhiều tương tác; ưu tiên Quỷ Bí Chi Chủ → Berserk → Naraka.']];
 c.getRange('A4').values=[['Trần Vũ Anh Duy • Junior UX/UI / Product Designer • Edura: Lead UI • tên concept là đề xuất sáng tạo.']];
 c.getRange('A5').values=[['Chọn ID']]; c.getRange('B5').values=[['C01']];
 c.getRange('B5').dataValidation={rule:{type:'list',values:concepts.map(r=>r[0])}};
 c.getRange('B5').format.fill='#FFF0CE'; c.getRange('B5').format.font={name:'Arial',size:10,bold:true,color:ink};
 c.getRange('C5').formulas=[['=INDEX($B$11:$B$22,MATCH($B$5,$A$11:$A$22,0))']]; c.getRange('C5').format.wrapText=true; c.getRange('A5:I5').format.rowHeight=34;
 c.getRange('A6').values=[['Style']]; c.getRange('B6').formulas=[['=INDEX($D$11:$D$22,MATCH($B$5,$A$11:$A$22,0))']];
 c.getRange('B6').format.wrapText=false;
 c.getRange('A7').values=[['Ưu tiên']]; c.getRange('B7').values=[['C01 dẫn thế giới; C05 dẫn gothic/3D; C06 dẫn phương Đông. C03 đáng chọn khi muốn logic tương tác nổi bật.']];
 c.getRange('A8').values=[['Concepts']]; c.getRange('B8').formulas=[['=COUNTA(A11:A22)']];
 c.getRange('C8').values=[['Ô vàng ở B5 và cột I có thể chỉnh. Chi phí là mức tương đối; chưa phải báo giá hoặc kết quả performance đã đo.']];
 table(c,10,['ID','Tên concept','Cốt truyện & hero','Phối style theo vai trò','Art direction','Chơi & motion','Edura / nhà tuyển dụng','Chi phí & bản nhẹ','Bạn chọn'],concepts,'NewPortfolioConcepts',116,true);
 c.getRange('I11:I22').format.fill='#FFF0CE';
 c.getRange('I11:I22').dataValidation={rule:{type:'list',values:['Cân nhắc','Yêu thích','Không chọn']}};
 c.getRange('I11:I22').conditionalFormats.add('containsText',{text:'Yêu thích',format:{fill:'#DDEDE2',font:{bold:true,color:'#2E5F43'}}});
 for(const row of [11,15,16]) c.getRange('B'+row).format.font={name:'Arial',size:10,bold:true,color:ink};
 section(c,25,'Palettes đề xuất, chưa có màu bạn xác nhận');
 table(c,26,['ID','Palette','Nền','Surface','Text','Accent','Áp dụng'],palette,'ConceptPalettes',30);
 for(let n=0;n<palette.length;n++){
   const r=n+27, p=palette[n];
   for(const [col,index] of [['C',2],['D',3],['E',4],['F',5]]) {
     const dark=['#252838','#62558C'].includes(p[index])||['C','D'].includes(col)&&n!==4;
     c.getRange(col+r).format.fill=p[index];
     c.getRange(col+r).format.font={name:'Arial',size:10,bold:true,color:dark?'#FFFFFF':'#252838'};
   }
 }
 c.getRange('A33').values=[['Palette giữ một accent qua toàn trang. Chữ/controls test contrast trên background thật; UI Edura giữ đúng màu sản phẩm.']];
 c.getRange('A34').values=[['Font trong concept là family direction. Chọn font thực tế sau khi kiểm dấu tiếng Việt, license và file/subset.']];

const s=base('Phoi style','Phối style có vai trò, cùng một thế giới',[10,49,25,57,58,62],61); s.tabColor='#92764E';
 s.getRange('A4').values=[['Đánh giá thiết kế do tôi đề xuất, không phải số liệu khảo sát. Một world chính + vật liệu nhất quán + reader rõ.']];
 table(s,6,['ID','Tổ hợp','Đánh giá','Vì sao phối được','Ví dụ của bạn','Điều kiện cần giữ'],combinations,'StyleCombinations',76,true);
 for(const [text,fill,color] of [['Rất hợp','#DFEDE5','#315E47'],['Hợp có điều kiện','#FFF0CE','#715621'],['Nên chọn một','#ECEEF1','#555D69']]) s.getRange('C7:C24').conditionalFormats.add('containsText',{text,format:{fill,font:{bold:true,color}}});
 section(s,27,'Phân biệt style, layout, thế giới và kỹ thuật');
 table(s,28,['ID','Tên','Thuộc nhóm','Hiểu đúng','Dùng ở đâu','Điều kiện'],taxonomy,'StyleRoles',65);

const m=base('Tuong tac','20 ý tưởng tương tác và motion',[10,29,25,55,59,54,22,61],29); m.tabColor='#5B677B';
 m.getRange('A4').values=[['Chọn theo concept. Nhiều tương tác không có nghĩa tất cả hiệu ứng chạy cùng lúc; các thời lượng/số lượng là đề xuất khởi đầu.']];
 table(m,6,['ID','Tương tác','Concept','Hành động → phản hồi','Cách làm','Mobile / giảm motion','Giai đoạn','Điều kiện nghiệm thu'],effects,'InteractionIdeas',89,true);
 m.getRange('G7:G26').conditionalFormats.add('containsText',{text:'Cốt lõi',format:{fill:'#DFEDE5',font:{bold:true,color:'#315E47'}}});

const f=base('Hanh trinh','Hành trình đề xuất cho VEIL ARCHIVE',[10,26,42,62,64,67],39); f.tabColor='#565B64';
 f.getRange('A4').values=[['Hai đường vào cùng nội dung: Explore archive và View Edura. Chơi/âm thanh là lựa chọn, thông tin tuyển dụng mở trực tiếp.']];
 table(f,6,['ID','Khoảnh khắc','Người xem làm gì','Trang phản hồi / nội dung','Asset / cấu trúc','Nghiệm thu'],journey,'ArchiveJourney',86,true);
 section(f,18,'Ba giai đoạn làm concept thành website');
 table(f,19,['ID','Giai đoạn','Trọng tâm','Tương tác','Cách làm','Kết quả cần duyệt / kiểm'],phases,'ConceptPhases',86);
 section(f,25,'Assets và nội dung cần có');
 table(f,26,['ID','Asset','Nội dung','Cách dùng','Hiện trạng','Điều kiện'],assets,'ConceptAssets',80);

const p=base('So thich','Sở thích đã xác nhận và diễn giải thiết kế',[9,43,63,32,30,70],42); p.tabColor='#B0A897';
 p.getRange('A4').values=[['Thứ tự 1-11 giữ đúng lời bạn. Motif/cách dùng là diễn giải sáng tạo của tôi, không là phân tích chính thức về các tác phẩm.']];
 table(p,6,['Ưu tiên','Tác phẩm bạn nêu','Chuyển thành chất liệu thiết kế','Concept liên quan','Vai trò trong direction','Giới hạn / ngữ cảnh'],prefs,'PersonalReferences',73,true);
 p.getRange('A7:A17').setNumberFormat('0');
 section(p,20,'Các quyết định đã chốt và còn mở');
 table(p,21,['ID','Quyết định','Thông tin','Nguồn','Trạng thái','Đề xuất khi triển khai'],[
  ['B01','Thế giới chính','Cổ ngữ × công nghệ; ma thuật như hệ thống sci-fi.','Bạn trả lời trong lượt này','Đã chốt','C01 có thể dùng cơ chế C02/C03 bên dưới một mật viện occult.'],
  ['B02','Mức khám phá','Trải nghiệm như một thế giới/game, nhiều tương tác.','Bạn trả lời trong lượt này','Đã chốt','Một hub có nhiều phản hồi ý nghĩa, nội dung đi thẳng được.'],
  ['B03','Đích tuyển dụng','Junior UX/UI hoặc Product Designer trong product team.','Bạn trả lời ở lượt audit','Đã chốt','Tên, role, Lead UI contribution và case artifacts luôn đọc được.'],
  ['B04','Case chủ lực','Edura LMS, vai trò Lead UI; bằng chứng ở Behance.','Bạn trả lời ở lượt audit','Đã chốt','Dùng UI thật trong reader; thế giới mới là lớp portfolio.'],
  ['B05','Màu / chữ','Bạn chưa xác nhận palette/font. P1-P5 là đề xuất.','Chưa có câu trả lời màu','Còn mở','P1 cho C01, P2 cho C05 hoặc P3 cho C06. Kiểm font tiếng Việt.'],
  ['B06','Signature / 3D','JUE hiện có; brand name và độ 3D chưa chọn.','Code hiện tại + brief','Còn mở','Chốt tên cá nhân/signature và một concept trước khi mua/tạo model.']
 ],'PersonalDecisions',73);
 section(p,30,'Nguồn chính thức và phương pháp tham khảo');
 table(p,31,['ID','Nguồn','Địa chỉ / kỹ năng','Cách sử dụng'],sources,'ConceptSources',65);

// One representative input-change check for the live concept selector.
wb.recalculate();
assert.equal(c.getRange('B8').values[0][0],12);
assert.equal(c.getRange('C5').values[0][0],concepts[0][1]);
c.getRange('B5').values=[['C06']];
assert.equal(c.getRange('C5').values[0][0],concepts[5][1]);
assert.equal(c.getRange('B6').values[0][0],concepts[5][3]);
c.getRange('B5').values=[['C01']]; wb.recalculate();
assert.equal(c.getRange('C5').values[0][0],concepts[0][1]);
const inspection=await wb.inspect({kind:'table',range:'Concepts!A5:C8',include:'values,formulas',tableMaxRows:4,tableMaxCols:3,maxChars:1800});
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},maxChars:1500});
await fs.mkdir(path.join(out,'support/concept-previews'),{recursive:true});
await fs.writeFile(path.join(out,'support/concept-inspection.txt'),inspection.ndjson+'\n'+errors.ndjson);
for(const [sheetName,range,label] of [
 ['Concepts','A1:E13','Concepts'],
 ['Concepts','F10:I13','Concepts detail'],
 ['Concepts','A25:G31','Palettes'],
 ['Phoi style','A1:F10','Phoi style'],
 ['Phoi style','A27:F32','Style roles'],
 ['Tuong tac','A1:F10','Tuong tac'],
 ['Hanh trinh','A1:F10','Hanh trinh'],
 ['So thich','A1:F10','So thich']
]){
 const blob=await wb.render({sheetName,range,scale:1,format:'png'});
 await fs.writeFile(path.join(out,'support/concept-previews',label+'.png'),new Uint8Array(await blob.arrayBuffer()));
}
const target=path.join(out,'Portfolio-Concepts-2026-10-02.xlsx');
const file=await SpreadsheetFile.exportXlsx(wb); await file.save(target);
await fs.writeFile(path.join(out,'support/concepts-data.json'),JSON.stringify({concepts,combinations,taxonomy,effects,journey,phases,assets,prefs,sources,palette},null,2));
console.log(JSON.stringify({file:target,concepts:concepts.length,mixes:combinations.length,styleRoles:taxonomy.length,interactions:effects.length,references:prefs.length,selected:c.getRange('B5:C5').values,formulaErrors:errors.ndjson}));

async function updateRitual() {
 const previewDir=path.join(out,'support/ritual-previews');
 await fs.mkdir(previewDir,{recursive:true});
 if(ritualMode==='--ritual-inspect') {
  const snapshot={};
  for(const [name,range] of [['Concepts','A1:I40'],['Phoi style','A1:F61'],['Tuong tac','A1:H29'],['Hanh trinh','A1:F39'],['So thich','A1:F42']]) {
   const area=wb.worksheets.getItem(name).getRange(range);
   snapshot[name]={range,values:area.values,formulas:area.formulas};
  }
  await fs.writeFile(path.join(out,'support/ritual-baseline.json'),JSON.stringify(snapshot));
  const overview=await wb.inspect({kind:'workbook,sheet,table',tableMaxRows:2,tableMaxCols:3,tableMaxCellChars:60,maxChars:5000});
  await fs.writeFile(path.join(out,'support/ritual-baseline-inspection.txt'),overview.ndjson);
  for(const [sheetName,range,label] of [['Concepts','A1:E12','before-concepts'],['Phoi style','A27:F31','before-style']]) {
   const blob=await wb.render({sheetName,range,scale:1,format:'png'});
   await fs.writeFile(path.join(previewDir,label+'.png'),new Uint8Array(await blob.arrayBuffer()));
  }
  console.log(overview.ndjson);
  return;
 }
 const c=wb.worksheets.getItem('Concepts');
 const s=wb.worksheets.getItem('Phoi style');
 const p=wb.worksheets.getItem('So thich');
 const baseline=JSON.parse(await fs.readFile(path.join(out,'support/ritual-baseline.json'),'utf8'));
 const ritualConcept=[
  'C13','Nghi Thức Tấn Thăng Chân Thần\nTHE FALSE APOCALYPSE',
  'Mặt trời đen 3D rực cháy giữa một cảnh tận thế, xác và linh hồn rải quanh. Người xem ngỡ nghi thức thuộc Ma Nữ. Khi khám phá portfolio, dấu vết bí ngẫu, thời gian và ấn chú hé lộ sự sắp đặt của Kẻ Khờ. Khám phá đủ nội dung rồi chủ động hoàn tất nghi thức.',
  'Spatial UI và Maximalism có trọng tâm cho thế giới. Skeuomorphism cho đá, hắc thiết, vải và đồng cổ. Minimalism cho đọc case. Bento cho chọn dự án. Glass nhẹ cho HUD. Motion graphic dẫn cú lật.',
  'P6 Iron Crimson / Veiled Brass. Đầu: đá cháy, tro đỏ, mặt trời đen. Cuối: cùng kiến trúc trong sương xám, đồng cổ xỉn và mặt nạ nguyên bản. Berserk dẫn sức nặng vật liệu. Quỷ Bí Chi Chủ dẫn bí mật, biểu tượng và chiều sâu.',
  'Khám phá tự do qua các hồ sơ. Manh mối đổi nghĩa cảnh đã thấy. Mặt trời trở thành ấn trên mặt nạ khi camera lùi. Bí ngẫu ngừng chuyển động, sợi điều khiển hội tụ. Trail và hạt chỉ phản hồi trong cảnh. Chi tiết đầy đủ ở tab Tan thang.',
  'Edura là hồ sơ chủ lực, Lead UI và UI thật mở trực tiếp. Work, About, CV, Contact luôn có nhãn HTML. Lộ trình đọc nhanh cũng ghi nhận nội dung đã mở. Cú lừa chỉ thuộc sân khấu hư cấu, không sửa sự thật về năng lực hoặc dự án.',
  'Cao về art và shader. Một cảnh dùng lại hình khối cho hai trạng thái. Three.js / R3F / Drei và GSAP đã có. Bản nhẹ dùng poster hai trạng thái, hotspot HTML và chuyển cảnh ngắn. Hoàn tất được bằng bàn phím, mobile và khi WebGL lỗi.',
  'Yêu thích'
 ];
 const roleMix=[
  ['R01','Hero tận thế','Spatial UI + Maximalism','Một cảnh 3D với một tiêu điểm. Nhiều lớp chỉ ở môi trường.','Mặt trời đen chính giữa, không đối xứng hoàn toàn. Bí ngẫu tiền cảnh cắt khung. Xa hơn là kiến trúc gãy, linh hồn và sương tro.','Tên, vai trò và View Edura ở lớp HTML. Camera ổn định.'],
  ['R02','Mặt trời đen','3D shader + Motion graphic','Lõi tối có thể tích, corona đỏ tro và vài dải lửa.','Lửa bị gió kéo theo cùng chiều với sợi bí ngẫu. Vành lửa chứa nét của ấn mặt nạ từ đầu. Bloom chỉ ở vùng phát sáng.','Một shader chính. Không phủ glare lên chữ hoặc CTA.'],
  ['R03','Xác / linh hồn','Skeuomorphism + Spatial UI','Vật liệu cháy, vải sờn và bóng có sức nặng. Linh hồn bán trong suốt.','Thân xác là silhouette bí ngẫu nguyên bản. Hốc rỗng và sợi mảnh thành manh mối. Tránh dùng ảnh nhân vật của tác phẩm.','Dùng lại mesh hoặc instance. Mobile ít lớp, giữ các dấu hiệu chính.'],
  ['R04','Điều hướng / HUD','Minimalism + Glassmorphism nhẹ','Một dock nhỏ, nhãn rõ, bề mặt kính khói ở overlay ngắn.','Work, About, CV, Contact là chữ đọc được. Chỉ huy hiệu nghi thức dùng glyph hư cấu. Focus màu đồng giữ ổn định.','Nền đặc khi contrast thấp. Liquid Glass chỉ là variant cho dock.'],
  ['R05','Danh sách dự án','Bento Grid + Minimalism','Grid phân cấp theo vai trò. Edura là ô chủ lực.','Thumbnail sản phẩm thật trong khung hắc thiết mảnh. Dự án phụ nhỏ hơn, khoảng trống có nhịp.','DOM order rõ. Mobile thành list. Không bắt giải bố cục để mở case.'],
  ['R06','Case reader','Minimalism','Typography, khoảng cách và hierarchy phục vụ đọc.','Nền than đặc, chữ ngà. Problem, Lead UI contribution, Decision và Evidence rõ. Giữ màu UI Edura trong ảnh.','Không áp filter đỏ lên sản phẩm. Không có hạt, sương hoặc trail trên reader.'],
  ['R07','Hồ sơ / bản thảo','Skeuomorphism + Brutalism tiết chế','Khung hồ sơ, mép xước và dấu đóng dùng có chọn lọc.','Display serif như chữ khắc. Sans cho tiếng Việt và body. Mono chỉ cho mã hồ sơ hoặc trạng thái có nghĩa.','Không dùng blackletter cho đoạn dài. Không fake terminal hoặc thành tích.'],
  ['R08','Easter eggs','Spatial UI + Motion graphic','Manh mối là thay đổi nhỏ trong cảnh, liên hệ với chi tiết đã thấy.','Sợi chỉ lóe dưới ánh đồng. Tro bay ngược một nhịp. Phiến ký hiệu khớp thành dấu trên mặt nạ.','Tap / focus có phản hồi tương đương hover. Chữ cổ không thay nhãn control.'],
  ['R09','Cảnh kết','Spatial UI + Skeuomorphism','Giữ cùng kiến trúc, thay ánh sáng và ý nghĩa vật thể.','Mặt nạ và áo khoác đen trở thành tiêu điểm. Đồng xỉn, sương xám, khoảng trống rộng. Cảm giác trang nghiêm và quyền năng.','Đích nghi thức là Kẻ Khờ. Quỷ Bí Chi Chủ dẫn thẩm mỹ, không đổi cấp lore.'],
  ['R10','Chuyển trạng thái','Motion graphic + Minimalism','Một chuỗi chuyển động có nguyên nhân: lộ sợi, thu lửa, đổi vật liệu.','Camera lùi để thấy mặt trời là ấn trên mặt nạ. Màu đỏ rút khỏi vật liệu khi đồng cổ hiện ra. Không cắt sang thế giới khác.','Có Skip animation. Giảm motion dùng fade ngắn hoặc đổi trạng thái tĩnh.'],
  ['R11','Style để dành','Clay / Neumorphism / Liquid Glass','Clay và neo mềm ít hợp sức nặng của direction này. Kính fluid chỉ hợp control nhỏ.','Giữ bề mặt đá, vải, sắt và đồng làm chính. Nếu dùng Liquid Glass, thay dock kính hiện tại bằng một hệ vật liệu duy nhất.','Không cộng thêm ba style vào scene chỉ để đủ danh sách.']
 ];
 const ritualStory=[
  ['T01','Bình minh cuối cùng','Vào trang. Chọn Khám phá hoặc Xem Edura.','Mặt trời đen rực cháy. Xác nằm quanh nền đá gãy. Linh hồn trôi lên. Một kỷ nguyên dường như kết thúc.','Vành lửa đã có nét ấn chú. Các thân xác chia sẻ cùng một dấu mảnh. Không viết tên Ma Nữ để kết luận hộ người xem.','Tên Trần Vũ Anh Duy, mục tiêu UX/UI / Product Designer và đường mở case hiện ngay.','Đen lõi, đỏ tro'],
  ['T02','Người chứng kiến','Chọn hồ sơ trên scene hoặc menu.','Mỗi hồ sơ là một điểm neo của nghi thức. Người xem đi vào vai nhân chứng.','Các vật thể đều có nhãn thật. Không cần biết lore để hiểu điều hướng.','Edura, VERIS, VIE, About / Experience / Education và Contact theo nội dung thật đang công khai.','Camera lắng'],
  ['T03','Hồ sơ Edura','Mở case chủ lực và xem contribution.','Dấu đầu tiên được đánh thức. Ngoài scene, một cụm tro bay ngược chiều.','Tro đi ngược liên hệ motif Thời Gian. UI và timeline dự án vẫn trung thực.','Lead UI, vấn đề, scope, quyết định và bằng chứng. Link Behance nguyên bản mở trực tiếp.','Reader nền đặc'],
  ['T04','Các dấu vết còn lại','Mở các case còn lại và hồ sơ cá nhân theo thứ tự tùy chọn.','Những linh hồn và phiến đá có thêm chi tiết. Tiến độ chỉ ghi nội dung đã mở.','Bóng của nhiều thân xác lặp cùng hình mặt nạ. Một sợi nối xuất hiện khi trở lại hub.','Các dự án phụ, quá trình học và kinh nghiệm thật. Không gắn cấp tu vi cho năng lực Junior.','Đồng lóe rất ít'],
  ['T05','Vết nứt trong giả thuyết','Chọn một chi tiết đáng ngờ. Easter eggs là tùy chọn.','Khung cảnh có những điều không khớp với một ngày tận thế tự nhiên.','Đồng hồ nghi thức chạy ngược. Rìa cảnh lộ mặt phẳng dàn dựng. Thân xác có hốc rỗng của bí ngẫu.','Một panel lore ngắn có thể mở / đóng. Case reader không bị interrupt.','Đỏ giảm nhịp'],
  ['T06','Nhìn lại sân khấu','Quay về hub sau khi đã mở nhiều nội dung.','Mặt trời, xác và linh hồn vẫn ở cùng vị trí. Người xem nhận ra chúng đang được điều khiển.','Sợi chỉ bắt sáng đồng. Linh hồn là dư ảnh của bí ngẫu. Các nét lửa bắt đầu khớp một ấn.','Danh sách còn lại cho biết chính xác hồ sơ nào chưa mở. Không tuyên bố đã đọc hết.','Tro lắng xuống'],
  ['T07','Nghi thức sẵn sàng','Đã mở mọi case công khai và các mục About / Experience / Education / Contact.','Nút Hoàn tất nghi thức khả dụng. Cảnh chờ người xem xác nhận.','Không yêu cầu tìm hết easter eggs, gửi email, bật âm thanh hay đọc trang Behance ngoài website.','Mọi mục vẫn mở từ menu. Đường đọc nhanh cũng được tính là khám phá nội dung.','Ấn chú ánh đồng'],
  ['T08','Tấn thăng Kẻ Khờ','Nhấn Hoàn tất nghi thức. Có thể bỏ qua animation.','Mặt trời đen thu lửa. Camera lùi, lộ ấn trên một mặt nạ. Những thân xác ngừng như con rối.','Cảnh tận thế là một màn sắp đặt. Sợi chỉ hội tụ, áo khoác đen hiện trong sương xám. Đây là diễn giải portfolio nguyên bản.','Đích cốt truyện là từ Người Hầu Của Quỷ Bí đến Kẻ Khờ. Người xem là nhân chứng, không phải nhân vật tự xưng thần.','Đồng cổ × sương xám'],
  ['T09','Sau màn sương','Đọc tiếp, liên hệ hoặc xem lại hai trạng thái của scene.','Không gian còn tối nhưng rộng và trang nghiêm. Bí ẩn thay sức ép chết chóc.','Các manh mối vẫn xem lại được và có lời giải ngắn. Cùng hình khối chứng minh cú lật đã được chuẩn bị.','Tên, vai trò, case, CV và Contact giữ vị trí dễ tìm. Revisit không bắt chơi lại để đọc nội dung.','Tĩnh, sâu, huyền bí']
 ];
 const clues=[
  ['E01','Thời Gian','Tro bay ngược','Một nhúm tro quanh mặt trời có chiều chuyển động khác.','Sau hồ sơ Edura, ánh đồng làm người xem nhìn thấy rõ.','Cảm giác thời gian của sân khấu bị can thiệp. Đây là motif thiết kế riêng.','Bản tĩnh: vệt tro'],
  ['E02','Thời Gian','Đồng hồ nghi thức','Một vòng khắc có kim nhích ngược. Không liên quan đồng hồ thiết bị.','Chọn vòng bằng tap / Enter để xem một nhịp.','Mốc thời gian của nghi thức có thể bị đánh lừa. Không đổi ngày thực của project.','Có caption'],
  ['E03','Lịch Sử','Vết cháy không khớp','Vết cháy ở phiến đá giống khuôn mặt trong bóng của bí ngẫu.','Trở lại scene sau case thứ hai để thấy lớp vật liệu dưới tro.','Dấu vết tưởng từ thảm họa đã được đặt sẵn trên đạo cụ.','Đổi material'],
  ['E04','Lịch Sử','Mặt sau của phế tích','Nhìn lệch một khung đá cho thấy mặt sau phẳng như sân khấu.','Chọn hotspot có nhãn Quan sát. Camera chỉ dịch nhẹ.','Tận thế là khung cảnh đã được dựng. Kiến trúc cuối dùng lại chính các khung này.','Nút xem góc'],
  ['E05','Vận Mệnh','Sợi điều khiển','Các linh hồn kéo cùng hướng dù gió khác chiều.','Focus vào một thân xác, một sợi đồng mảnh hiện lên.','Linh hồn là dư ảnh bị điều khiển. Dấu vết bí ngẫu dần nhận diện được.','Tap / focus'],
  ['E06','Vận Mệnh','Những bóng giống nhau','Thân xác có hình dáng khác nhưng bóng đều mang dấu mặt nạ.','Ánh sáng xiên ở lần quay lại hub.','Các số phận trong cảnh đã được một chủ thể sắp đặt. Không giả dữ liệu người dùng.','Poster tương đương'],
  ['E07','Ấn chú','Vành lửa là nét khắc','Những dải lửa có chỗ gãy và độ dày khớp nét ấn trên mặt nạ.','Tách một đoạn glyph để quan sát. Kết nghi thức cho thấy toàn bộ.','Mặt trời là ấn nhìn từ góc gần. Dùng nguyên bản, tránh motif một mắt / monocle gây lệch sang Amon.','Mask nguyên bản'],
  ['E08','Bí ngẫu','Khoang rỗng dưới vải','Một xác tiền cảnh có phần ngực rỗng và khớp cứng dưới lớp vải cháy.','Chọn quan sát để ánh sáng lướt qua, không có jumpscare.','Xác đã thấy từ đầu là những vỏ bí ngẫu. Cú lật đổi nghĩa, không xóa những gì người xem đã thấy.','Silhouette có khớp']
 ];
 const colors=[
  ['P6.1','Background','#09090D','#101119','Nền viewport và vùng trống. Giữ cùng nền tối qua hai trạng thái.','Đã chốt family màu','Nền'],
  ['P6.2','Surface','#171219','#252631','Reader, panel và controls nền đặc. Không cần blur để tạo depth.','Đề xuất mã HEX','Bề mặt'],
  ['P6.3','Text','#E6DFD4','#EEEAE1','Tên, body và nhãn CTA. Kiểm tương phản trên background và surface.','Đề xuất mã HEX','Chữ chính'],
  ['P6.4','Muted text','#B7ABB5','#BDBBC9','Metadata và chú thích có ý nghĩa. Không dùng cho thông tin quan trọng nếu quá nhỏ.','Đề xuất mã HEX','Chữ phụ'],
  ['P6.5','World accent','#B44A46','#BDA36F','Lửa đỏ tro rút dần, đồng cổ xỉn hiện. Màu đỏ chỉ dùng trong cảnh và nét lớn.','Đỏ tro / đồng cổ','Ánh sáng'],
  ['P6.6','Secondary','#756A85','#8F92B8','Bóng lạnh, chiều sâu của sương và cạnh vật thể. Tiết chế để đồng giữ vai trò chính.','Đề xuất mã HEX','Màu phụ'],
  ['P6.7','Smoke','#453C43','#8F919D','Sương ở scene. Không phủ lên chữ, screenshots hoặc vùng đọc case.','Tro / sương xám','Khí quyển'],
  ['P6.8','Focus','#D7BD85','#D7BD85','Focus ring, selected và link quan trọng giữ nhận diện xuyên suốt.','Giữ ổn định','Điều khiển']
 ];
 const variants=[
  ['V01','Đồng cổ × sương xám','#B44A46','#BDA36F','Hắc thiết, đồng xỉn, vải đen và nền đền đá. Sương kết rộng, không thành light theme.','Bạn chọn. P6 là hướng chính.','Đã chọn'],
  ['V02','Bạc lạnh × tím khói','#B44A46','#AAA8C8','Kính khói và bạc xước. Siêu thực, lạnh hơn. Ít dấu tay cổ vật hơn đồng.','Giữ làm phương án tham khảo.','Dự phòng'],
  ['V03','Ngọc tối × hắc thiết','#B44A46','#93B6A5','Đá xanh xám, nét khắc và hơi mực. Nghiêng phương Đông theo Naraka / Kiếm Lai.','Có thể dùng cho một playground phụ.','Dự phòng']
 ];
 const creative=[
  ['G01','Một sân khấu, hai cách hiểu','Dùng lại vị trí đá gãy, thân xác, vòng trời và các đường sáng.','Cuối cùng, vòng trời là ấn, thân xác là bí ngẫu, đường sáng là sợi điều khiển.','Bảo đảm người xem có thể nhìn lại và thấy cú lừa hợp lý.','Mọi clue đã có dấu từ trạng thái đầu.','Đề xuất chính'],
  ['G02','Vai trò người chứng kiến','Các hồ sơ là điểm neo ký ức trong câu chuyện portfolio.','Mở mỗi nội dung thật làm rõ thêm một lớp sân khấu. Finale chờ một thao tác chủ động.','Giữ cảm giác có tham gia nhưng không buộc giải đố để đọc case.','Đếm nội dung đã mở. Easter eggs không là điều kiện.','Đề xuất chính'],
  ['G03','Mặt nạ và áo khoác đen','Hai vật thể lấy cảm hứng từ mục Kẻ Khờ trong workbook nguồn.','Mask nguyên bản với ấn ở trán. Áo khoác là khối vải có silhouette rõ. Không dùng monocle một mắt.','Cảnh cuối nhận diện được sự trang nghiêm và bí ẩn mà không cần nhiều props.','Model original, vải bake hoặc keyframes trước khi nghĩ tới simulation.','Nên thử moodboard'],
  ['G04','Thời Gian / Lịch Sử / Vận Mệnh','Ba nhóm manh mối giúp phân loại thiết kế.','Đồng hồ / tro, dấu vết đạo cụ, sợi bí ngẫu. Không biến ba nhóm thành ba quest bắt buộc.','Bản chuyển thể portfolio riêng. Chưa dùng nguồn được cấp phép để xác nhận nguyên văn toàn bộ nghi thức.','Phân biệt motif sáng tạo với điều kiện canon.','Diễn giải riêng'],
  ['G05','Lời dẫn nguyên bản','Mở: Một kỷ nguyên dường như đang khép lại. Bạn sẽ chứng kiến điều gì?','Hé lộ: Những dấu vết đều dẫn về một bàn tay. Kết: Màn sương hé mở. Nghi thức đã hoàn tất.','Microcopy gợi bí mật, không tuyên bố ngay con đường Ma Nữ. Nhãn nghề nghiệp vẫn trực tiếp.','Không dùng trích dẫn của tác phẩm làm lời tự giới thiệu.','Có thể tinh chỉnh'],
  ['G06','Art direction thống nhất','Đầu nặng và gần. Cuối lùi camera, rộng và tĩnh. Cùng hệ vật liệu mờ.','Serif khắc ở title. Sans rõ có dấu tiếng Việt ở body. Mono cho mã hồ sơ. Glyph trang trí tự thiết kế.','Berserk dẫn khối và chất liệu. Quỷ Bí Chi Chủ dẫn bí mật, lớp sương và nghi thức.','Chọn font có license và kiểm dấu. Không dùng tất cả style ở mọi section.','Đề xuất chính']
 ];
 const buildNotes=[
  ['K01','Cấu trúc cảnh','Một scene, ba trạng thái: Tận thế / Lộ sợi / Tấn thăng.','Đổi ánh sáng, shader và props theo cùng bố cục. Camera rail ngắn, không cần open-world.','Three.js, R3F, Drei và postprocessing đã cài. GSAP điều khiển transition.','Chưa triển khai C13 vào website.','Bước tiếp theo'],
  ['K02','Tài sản 3D tối thiểu','Một black sun / seal, một mask / coat, một bộ kiến trúc và vài mesh bí ngẫu dùng lại.','Texture tro, hắc thiết, đồng và vải. Linh hồn là plane / sprite nguyên bản, particles chia theo vùng.','Bake ánh sáng tĩnh. Instance cho các bí ngẫu lặp. Chỉ selective bloom cho corona / ấn.','Tạo art gốc trước khi tăng hiệu ứng.','Art / model'],
  ['K03','Điều kiện hoàn tất','Tập nội dung lấy từ danh sách thực sự công khai.','Bản dự kiến: Edura, VERIS, VIE, About / Experience / Education và Contact. Khi thêm / bỏ case, tập điều kiện đổi theo.','Ghi nhận đã mở, không tự nhận đã đọc hiểu. Chọn Hoàn tất khi đủ tập. Không yêu cầu gửi email.','Xem Edura / CV / Contact luôn trực tiếp.','Flow'],
  ['K04','Mouse trail / velocity','Trail vài nét ấn trong scene. Velocity chỉ làm vòng / tàn lửa phản ứng.','Dừng pointer thì lắng xuống. Native cursor giữ nguyên. Body và CTA không rung hoặc méo.','Pointer thường xuyên dùng GSAP quickTo / biến trong frame. React state chỉ cho chuyển nội dung.','Không gắn cả trail, camera mạnh và particles liên tục.','Motion'],
  ['K05','Bản nhẹ / giảm motion','Poster theo trạng thái và hotspot HTML. Finale giữ đúng ý nghĩa.','WebGL failure vẫn hoàn tất nghi thức. Mobile chọn bằng tap. Keyboard đi tới mọi nội dung.','Giảm motion đổi material hoặc fade ngắn. Có Skip animation. Ambient mute mặc định nếu bổ sung.','Tính năng chính không phụ thuộc canvas, hover hoặc sound.','Khả năng truy cập'],
  ['K06','Kiểm prototype','Đo loading, FPS, GPU / memory, responsive và clarity của cú lật trên thiết bị thật.','Quan sát người chưa biết lore: tìm Edura, nhận ra manh mối và hiểu ending. Kiểm contrast ở từng state.','Chưa có kết quả FPS hoặc usability cho C13. Không ghi thành số liệu đã đạt.','Chốt moodboard và storyboard trước khi dựng toàn bộ.','Nghiệm thu']
 ];

 const conceptTable=c.tables.items.find(t=>t.name==='NewPortfolioConcepts');
 assert.ok(conceptTable,'Preserve original native concept table');
 conceptTable.rows.add(null,[ritualConcept]);
 assert.equal(c.getRange('A23').values[0][0],'C13');
 assert.equal(c.getRange('A25').values[0][0],baseline.Concepts.values[24][0],'Palette heading must not move');
 c.getRange('A23:I23').format.font={name:'Arial',size:10,color:ink};
 c.getRange('A23:I23').format.wrapText=true;
 c.getRange('A23:I23').format.verticalAlignment='top';
 c.getRange('A23:I23').format.rowHeight=148;
 c.getRange('B23').format.font={name:'Arial',size:10,bold:true,color:ink};
 c.getRange('I23').format.fill='#FFF0CE';
 c.getRange('I23').dataValidation={rule:{type:'list',values:['Cân nhắc','Yêu thích','Không chọn']}};
 c.getRange('I23').conditionalFormats.add('containsText',{text:'Yêu thích',format:{fill:'#DDEDE2',font:{bold:true,color:'#2E5F43'}}});
 c.getRange('B5').dataValidation={rule:{type:'list',values:[...concepts.map(r=>r[0]),'C13']}};
 c.getRange('B5').values=[['C13']];
 c.getRange('C5').formulas=[['=INDEX($B$11:$B$23,MATCH($B$5,$A$11:$A$23,0))']];
 c.getRange('B6').formulas=[['=INDEX($D$11:$D$23,MATCH($B$5,$A$11:$A$23,0))']];
 c.getRange('B7').values=[['C13 là concept chính bạn vừa định hình. Phối style ở Phoi style, cốt truyện / manh mối / palette ở Tan thang. C01-C12 giữ làm các phương án trước.']];
 c.getRange('B8').formulas=[['=COUNTA(A11:A23)']];
 c.getRange('A3').values=[['Cập nhật 03/10/2026. C13: Nghi Thức Tấn Thăng Chân Thần. Quỷ Bí Chi Chủ dẫn thế giới, Berserk dẫn sức nặng.']];
 c.getRange('A25').values=[['P1-P5: các palette tham khảo trước. C13 dùng P6 ở Tan thang.']];
 c.getRange('A33').values=[['C13 đổi accent của cảnh từ đỏ tro sang đồng cổ. Focus và nhãn điều khiển giữ ổn định. UI Edura giữ đúng màu sản phẩm.']];
 section(s,47,'C13: phối style theo vai trò và art direction');
 table(s,48,['ID','Phần trải nghiệm','Style dẫn','Phối chi tiết','Art direction','Điều kiện'],roleMix,'RitualStyleRoles',85);

 const r=base('Tan thang','Nghi Thức Tấn Thăng Chân Thần',[9,29,45,51,51,53,25],76); r.tabColor='#BDA36F';
 r.getRange('A3').values=[['C13. Tận thế là màn sắp đặt của Kẻ Khờ. Cảnh cuối: đồng cổ × sương xám, bạn đã chọn ngày 03/10/2026.']];
 r.getRange('A4').values=[['Đích: Người Hầu Của Quỷ Bí (Danh sách 1) tới Kẻ Khờ (Danh sách 0). Quỷ Bí Chi Chủ dẫn thẩm mỹ cảnh kết. Các diễn biến portfolio là sáng tạo riêng.']];
 table(r,6,['ID','Chặng','Hành động của người xem','Diễn giải bề ngoài','Sự thật / manh mối','Nội dung portfolio','Màu / motion'],ritualStory,'RitualStory',113,true);
 section(r,18,'Easter eggs: ba nhóm motif, không phải ba quest bắt buộc');
 table(r,19,['ID','Nhóm motif','Manh mối','Dấu hiệu từ đầu','Cách khám phá','Ý nghĩa khi nhìn lại','Bản nhẹ'],clues,'RitualClues',86);
 section(r,30,'P6: Iron Crimson / Veiled Brass');
 table(r,31,['ID','Token','Trạng thái tận thế','Trạng thái tấn thăng','Dùng ở đâu','Quyết định màu','Vai trò'],colors,'RitualPalette',70);
 function luminance(hex){const v=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];}
 function contrast(a,b){const v=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(v[0]+.05)/(v[1]+.05);}
 for(let n=0;n<colors.length;n++)for(const [col,index]of[['C',2],['D',3]]) {
  const cell=r.getRange(col+(32+n)),hex=colors[n][index];
  cell.format.fill=hex;
  cell.format.font={name:'Arial',size:10,bold:true,color:contrast(hex,'#FFFFFF')>=4.5?'#FFFFFF':'#09090D'};
 }
 for(const state of[2,3])for(const textToken of[2,3,7])for(const surface of[0,1])assert.ok(contrast(colors[textToken][state],colors[surface][state])>=4.5,'Readable text / focus token');
 section(r,42,'Hai palette phụ để tham khảo');
 table(r,43,['ID','Family màu','Accent đầu','Accent cuối','Art direction','Cách dùng','Bạn chọn'],variants,'RitualVariants',80);
 for(let n=0;n<variants.length;n++)for(const[col,index]of[['C',2],['D',3]]) {
  const hex=variants[n][index];r.getRange(col+(44+n)).format.fill=hex;
  r.getRange(col+(44+n)).format.font={name:'Arial',size:10,bold:true,color:contrast(hex,'#FFFFFF')>=4.5?'#FFFFFF':'#09090D'};
 }
 section(r,49,'Đóng góp sáng tạo và lời dẫn');
 table(r,50,['ID','Ý tưởng','Cách đặt nền','Cách hé lộ / thực hiện','Tác dụng','Điều kiện','Đề xuất'],creative,'RitualCreative',100);
 section(r,59,'Cách làm 3D và điều kiện trải nghiệm');
 table(r,60,['ID','Hạng mục','Phạm vi','Cách làm','Chi tiết','Điều kiện','Vai trò'],buildNotes,'RitualImplementation',105);

 p.getRange('C26:F27').values=[
  ['Cảnh kết: đồng cổ × sương xám. P6 đề xuất HEX; font chưa chốt.','Bạn chọn ngày 03/10/2026','Màu đã chốt','Dùng P6 cho C13. Kiểm mã màu trên prototype. Chọn serif display và sans body có dấu tiếng Việt.'],
  ['JUE.STUDIO là signature hiện có. Bạn chọn 3D và concept C13.','Code hiện tại + brief mới','3D / concept đã chốt','Giữ tên Trần Vũ Anh Duy và signature cho tới khi bạn đổi brand. Chốt assets của C13 trước khi tạo model.']
 ];
 p.getRange('D7:D8').values=[['C13 chính; C01/C02/C04/C07'],['Vật liệu C13; C05/C08/C01']];
 p.getRange('F22').values=[['C13 dẫn thế giới hiện tại. Glyph và sợi điều khiển diễn giải ma thuật như một hệ thống có quy tắc.']];
 wb.worksheets.getItem('Hanh trinh').getRange('E21').values=[['React/Vite/Tailwind v3/GSAP hiện có. Three.js, R3F, Drei và postprocessing đã cài ngày 02/10/2026.']];
 const addedSources=[
  ['R10','Workbook lore do bạn cung cấp','D:\\Phiến Đá Báng Bổ trộm về.xlsx. Con Đường Phi Phàm: J6:L6, P6, J18:K18. Nghi Thức và Tính Độc Nhất: F5:H5, F17:H17.','Nguồn fan biên soạn bạn đưa. Phân biệt Kẻ Khờ (0) với Quỷ Bí Chi Chủ (Cựu Nhật). Mặt nạ / áo khoác từ H5. Không sửa workbook nguồn.'],
  ['R11','Brief C13 và chọn màu','Cuộc trò chuyện, cập nhật 03/10/2026. Nghi thức Người Hầu Của Quỷ Bí đến Kẻ Khờ. Tận thế làm cú lừa. Đồng cổ × sương xám.','Cốt lõi do bạn đề xuất. Story T01-T09, E01-E08, G01-G06 và mã HEX do tôi phát triển. Không là tình tiết chính thức của tác phẩm.'],
  ['R12','Webnovel: Chapter 1291, Two Rituals','https://www.webnovel.com/book/lord-of-mysteries_11022733006234505/two-rituals_45148053144913263','Phần hiển thị công khai có cung điện cổ và sương xám. Chưa đọc được toàn bộ công thức tấn thăng trong bản phân phối này. Không kết luận ba nhóm motif đều là điều kiện canon.'],
  ['R13','Stack 3D của dự án','package.json. docs/research/3d-ui-stack-2026-10-02.md. src/3d-lab.jsx. src/data.js.','Xác nhận Three / R3F / Drei / postprocessing đã cài. Edura, VERIS, VIE là danh sách hiện tại. Lab kỹ thuật chưa phải prototype C13.']
 ];
 const sourcesTable=p.tables.items.find(t=>t.name==='ConceptSources');
 assert.ok(sourcesTable,'Preserve original native source table');
 sourcesTable.rows.add(null,addedSources);
 p.getRange('A41:D44').format.font={name:'Arial',size:10,color:ink};
 p.getRange('A41:D44').format.wrapText=true;
 p.getRange('A41:D44').format.verticalAlignment='top';
 p.getRange('A41:D44').format.rowHeight=118;

 // One selector-change check, then restore the user's chosen concept.
 c.getRange('B5').values=[['C06']];
 assert.equal(c.getRange('C5').values[0][0],concepts[5][1]);
 assert.equal(c.getRange('B6').values[0][0],concepts[5][3]);
 c.getRange('B5').values=[['C13']];wb.recalculate();
 assert.equal(c.getRange('B8').values[0][0],13);
 assert.equal(c.getRange('C5').values[0][0],ritualConcept[1]);
 assert.equal(c.getRange('B6').values[0][0],ritualConcept[3]);
 const allowed=(name,row,col)=>name==='Concepts'&&(([2,24,32].includes(row)&&col===0)||(row===4&&[1,2].includes(col))||([5,6,7].includes(row)&&col===1)||row===22)
  ||name==='Phoi style'&&row>=46
  ||name==='So thich'&&(([25,26].includes(row)&&col>=2)||([6,7].includes(row)&&col===3)||(row===21&&col===5)||row>=40)
  ||name==='Hanh trinh'&&row===20&&col===4;
 for(const[name,b]of Object.entries(baseline)) {
  const current=wb.worksheets.getItem(name).getRange(b.range);
  const values=current.values,formulas=current.formulas;
  for(let row=0;row<b.values.length;row++)for(let col=0;col<b.values[row].length;col++)if(!allowed(name,row,col)) {
   assert.deepEqual(values[row][col],b.values[row][col],`Preserve ${name} ${row+1}/${col+1} value`);
   assert.deepEqual(formulas[row][col],b.formulas[row][col],`Preserve ${name} ${row+1}/${col+1} formula`);
  }
 }
 const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},maxChars:1800});
 assert.ok(!errors.ndjson.includes('"kind":"match"'),'No formula error matches');
 const inspection=await wb.inspect({kind:'table',range:'Concepts!A5:C8',include:'values,formulas',tableMaxRows:4,tableMaxCols:3,maxChars:2500});
 await fs.writeFile(path.join(out,'support/ritual-inspection.txt'),inspection.ndjson+'\n'+errors.ndjson);
 const previews=[
  ['Concepts','A1:E8','after-selector'],['Concepts','A23:E23','after-C13-left'],['Concepts','F23:I23','after-C13-right'],
  ['Phoi style','A47:F54','role-mix-1'],['Phoi style','A55:F59','role-mix-2'],
  ['Tan thang','A1:G10','story-1'],['Tan thang','A11:G15','story-2'],
  ['Tan thang','A18:G23','clues-1'],['Tan thang','A24:G27','clues-2'],
  ['Tan thang','A30:G39','palette'],['Tan thang','A42:G46','variants'],
  ['Tan thang','A49:G56','creative'],['Tan thang','A59:G66','implementation'],
  ['So thich','A25:F27','decisions'],['So thich','A41:D44','sources'],
  ['Concepts','A25:G34','palette-links'],['So thich','A7:F8','preference-links'],
  ['So thich','A22:F22','world-decision'],['Hanh trinh','A21:F21','stack-note']
 ];
 for(const[sheetName,range,label]of previews){
  const blob=await wb.render({sheetName,range,scale:1,format:'png'});
  await fs.writeFile(path.join(previewDir,label+'.png'),new Uint8Array(await blob.arrayBuffer()));
 }
 const target=path.join(out,'Portfolio-Concepts-2026-10-02-Ritual.xlsx');
 const file=await SpreadsheetFile.exportXlsx(wb);await file.save(target);
 console.log(JSON.stringify({file:target,concepts:13,newRoleMixes:roleMix.length,storyMoments:ritualStory.length,clues:clues.length,colorTokens:colors.length,palette:'Đồng cổ × sương xám',originalCellsPreserved:true,selectorChecked:true,formulaErrors:errors.ndjson}));
}
