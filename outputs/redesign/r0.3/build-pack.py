"""Build an editorial handoff; never writes application source or public assets."""
import json
from pathlib import Path
from datetime import datetime, timezone

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
dump = lambda name, value: (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
pair = lambda vi, en: {'vi': vi, 'en': en}
project_url = 'https://www.behance.net/gallery/241524417/Edura-LMS'

confirmation = {
    'id': 'S-USER-20261008', 'kind': 'direct-owner-confirmation', 'dateLocal': '2026-10-08',
    'location': 'User reply in this R0.3 conversation',
    'verbatim': '1.Quyết định về quy tắc bố cục, màu chủ đạo, system design 2. chỉ có video 3. dự án là concept và prototype ui/ux trên figma, đánh giá excellent bởi hội đồng giám khảo Lead UX/UI Designer của Arena Multimedia',
    'confirmed': ['layout rules', 'primary color direction', 'interface system design', 'concept and Figma UI/UX prototype', 'Excellent evaluation attributed to Arena Multimedia jury'],
    'stillMissing': ['video URL/file', 'assessment record/rubric/date/scope', 'specific layout rules and rationale', 'system library artifacts', 'testing outcomes', 'author reflection'],
}
dump('owner-confirmation.json', confirmation)

retrieval = json.loads((OUT / 'source-retrieval.json').read_text(encoding='utf-8-sig'))
sources = [
    {'id': 'S-PROJECT', 'kind': 'public-project-and-cached-artifacts', 'url': project_url,
     'title': 'Edura LMS', 'attribution': 'EDURA LMS — Anh Duy Trần Vũ / Behance; individual slide contributions are not established by the cache.',
     'manifestPath': 'outputs/visual-redesign-2026-10-07/edura/manifest.json',
     'inventoryPath': 'outputs/visual-redesign-2026-10-07/edura/inventory.md',
     'status': 'cached-image-bytes-verified; live-gallery-unavailable',
     'liveAccessPath': 'outputs/redesign/r0.3/behance-access.json',
     'completeness': '26 files, 24 distinct SHA-256 values; partial cache collection, not all 119 modules'},
    {'id': 'S-OLD-AUDIT', 'kind': 'prior-owner-confirmation',
     'path': 'outputs/01a0fcc6-9a7b-7733-bcd5-7ad22b35d2f7/support/audit-data.json',
     'locator': 'Q04 lines 843–849; A26 lines 358–361',
     'status': 'Lead UI user-confirmed; original public role proof not newly fetched'},
    {**confirmation, 'path': 'outputs/redesign/r0.3/owner-confirmation.json'},
    {**retrieval, 'kind': 'external-context-primary-publisher',
     'title': 'Making School Data Work: Fixing Fragmentation',
     'attribution': 'Morgan Paese, OnCourse Communications / OnCourse Systems for Education',
     'status': 'publisher-page-verified; survey-raw-data-not-audited',
     'publishedAtInHtml': '2023-08-04T19:28:50+00:00',
     'surveyContext': {'when': 'May 2023', 'respondents': 300, 'population': 'educators', 'districts': 18, 'schoolLevel': 'K–12', 'finding': 'nearly 60% reported insufficient integration of technology tools'},
     'restriction': 'External cohort, not EDURA learners or an EDURA outcome. Slide A08 says 2024; do not present that as the survey year.'},
    {'id': 'S-LEGACY', 'kind': 'legacy-copy-to-review',
     'paths': ['src/data.js:26–33', 'src/i18n/locales/vi.json:49–58', 'src/i18n/locales/en.json:49–58'],
     'status': 'not-independent-proof', 'restriction': 'Excellent for UX innovation, fatigue reduction and seamless journeys are not substantiated by their presence in code.'},
]
dump('sources.json', {'sources': sources, 'newProductAssetsDownloaded': 0,
                     'retrievalNotes': 'Web reader cache miss; Browser plugin kernel exited; normal Edge navigation HTTP 403 and browser error document. No alternate identity, login bypass or guessed module URLs.'})

# Every original is retained in the index, but only three default images enter the reader.
descriptions = {
 1: ('cover-decoration', 'exclude', 'Bìa lớp học và biểu tượng EDURA.', 'Classroom cover with the EDURA symbol.', 'Ảnh trang trí, không bổ sung bằng chứng UI.'),
 2: ('edura-ui-overview', 'primary', 'Mockup trang tổng quan EDURA với bảng điểm, lịch học, học phí, khóa học, điểm danh, bài tập và tiến độ.', 'EDURA overview mockup showing grades, schedules, tuition, courses, attendance, assignments and progress.', 'Hình tổng quan UI EDURA. Các con số trên mockup là dữ liệu minh họa; hình này không mô tả một flow hoàn chỉnh.'),
 3: ('gallery-contents', 'exclude', 'Mục lục tài liệu EDURA gồm giới thiệu, nhận diện, UX, UI và quảng cáo.', 'EDURA contents page listing introduction, identity, UX, UI and advertising.', 'Mục lục không chứng minh đã thu đủ các chương.'),
 4: ('chapter-divider', 'exclude', 'Trang phân cách phần giới thiệu EDURA.', 'EDURA introduction divider.', 'Trang phân cách, không cần đưa vào reader.'),
 5: ('generic-lms-context', 'archive', 'Trang giải thích khái niệm LMS và các câu hỏi chung.', 'Slide explaining LMS and general questions.', 'Ngữ cảnh chung; không phải màn hình EDURA.'),
 6: ('external-context', 'archive', 'Slide thực trạng với trích đoạn eLiterate.', 'Situation slide containing an eLiterate excerpt.', 'Chưa kiểm tra bài eLiterate gốc; không chuyển trích dẫn thành nghiên cứu EDURA.'),
 7: ('project-problem-framing', 'primary', 'Slide mô tả thông tin học tập phân tán và khó khăn theo dõi lịch học.', 'Slide describing fragmented learning information and schedule tracking difficulties.', 'Vấn đề được đặt ra trong tài liệu dự án; đây không phải kết quả thử nghiệm đã được xác minh.'),
 8: ('external-statistic', 'archive', 'Slide khó khăn dẫn số gần 60% từ OnCourse Systems, kèm ảnh lớp học.', 'Challenges slide attributing a nearly 60% figure to OnCourse Systems, beside a classroom photo.', 'Số liệu bên ngoài về giáo viên K–12; không phải học viên hoặc kết quả EDURA. Mốc 2024 trên slide khác kỳ khảo sát tháng 5/2023 trong bài gốc.'),
 9: ('proposed-solution', 'primary', 'Slide định hướng EDURA: tập trung thông tin, hỗ trợ tự động, dashboard và tùy biến theo trung tâm.', 'EDURA solution slide proposing centralized information, automated support, a dashboard and center-specific customization.', 'Định hướng giải pháp trong concept. Chatbot và các lợi ích mô tả ở đây chưa được xác nhận là tính năng đã triển khai hoặc kết quả đo. Câu trong ngoặc kép ở đáy là thông điệp concept, không phải testimonial hay trích phỏng vấn đã xác minh.'),
 10: ('segmentation-artifact', 'optional', 'Slide phân khúc học viên trong tài liệu EDURA.', 'Learner segmentation slide in the EDURA materials.', 'Artifact phân khúc; chưa có phương pháp nghiên cứu hoặc ownership cá nhân.'),
 11: ('persona-artifact', 'archive', 'Persona học viên trẻ trong tài liệu EDURA.', 'Young learner persona in the EDURA materials.', 'Persona là artifact; không xác nhận đây là người tham gia nghiên cứu thật.'),
 12: ('persona-artifact', 'archive', 'Persona người đi làm trong tài liệu EDURA.', 'Working learner persona in the EDURA materials.', 'Persona là artifact; không xác nhận dữ liệu nghiên cứu gốc hoặc consent.'),
 13: ('persona-artifact', 'archive', 'Persona người đi làm thứ hai trong tài liệu EDURA.', 'Second working learner persona in the EDURA materials.', 'Persona là artifact; không xác nhận dữ liệu nghiên cứu gốc hoặc consent.'),
 14: ('classroom-decoration', 'exclude', 'Ảnh lớp học và hội trường.', 'Classroom and lecture hall photographs.', 'Ảnh bối cảnh trang trí, không phải bằng chứng UI.'),
 15: ('competitor-apms', 'exclude', 'Phân tích trang chủ và tiện ích của APMS, không phải EDURA.', 'Analysis of APMS home and utility screens, not EDURA.', 'Chỉ dành cho phân tích đối chiếu APMS; tuyệt đối không đưa vào product gallery EDURA.'),
 16: ('competitor-apms', 'exclude', 'Phân tích điểm danh và lịch học APMS, không phải EDURA.', 'Analysis of APMS attendance and schedule screens, not EDURA.', 'Màn hình đối thủ APMS; không dùng bổ sung flow EDURA.'),
 17: ('competitor-apms', 'exclude', 'Phân tích trang thêm và ngoại khóa APMS, không phải EDURA.', 'Analysis of APMS more and extracurricular screens, not EDURA.', 'Màn hình đối thủ APMS; không dùng bổ sung flow EDURA.'),
 18: ('problem-solution-artifact', 'optional', 'Slide Problem/Solution của EDURA với hướng tập trung lịch học, bài tập và thông báo.', 'EDURA Problem/Solution slide proposing centralized schedules, assignments and notifications.', 'Chỉ dẫn định hướng concept. Quote trong slide chưa có phương pháp/consent; câu giảm căng thẳng không phải outcome đo được.'),
 19: ('edura-splash-overview', 'optional', 'Mockup splash EDURA bên cạnh phần giới thiệu hệ sinh thái học tập.', 'EDURA splash mockup beside its learning ecosystem introduction.', 'Splash và mô tả concept. Kỳ vọng tăng hài lòng trên slide không phải kết quả đo.'),
 20: ('brand-message-decoration', 'exclude', 'Trang thông điệp thương hiệu EDURA trên nền xanh.', 'EDURA brand message on a blue background.', 'Lặp thông điệp, ưu tiên khoảng trống thay slide trang trí.'),
 21: ('chapter-divider', 'exclude', 'Trang phân cách Brand Identity của EDURA.', 'EDURA Brand Identity divider.', 'Trang phân cách; không chứng minh có đầy đủ brand system.'),
 22: ('identity-idea-artifact', 'optional', 'Trang ý tưởng logo ghi Education + App và Edu + A, kèm minh họa lưới với chữ Logo.', 'Logo idea slide stating Education + App and Edu + A, with a grid illustration spelling Logo.', 'Tài liệu giải thích ý tưởng nhận diện. Lưới có chữ Logo minh họa chung; không gọi đây là bản dựng hình hoàn chỉnh của logo EDURA.'),
 23: ('brand-building-mockup', 'exclude', 'Mockup nhận diện EDURA trên mặt đứng công trình.', 'EDURA identity mockup on a building facade.', 'Ảnh trang trí thương hiệu, không hỗ trợ flow/UI.'),
 24: ('brand-building-mockup', 'exclude', 'Bố cục khác của mockup công trình EDURA.', 'Another composition of the EDURA building mockup.', 'Không trùng byte với 23 nhưng cùng chủ đề trang trí; không cần dùng cả hai.'),
 25: ('duplicate', 'exclude', 'Bản trùng byte của mockup công trình số 23.', 'Byte-identical duplicate of building mockup 23.', 'Trùng SHA-256 với A23; chỉ index, không nhân đôi gallery.'),
 26: ('duplicate', 'exclude', 'Bản trùng byte của mockup công trình số 24.', 'Byte-identical duplicate of building mockup 24.', 'Trùng SHA-256 với A24; chỉ index, không nhân đôi gallery.'),
}
caption_en = {
 1: 'Decorative cover; it adds no interface evidence.',
 2: 'EDURA UI overview. Figures within the mockup are sample interface data; this image does not establish a complete flow.',
 3: 'A contents page does not establish that all chapters have been collected.',
 4: 'Chapter divider; omit it from the reader.',
 5: 'General context, not an EDURA product screen.',
 6: 'The original eLiterate article has not been verified; do not treat its excerpt as EDURA research.',
 7: 'The problem as framed in the project materials, rather than a verified testing result.',
 8: 'External data about K–12 educators, not EDURA learners or an EDURA result. The slide’s 2024 label differs from the May 2023 survey described by the publisher.',
 9: 'Proposed solution for the concept. The chatbot and stated benefits are not verified as implemented features or measured results. The quotation at the bottom is a concept statement, not a verified testimonial or interview excerpt.',
 10: 'A segmentation artifact; research methods and individual ownership are not documented.',
 11: 'A persona artifact; it is not verified as a real research participant.',
 12: 'A persona artifact; underlying research data and consent are not verified.',
 13: 'A persona artifact; underlying research data and consent are not verified.',
 14: 'Decorative context photographs, not interface evidence.',
 15: 'APMS comparison analysis only; never include it in the EDURA product gallery.',
 16: 'Competitor APMS screens; do not use them to fill an EDURA flow.',
 17: 'Competitor APMS screens; do not use them to fill an EDURA flow.',
 18: 'Concept direction only. The quotation lacks documented methods or consent; reduced stress is not a measured outcome.',
 19: 'Splash and concept introduction. The stated expectation of greater satisfaction is not a measured result.',
 20: 'Repeated brand messaging; prefer editorial space to a decorative slide.',
 21: 'Chapter divider; it does not prove a complete brand system.',
 22: 'Identity idea artifact. The generic grid spells Logo; it is not evidence of a complete EDURA logo construction system.',
 23: 'Decorative brand mockup, not evidence of a product flow or interface.',
 24: 'Different bytes from A23, but the same decorative subject; no need to include both.',
 25: 'Same SHA-256 as A23; index it without duplicating the gallery.',
 26: 'Same SHA-256 as A24; index it without duplicating the gallery.',
}
audit = json.loads((OUT / 'image-audit.json').read_text(encoding='utf-8'))
assets = []
for r in audit['records']:
    i = r['cacheDiscoveryIndex']
    category, selection, vi_alt, en_alt, note = descriptions[i]
    assets.append({
        'id': f'A{i:02}', 'cacheDiscoveryIndex': i, 'galleryOrderVerified': False,
        'path': r['path'], 'sourceUrl': r['sourceUrl'], 'sourcePage': project_url,
        'sourceId': 'S-PROJECT', 'bytes': r['bytes'], 'sha256': r['sha256'],
        'format': 'WebP', 'width': 1400, 'height': 989, 'mode': r['mode'], 'decode': 'pass',
        'originalColorsPreserved': True, 'newDownload': False,
        'duplicateOf': f"A{r['duplicateOfIndex']:02}" if r['duplicateOfIndex'] else None,
        'classification': category, 'selection': selection,
        'alt': pair(vi_alt, en_alt),
        'caption': pair(note, caption_en.get(i, en_alt + ' Archive/reference only; not selected for the reader.')),
        'attribution': pair('EDURA LMS — Anh Duy Trần Vũ / Behance. Ghi nguồn hồ sơ; không suy ra tác giả riêng của mọi slide.', 'EDURA LMS — Anh Duy Trần Vũ / Behance. Project attribution does not establish individual authorship of each slide.'),
        'restriction': note,
        'recommendedDisplay': {
            'intrinsic': [1400, 989], 'desktopMaxCssWidth': 1280,
            'mobileCssWidth': 'viewport minus 32px; 288px at 320 / 358px at 390',
            'fit': 'contain; preserve full frame and original color',
            'doNotUpscale': True, 'zoomOriginalForReading': selection in ['primary', 'optional'],
            'bodyCopyRequired': True,
            'legibility': 'Embedded slide text is too small at mobile width. Provide the sourced Vi/En summary in DOM; an optional accessible original-image viewer may expose detail in R6. Do not claim every baked-in label is mobile-readable.',
        } if selection in ['primary', 'optional'] else None,
    })
dump('asset-index.json', {'projectId': '241524417', 'files': 26, 'uniqueContent': 24, 'totalBytes': 2878812,
    'primaryAssetIds': ['A02', 'A07', 'A09'], 'optionalAssetIds': ['A10', 'A18', 'A19', 'A22'],
    'newProductAssets': [], 'collectionCompleteness': 'partial',
    'licenseNote': 'Owner authorized collection for this portfolio. Public visibility does not prove licenses for third-party classroom/persona photography; those decorative/persona images are not in the default selection.',
    'assets': assets})

def block(id, title_vi, title_en, vi, en, claims, asset_ids=(), status='ready', note=''):
    return {'id': id, 'i18nNamespaceProposed': f'edura.{id}', 'status': status,
            'heading': pair(title_vi, title_en), 'body': pair(vi, en),
            'claimIds': claims, 'assetIds': list(asset_ids), 'editorialNote': note}

sections = [
 {'id': 'overview', 'outlineLabel': pair('Tổng quan và vai trò', 'Overview and role'), 'status': 'ready', 'blocks': [
    block('overview.intro', 'EDURA LMS', 'EDURA LMS',
          'EDURA là concept và prototype UI/UX trên Figma cho một nền tảng quản lý học tập dành cho học viên tại các trung tâm đào tạo. Thiết kế hướng tới việc đưa lịch học, điểm số, học phí và bài tập về cùng một nơi.',
          'EDURA is a Figma UI/UX concept and prototype for a learning-management platform serving learners at training centers. The design aims to bring schedules, grades, tuition and assignments into one place.', ['C01', 'C04', 'C05'], ['A02']),
    block('overview.role', 'Vai trò: Lead UI', 'Role: Lead UI',
          'Trong vai trò Lead UI, tôi đưa ra các quyết định về quy tắc bố cục, màu chủ đạo và thiết kế hệ thống giao diện của EDURA.',
          'As Lead UI, I made decisions about EDURA’s layout rules, primary color direction and interface system design.', ['C02', 'C03', 'C08'], note='Confirmed directly by the owner. Do not expand this into personal ownership of UX research or all project work.'),
 ]},
 {'id': 'problem', 'outlineLabel': pair('Vấn đề', 'Problem'), 'status': 'ready', 'blocks': [
    block('problem.framing', 'Thông tin học tập nằm ở nhiều nơi', 'Learning information across multiple channels',
          'Tài liệu dự án đặt vấn đề về lịch học, tài liệu và hạn nộp bài nằm trên nhiều kênh thông tin. Hướng giải pháp của EDURA là tập trung các thông tin này trong một giao diện dành cho học viên.',
          'The project materials frame a problem of schedules, materials and submission deadlines spread across multiple channels. EDURA’s proposed direction is to bring this information together in a learner interface.', ['C05'], ['A07']),
 ]},
 {'id': 'decisions', 'outlineLabel': pair('Quyết định UI', 'UI decisions'), 'status': 'ready-with-limited-rationale', 'blocks': [
    block('decisions.layout', 'Quy tắc bố cục', 'Layout rules',
          'Tôi phụ trách các quyết định về quy tắc bố cục. Ở hình tổng quan, các lối vào bảng điểm, lịch học, học phí và khóa học được đặt cạnh nhau; khu vực điểm danh và tiến độ học tập xuất hiện bên dưới.',
          'I was responsible for decisions about layout rules. In the overview, entry points for grades, schedules, tuition and courses appear together, with attendance and learning progress below.', ['C03', 'C06'], ['A02']),
    block('decisions.color', 'Màu chủ đạo', 'Primary color direction',
          'Tôi phụ trách quyết định về màu chủ đạo. Tư liệu EDURA thể hiện xanh lam ở nhận diện và giao diện, kết hợp các bề mặt sáng và những nhóm chức năng có màu riêng trong hình tổng quan.',
          'I was responsible for the primary color direction. The EDURA materials show blue in the identity and interface, alongside light surfaces and distinct colors for function groups in the overview.', ['C03', 'C07'], ['A02']),
    block('decisions.system', 'Thiết kế hệ thống giao diện', 'Interface system design',
          'Thiết kế hệ thống giao diện là một phần phạm vi Lead UI tôi phụ trách cho concept và prototype EDURA trên Figma.',
          'Interface system design was part of my Lead UI scope for the EDURA concept and Figma prototype.', ['C02', 'C04', 'C08'], note='Ownership confirmed; no tokens/components/state library supplied. Do not invent system artifacts, completeness or performance benefits.'),
 ]},
 {'id': 'artifacts', 'outlineLabel': pair('Flow và artifact', 'Flow and artifacts'), 'status': 'artifacts-ready-flow-missing', 'blocks': [
    block('artifacts.overview', 'Tổng quan giao diện', 'Interface overview',
          'Mockup EDURA giới thiệu các nhóm thông tin và thao tác như bảng điểm, lịch học, học phí, khóa học, điểm danh, bài tập, nộp bài và tiến độ. Đây là hình tổng quan thiết kế, chưa phải chuỗi màn hình mô tả đầy đủ một luồng thao tác.',
          'The EDURA mockup presents information and actions for grades, schedules, tuition, courses, attendance, assignments, submission and progress. It is a design overview rather than a screen sequence documenting a complete interaction flow.', ['C06', 'C15'], ['A02']),
    block('artifacts.direction', 'Định hướng giải pháp', 'Proposed solution',
          'Tài liệu concept đề xuất tập trung thông tin học tập, dashboard theo dõi tiến trình và hỗ trợ theo nhu cầu trung tâm. Những mô tả này thể hiện định hướng thiết kế; chưa chứng minh các tính năng đã vận hành hoặc tạo ra tác động đo được.',
          'The concept materials propose centralized learning information, a progress dashboard and support tailored to training centers. These descriptions document design intent, without establishing operational features or measured impact.', ['C05', 'C09', 'C19'], ['A09']),
 ]},
 {'id': 'results', 'outlineLabel': pair('Kết quả có căn cứ', 'Documented results'), 'status': 'deliverables-ready-outcomes-missing', 'blocks': [
    block('results.deliverables', 'Kết quả ở cấp concept và prototype', 'Concept and prototype deliverables',
          'Theo xác nhận của tác giả, dự án được thực hiện ở mức concept và prototype UI/UX trên Figma. Bộ tư liệu công khai đã thu thập cho thấy một phần giao diện EDURA, cách đặt vấn đề, hướng giải pháp và tài liệu nhận diện. Đây là bằng chứng về thiết kế, không phải số liệu hiệu quả sau triển khai.',
          'The author confirms that the project was developed as a UI/UX concept and Figma prototype. The collected public materials document part of the EDURA interface, the problem framing, proposed solution and identity artifacts. They provide evidence of design work, rather than post-launch performance data.', ['C04', 'C06', 'C13', 'C16', 'C18'], ['A02']),
    block('results.evaluation', 'Đánh giá từ hội đồng', 'Jury evaluation',
          'Theo tác giả, dự án được hội đồng giám khảo UX/UI của Arena Multimedia đánh giá “Excellent”.',
          'According to the author, the project received an “Excellent” evaluation from Arena Multimedia’s UX/UI design jury.', ['C14'], status='qualified-owner-report', note='Optional, with attribution as written. Owner reports a Lead UX/UI Designer title; the exact panel composition is not documented. No public assessment record or criterion-specific rubric supplied. Never describe this as an innovation award, measured usability result or independent validation.'),
 ]},
 {'id': 'lessons', 'outlineLabel': pair('Bài học', 'Lessons'), 'status': 'missing-author-reflection', 'blocks': [],
  'gapId': 'G05', 'editorialNote': 'No first-person lesson copy until the author supplies a reflection tied to a real constraint, iteration or feedback. Omit the whole section in the limited reader; do not show a coming-soon placeholder.'},
]
pack = {'version': 1, 'dateLocal': '2026-10-08', 'projectId': '241524417', 'targetRouteProposed': '/projects/edura',
        'readiness': 'verified-partial-reader-handoff; detailed-flow-outcome-author-reflection-missing',
        'uiImplementation': False, 'sourcesFile': 'sources.json', 'claimsFile': 'claims.json', 'assetsFile': 'asset-index.json',
        'secondaryLink': {'url': project_url, 'label': pair('Xem hồ sơ nguồn trên Behance', 'View the source project on Behance')},
        'readerPolicy': 'Only ready blocks are default copy; qualified-owner-report is optional with attribution. Empty/gap sections are editor metadata, never publishing placeholders.',
        'sections': sections}
dump('content-index.json', pack)

lines = ['# EDURA — Content pack Vi/En cho R0.3', '',
         '**Bàn giao nội dung một phần có nguồn; chưa làm route/giao diện và chưa xuất bản.**', '',
         'Copy dựa trên artifact quan sát được hoặc xác nhận trực tiếp của tác giả. `ready` là bản có thể bàn giao bố cục; không có nghĩa đã qua usability test. `qualified-owner-report` phải giữ cụm “Theo tác giả / According to the author”.', '',
         '## Outline và mức sẵn sàng', '',
         '| Thứ tự | Phần | Trạng thái |', '|---:|:---|:---|']
for i, section in enumerate(sections, 1):
    lines.append(f"| {i} | {section['outlineLabel']['vi']} / {section['outlineLabel']['en']} | `{section['status']}` |")
lines += ['', 'Bài học chưa có lời tác giả, flow chi tiết chưa có video. Metadata của các phần thiếu chỉ phục vụ handoff; R6 bỏ hẳn phần chưa có nội dung, không render heading rỗng hoặc “coming soon”.', '',
          '## Copy song ngữ', '']
for section in sections:
    if not section['blocks']:
        continue
    for b in section['blocks']:
        lines += [f"### {b['id']} — {b['heading']['vi']}", '',
                  f"**Mức:** `{b['status']}` · **Claims:** {', '.join(b['claimIds'])} · **Ảnh:** {', '.join(b['assetIds']) or 'Không yêu cầu'}", '',
                  '**Vi**', '', b['body']['vi'], '', '**En**', '', f"**{b['heading']['en']}**", '', b['body']['en'], '']
        if b['editorialNote']:
            lines += ['*Ghi chú biên tập, không tự đưa vào copy UI:* ' + b['editorialNote'], '']
lines += ['## Ghi chú nội bộ — phần chưa đưa vào reader', '',
          '- Bài học: tác giả chưa cung cấp reflection gắn với constraint, tradeoff, iteration hoặc feedback. Không viết “Tôi học được…” thay tác giả.',
          '- Flow: tác giả cho biết chỉ có video; chưa có URL/file để xem và đối chiếu các bước. Hình tổng quan A02 không thay được video walkthrough.',
          '- Design system: xác nhận ownership đã có; thư viện component, token, variant/state và quy tắc cụ thể chưa có artifact. Không dựng một bảng system giả.',
          '- Kết quả: không có dữ liệu usability, trước/sau hoặc vận hành. “Excellent” là đánh giá được tác giả xác nhận, không đồng nghĩa kết quả UX đo được.',
          '- Số gần 60%: chỉ là bối cảnh OnCourse bên ngoài; không đưa số vào copy chính. Primary source nói 300 giáo viên, 18 học khu K–12, khảo sát tháng 5/2023; slide A08 ghi 2024. Xem source register.', '',
          '## Handoff ảnh và nhịp đọc', '',
          '- Dùng A02 mở đầu và minh họa quyết định bố cục/màu. Chỉ hiển thị một lần; các đoạn sau liên hệ cùng figure thay vì lặp lại ảnh.',
          '- A07 cho phần vấn đề, A09 cho định hướng giải pháp; caption nêu rõ concept, không outcome.',
          '- A10/A18/A19/A22 là tùy chọn có giới hạn trong asset-index; không cần đưa hết vào reader. A18 có quote chưa xác minh, A19 chứa kỳ vọng chưa đo, A22 có hình lưới chữ Logo minh họa chung.',
          '- Desktop ảnh contain ≤1280px, không phóng vượt 1400px gốc; mobile 288px tại viewport320 / 358px tại390. Chữ đốt trong slide sẽ nhỏ: copy DOM Vi/En là nội dung đọc chính; R6 có thể dùng viewer ảnh gốc truy cập bằng keyboard để xem chi tiết.',
          '- Giữ màu sản phẩm; không grayscale, filter hue hay crop mất nhãn. Khung reader mono/editorial theo kế hoạch, chưa triển khai trong R0.3.',
          '- Đoạn văn đề xuất 60–75 ký tự mỗi dòng desktop, 35–60 mobile; heading ngắn, caption ngay dưới figure. Đây là handoff từ ui-ux-pro-max, chưa phải kết quả đo giao diện.', '',
          '## Nguồn', '',
          '- [Asset index](asset-index.json): đủ 26 file, bytes/hash/URL/alt/caption/dimensions/classification.',
          '- [Claim register](claim-register.md) và [claims.json](claims.json): trạng thái và nguồn từng claim.',
          '- [sources.json](sources.json) và [xác nhận tác giả](owner-confirmation.json).',
          '- [Behance EDURA — nguồn phụ](https://www.behance.net/gallery/241524417/Edura-LMS).',
          '- [OnCourse — nguồn bối cảnh bên ngoài](https://oncoursesystems.com/making-school-data-work-fixing-fragmentation/).',
          '- [Gaps và các phần R6 còn bị chặn](gaps.md).', '']
(OUT / 'content.md').write_text('\n'.join(lines), encoding='utf-8')

# A claim can be sourced while its proposed outcome still remains unverified.
claim_rows = [
 ('C01', 'documented-artifact', 'EDURA là dự án thiết kế LMS cho học viên tại trung tâm đào tạo.', 'EDURA is an LMS design project for learners at training centers.', ['S-PROJECT'], ['A02', 'A19'], 'allow', 'Không suy ra đã ra mắt hoặc đang vận hành.'),
 ('C02', 'user-confirmed', 'Vai trò cá nhân: Lead UI.', 'Individual role: Lead UI.', ['S-OLD-AUDIT', 'S-USER-20261008'], [], 'allow', 'Q04 audit cũ đã chốt; không mở rộng thành Lead UX hoặc ownership toàn bộ dự án.'),
 ('C03', 'user-confirmed', 'Tác giả phụ trách quyết định quy tắc bố cục, màu chủ đạo và thiết kế hệ thống giao diện.', 'The author owned decisions about layout rules, primary color direction and interface system design.', ['S-USER-20261008'], [], 'allow', 'Chưa có rationale, tradeoff, quy tắc cụ thể hoặc feedback; không tự viết thay.'),
 ('C04', 'user-confirmed', 'EDURA là concept/prototype UI/UX trên Figma.', 'EDURA is a UI/UX concept and Figma prototype.', ['S-USER-20261008'], [], 'allow', 'Không gọi shipped, production-ready hoặc app đang phục vụ người dùng.'),
 ('C05', 'documented-project-framing', 'Tài liệu đặt vấn đề thông tin học tập phân tán và đề xuất đưa về một nơi.', 'The materials frame fragmented learning information as a problem and propose bringing it together.', ['S-PROJECT'], ['A07', 'A09', 'A18'], 'allow', 'Định hướng dự án, không phải kết luận nghiên cứu cá nhân hoặc hiệu quả đo.'),
 ('C06', 'observed-artifact', 'Overview EDURA hiển thị điểm, lịch học, học phí, khóa học, điểm danh, bài tập, nộp bài và tiến độ.', 'The EDURA overview shows grades, schedules, tuition, courses, attendance, assignments, submission and progress.', ['S-PROJECT'], ['A02'], 'allow', 'Bằng chứng một overview mockup, không full flow. Số trong màn là dữ liệu minh họa.'),
 ('C07', 'observed-artifact', 'Tư liệu EDURA dùng xanh lam với bề mặt sáng và nhóm chức năng có màu riêng.', 'EDURA materials use blue alongside light surfaces and separately colored function groups.', ['S-PROJECT'], ['A02', 'A19'], 'allow', 'Không suy ra rationale màu, mã token chuẩn hoặc contrast/accessibility đã được kiểm thử.'),
 ('C08', 'user-confirmed-ownership-artifact-missing', 'Thiết kế hệ thống giao diện thuộc phạm vi Lead UI được tác giả xác nhận.', 'Interface system design is within the author-confirmed Lead UI scope.', ['S-USER-20261008'], [], 'qualified', 'Chưa thấy library/token/variant/state; được nói scope, không được khẳng định complete design system.'),
 ('C09', 'documented-expectation-not-outcome', 'Tăng hài lòng/tập trung trong A19 là kỳ vọng của concept.', 'Improved satisfaction and focus in A19 are expectations for the concept.', ['S-PROJECT'], ['A19'], 'qualified', 'Không viết đã tăng hài lòng hoặc biến kỳ vọng thành số đo. Copy legacy giảm fatigue không đủ bằng chứng.'),
 ('C10', 'external-publisher-verified', 'Gần 60% là số OnCourse về tích hợp công cụ; cohort 300 giáo viên, 18 học khu K–12, tháng 5/2023.', 'The nearly 60% figure is OnCourse context about tool integration: 300 educators, 18 K–12 districts, May 2023.', ['S-ONCOURSE', 'S-PROJECT'], ['A08'], 'withhold', 'Không phải nghiên cứu/outcome EDURA. Publisher metadata 2023-08-04; slide ghi2024. Copy chính không cần số; raw data chưa kiểm toán.'),
 ('C11', 'documented-artifact-method-missing', 'Phân khúc và persona có trong hồ sơ; chưa xác minh phương pháp, người tham gia thật hoặc ownership UX cá nhân.', 'Segmentation and personas exist in the materials; methods, real participants and individual UX ownership are not verified.', ['S-PROJECT', 'S-OLD-AUDIT'], ['A10', 'A11', 'A12', 'A13'], 'qualified', 'Không viết tôi khảo sát/phỏng vấn hoặc coi persona/quote là nghiên cứu kiểm định; consent chưa có.'),
 ('C12', 'observed-competitor', 'A15–A17 phân tích APMS, không phải UI EDURA.', 'A15–A17 analyze APMS, not the EDURA interface.', ['S-PROJECT'], ['A15', 'A16', 'A17'], 'withhold', 'Exclude khỏi product gallery; chỉ được dùng với nhãn competitor nếu task sau thật sự cần.'),
 ('C13', 'documented-identity-idea', 'A22 ghi ý tưởng Education + App / Edu + A; lưới minh họa có chữ Logo.', 'A22 states Education + App / Edu + A; its illustrative grid spells Logo.', ['S-PROJECT'], ['A22'], 'qualified', 'Không gọi generic grid là bản dựng hình hoàn chỉnh logo EDURA; chưa xác nhận cá nhân sở hữu quyết định nhận diện này.'),
 ('C14', 'user-confirmed-assessment-public-proof-missing', 'Theo tác giả, dự án được hội đồng giám khảo UX/UI của Arena Multimedia đánh giá Excellent.', 'According to the author, the project received an Excellent evaluation from Arena Multimedia’s UX/UI design jury.', ['S-USER-20261008', 'S-OLD-AUDIT', 'S-LEGACY'], [], 'qualified', 'Chức danh Lead có trong lời tác giả; không suy ra cấu thành/số người hội đồng. Chưa có record/rubric/phạm vi. Không innovation award, usability validation hay excellent UX innovation.'),
 ('C15', 'missing-flow-evidence', 'Tác giả cho biết có video nhưng chưa gửi URL/file; chưa có flow chi tiết đã xem.', 'The author reports a video but has not provided a URL/file; no detailed flow has been reviewed.', ['S-USER-20261008', 'S-PROJECT'], ['A02'], 'withhold', 'Không dựng step/timestamp từ overview hoặc thay bằng APMS. Không placeholder flow để xuất bản.'),
 ('C16', 'missing-measured-outcome', 'Bộ tài liệu chưa có test/feedback hoặc dữ liệu trước–sau xác minh outcome.', 'The reviewed materials contain no test/feedback or before-and-after data establishing an outcome.', ['S-PROJECT', 'S-OLD-AUDIT'], [], 'withhold', 'Chỉ mô tả deliverables, không giảm stress/thời gian hoặc tăng hài lòng/kinh doanh đo được.'),
 ('C17', 'missing-author-reflection', 'Chưa có lời tác giả về bài học từ constraint, iteration hoặc feedback.', 'No author reflection on constraints, iteration or feedback has been supplied.', ['S-USER-20261008', 'S-OLD-AUDIT'], [], 'withhold', 'Không viết Tôi học được/I learned thay tác giả; omit section thiếu, không coming soon.'),
 ('C18', 'verified-cache-inventory', 'Tập hiện có26WebP/24nội dung SHA khác nhau; không phải đầy đủ119module.', 'The cache holds 26 WebP files and 24 distinct SHA values; it is not the complete 119-module gallery.', ['S-PROJECT', 'S-OLD-AUDIT'], [], 'allow', 'Cache discovery order chưa xác minh gallery order. Audit cũ chỉ skim0–118, không kiểm hết119module.'),
 ('C19', 'documented-proposal-implementation-missing', 'Chatbot/hỗ trợ tự động là đề xuất trong concept; chưa xác minh triển khai.', 'Chatbot and automated support are concept proposals; implementation is not verified.', ['S-PROJECT'], ['A09', 'A18'], 'qualified', 'Không gọi tính năng đang hoạt động; ảnh slide không chứng minh backend hoặc product availability.'),
]
claims = [{'id': cid, 'status': status, 'statement': pair(vi, en), 'sourceIds': source_ids,
           'assetIds': asset_ids, 'publication': publication, 'restriction': restriction}
          for cid, status, vi, en, source_ids, asset_ids, publication, restriction in claim_rows]
dump('claims.json', {'claims': claims})
table = ['# EDURA — Claim → nguồn → trạng thái', '',
         '**08/10/2026.** `allow` dùng đúng phạm vi, `qualified` giữ qualifier, `withhold` không đưa claim dương vào reader. Một block có thể dẫn claim thiếu để nói rõ giới hạn, không khẳng định nội dung chưa có.', '',
         'Nguồn S-USER-20261008 là xác nhận trực tiếp, khác với chứng cứ công khai độc lập. S-LEGACY chỉ ghi chỗ copy cũ cần sửa khi tích hợp, không phải nguồn kiểm định claim. Asset/source IDs đối chiếu trong asset-index.json và sources.json.', '',
         '| Claim | Nội dung Vi / En | Nguồn, ảnh | Trạng thái / dùng | Giới hạn |',
         '|:---|:---|:---|:---|:---|']
for c in claims:
    table.append(f"| {c['id']} | {c['statement']['vi']}<br>{c['statement']['en']} | {', '.join(c['sourceIds'])}; {', '.join(c['assetIds']) or 'không có ảnh chứng minh'} | `{c['status']}` / `{c['publication']}` | {c['restriction']} |")
table += ['', '## Thay đổi so với kiểm kê cũ', '',
          '- Ownership bố cục/màu/system và trạng thái concept/prototype Figma đã được tác giả xác nhận trong phiên R0.3, không còn bỏ trống như Q06/Q07 cũ.',
          '- Người đánh giá Excellent đã được nêu theo lời tác giả; record/rubric và tiêu chí vẫn thiếu. Claim legacy về đổi mới UX không được kế thừa.',
          '- Primary OnCourse nay truy cập được: dữ liệu cohort/khảo sát đã đối chiếu, nhưng không thành nghiên cứu EDURA và không kiểm toán raw data.',
          '- Bài học cá nhân, flow video, artifact system/rationale sâu và outcome vẫn thiếu; [gaps.md](gaps.md) ghi đúng phần R6 bị chặn.', '',
          'Đối chiếu nguồn thực: S-OLD-AUDIT Q04 lines843–849; Q06–Q09 lines863–894; A26 lines358–361; T23 lines1146–1147. Xem nguồn URL/attribution và snapshot trong [sources.json](sources.json).', '']
(OUT / 'claim-register.md').write_text('\n'.join(table), encoding='utf-8')
print(json.dumps({'assetRecords': len(assets), 'primary': 3, 'optional': 4,
                  'sections': len(sections), 'copyBlocks': sum(len(s['blocks']) for s in sections)}))
