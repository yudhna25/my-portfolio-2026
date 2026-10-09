import { create } from 'zustand';
import { educationInstitutions } from '@/data/education';

export const activeEducation = (state) => state.focus ?? state.selection ?? state.hover;
export const useEducationStore = create((set) => ({
  hover: null, focus: null, selection: null, visible: false, anchorId: 'saigonUniversity',
  interact(channel, id) {
    if (!['hover', 'focus', 'selection'].includes(channel) || (id !== null && !educationInstitutions.some(item => item.id === id))) return;
    set(state => {
      if (state[channel] === id) return state;
      const next = { ...state, [channel]: id };
      return { [channel]: id, anchorId: activeEducation(next) ?? state.anchorId };
    });
  },
  setVisible(visible) { set(state => state.visible === visible ? state : { visible }); },
  clear() { set({ hover: null, focus: null, selection: null }); },
}));
