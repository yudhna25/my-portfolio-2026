import { SymbolStars } from '@/3d/components/SymbolStars';
import { useSkillsStore, activeSkill } from '@/stores/useSkillsStore';
import { useScrollStore } from '@/stores/useScrollStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useEducationStore, activeEducation } from '@/stores/useEducationStore';

export function SkillsSymbols({ anchor, educationAnchors }) {
  const skill = useSkillsStore(activeSkill);
  const skillVisible = useSkillsStore((state) => state.visible);
  const skillFocus = useSkillsStore((state) => state.focus);
  const education = useEducationStore(activeEducation);
  const educationVisible = useEducationStore((state) => state.visible);
  const anchorId = useEducationStore((state) => state.anchorId);
  const chapter = useScrollStore((state) => state.storyChapter);
  const frozen = useReducedMotion();
  // A visible control can receive focus before its section top crosses the viewport.
  const isEducation = educationVisible && (chapter === 'education' || education !== null) && !(skillVisible && skillFocus);
  return <SymbolStars anchor={isEducation ? educationAnchors[anchorId] : anchor}
    target={isEducation ? education : skill} active={isEducation ? educationVisible : (chapter === 'skills' || skill !== null) && skillVisible} frozen={frozen} />;
}
