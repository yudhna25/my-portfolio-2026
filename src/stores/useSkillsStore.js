import { create } from 'zustand';
import { skillTools } from '@/data/skills';

export const activeSkill = (state) => state.focus ?? state.selection ?? state.hover;
export const useSkillsStore = create((set) => ({
  hover: null, focus: null, selection: null, visible: false,
  interact(channel, id) {
    if (!['hover', 'focus', 'selection'].includes(channel) || (id !== null && !skillTools.some((tool) => tool.id === id))) return;
    set((state) => state[channel] === id ? state : { [channel]: id });
  },
  setVisible(visible) { set((state) => state.visible === visible ? state : { visible }); },
  clear() { set({ hover: null, focus: null, selection: null }); },
}));
