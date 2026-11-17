import { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioStore } from '@/stores/useAudioStore';

export function SoundToggle() {
  const statusId = useId();
  const { t } = useTranslation();
  const active = useAudioStore(state => state.isStarted && !state.isMuted);
  const pending = useAudioStore(state => state.isPending);
  const error = useAudioStore(state => state.error);
  const toggleSound = useAudioStore(state => state.toggleSound);

  useEffect(() => () => useAudioStore.getState().resetAudio(), []);

  return (
    <>
      <button
        type="button"
        role="switch"
        data-sound-toggle
        aria-checked={active}
        aria-label={t('common.audio.label')}
        aria-busy={pending}
        aria-disabled={pending || undefined}
        aria-describedby={error ? statusId : undefined}
        title={t(`common.audio.${active ? 'turnOff' : 'turnOn'}`)}
        onClick={toggleSound}
        className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 px-1 font-mono text-sm leading-tight text-white hover:text-white/80 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4 sm:px-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6 shrink-0" aria-hidden="true" focusable="false">
          <path d="M11 4 6 8H3v8h3l5 4V4Z" strokeLinejoin="round" />
          {active ? <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" strokeLinecap="round" /> : <path d="m16 9 6 6m0-6-6 6" strokeLinecap="round" />}
        </svg>
        <span className="hidden sm:flex sm:flex-row sm:gap-1">
          <span>{t('common.audio.prefix')}</span>
          <span className={active ? 'text-(--color-amber,#FFB25B)' : 'text-white/70'}>{t(`common.audio.${active ? 'on' : 'off'}`)}</span>
        </span>
      </button>
      <span id={statusId} role="status" className="sr-only">{error ? t('common.audio.unavailable') : ''}</span>
    </>
  );
}
