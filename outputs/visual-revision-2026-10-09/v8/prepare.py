from pathlib import Path
import json

for lang in ('vi', 'en'):
    path = Path(f'src/i18n/locales/{lang}.json')
    data = json.loads(path.read_text(encoding='utf-8'))
    data['education'].pop('constellations', None)
    data['education']['constellationNames'] = {'Orion': 'Orion', 'Scorpius': 'Scorpius', 'Leo': 'Leo'}
    data['education']['figureLabel'] = '{{school}} — {{constellation}}'
    data['constellationCredits'] = {
      'label': 'Nguồn hình sao' if lang == 'vi' else 'Constellation credits',
      'title': 'Nguồn & giấy phép' if lang == 'vi' else 'Sources & licenses',
      'close': 'Đóng nguồn hình sao' if lang == 'vi' else 'Close constellation credits',
      'illustrations': 'Hình minh họa gốc:' if lang == 'vi' else 'Original illustrations:',
      'adaptation': 'Chuyển thể đơn sắc, vector hóa và căn chỉnh theo ba sao: portfolio Trần Vũ Anh Duy / Codex. Tác phẩm đã chỉnh sửa, phân phối theo Free Art License 1.3.' if lang == 'vi' else 'Monochrome adaptation, vector tracing and three-star calibration: Trần Vũ Anh Duy portfolio / Codex. Modified works distributed under Free Art License 1.3.',
      'source': 'Nguồn Stellarium đã ghim' if lang == 'vi' else 'Pinned Stellarium source',
      'patterns': 'Nét nối: nhóm Stellarium, giấy phép' if lang == 'vi' else 'Line patterns: Stellarium team, licensed under',
      'catalog': 'Vị trí sao:' if lang == 'vi' else 'Star positions:',
      'attribution': 'Ghi công đầy đủ' if lang == 'vi' else 'Full attribution',
      'manifest': 'Danh mục tài sản' if lang == 'vi' else 'Asset manifest',
    }
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    labpath = Path(f'src/i18n/locales/{lang}/lab.json')
    lab = json.loads(labpath.read_text(encoding='utf-8'))
    for key, old, new in [('saigonUniversity','Circinus','Orion'),('greenAcademy','Telescopium','Scorpius'),('arenaMultimedia','Pictor','Leo')]:
        lab['symbols']['targets'][key] = lab['symbols']['targets'][key].replace(old, new)
    lab['story']['notes']['education'] = 'Bản đồ Orion / Scorpius / Leo dùng cùng renderer và artwork với trang chính.' if lang == 'vi' else 'Orion / Scorpius / Leo share the main page renderer and artwork.'
    labpath.write_text(json.dumps(lab, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

path = Path('src/3d-lab.jsx')
s = path.read_text(encoding='utf-8')
start = s.index('// Stable sample controls')
end = s.index('export default function Lab()')
s = s[:start] + s[end:]
s = s.replace("import { SymbolStars } from '@/3d/components/SymbolStars';\nimport { SYMBOL_TOOL_IDS, SYMBOL_EDUCATION_IDS } from '@/3d/utils/symbolMorph';", "import { SkillsSymbols } from '@/3d/components/SkillsSymbols';\nimport { StoryMeteor } from '@/3d/components/StoryMeteor';\nimport { createWorksLayout } from '@/3d/utils/worksOrbit';\nimport Work from '@/components/Work';\nimport Skills from '@/components/sections/Skills';\nimport Education from '@/components/Education';\nimport Experience from '@/components/sections/Experience';\nimport { ConstellationCredits } from '@/components/ui/ConstellationCredits';")
s = s.replace("import { WORKS_IDS } from '@/3d/utils/worksOrbit';\nimport { finaleState } from '@/3d/utils/finale';\nimport { gsap, useGSAPSetup } from '@/hooks/useGSAPSetup';\n", '')
s = s.replace('  const [symbolTarget, setSymbolTarget] = useState(null);\n  const skillsAnchor = useRef(null), educationAnchor = useRef(null);', "  const skillsAnchor = useRef(null);\n  const meteorLayout = useRef(null);\n  const [worksLayout] = useState(() => ({ current: createWorksLayout() }));\n  const [educationStages] = useState(() => ({ saigonUniversity: { current: null }, greenAcademy: { current: null }, arenaMultimedia: { current: null } }));")
s = s.replace('<WorksConstellations frozen={frozen} quality={tier} />', '<WorksConstellations frozen={frozen} quality={tier} layoutRef={worksLayout} />')
s = s.replace("{story && <SymbolStars anchor={chapter === 'education' ? educationAnchor : skillsAnchor} target={symbolTarget}\n          active={showContent && (chapter === 'skills' || chapter === 'education')} frozen={frozen} />}", "{story && <SkillsSymbols anchor={skillsAnchor} educationAnchors={educationStages} />}\n        {story && <StoryMeteor layout={meteorLayout} frozen={frozen} />}")
s = s.replace('{story && <WorksControls visible={showContent} />}', '<ConstellationCredits />')
s = s.replace("{STORY_CHAPTERS.map(item => item.id === 'about' ?", "{STORY_CHAPTERS.filter(item => item.id !== 'departure').map(item => item.id === 'skills' ? <div key={item.id} data-story-chapter=\"skills\" className=\"pointer-events-auto\"><Skills stageRef={skillsAnchor} /></div>\n            : item.id === 'education' ? <div key={item.id} data-story-chapter=\"education\" className=\"pointer-events-auto\"><Education stageRefs={educationStages} /></div>\n            : item.id === 'experience' ? <div key={item.id} data-story-chapter=\"experience\" className=\"pointer-events-auto\"><Experience onLayout={layout => { meteorLayout.current = layout; }} /></div>\n            : item.id === 'works' ? <div key={item.id} data-story-chapter=\"works\" className=\"pointer-events-auto\"><Work layoutRef={worksLayout} nativeNavigation /></div>\n            : item.id === 'about' ?")
start = s.index("              {(item.id === 'skills' || item.id === 'education')")
end = s.index('            </section>', start)
s = s[:start] + s[end:]
s = s.replace('<div data-lab-controls className={`fixed bottom-3', '<details data-lab-controls open={!story} className={`fixed bottom-3')
s = s.replace("${(chapter === 'skills' || chapter === 'education') && story ? 'max-h-[23vh] overflow-y-auto md:inset-x-auto md:right-3 md:w-72' : ''}`}>\n        {story", "${story ? 'max-h-[35vh] overflow-y-auto' : ''}`}>\n        <summary className=\"min-h-11 w-full cursor-pointer content-center text-center font-mono text-xs text-secondary\">{t('controls')}</summary>\n        {story")
s = s.replace('        </details>\n      </div>', '        </details>\n      </details>')
path.write_text(s, encoding='utf-8')
