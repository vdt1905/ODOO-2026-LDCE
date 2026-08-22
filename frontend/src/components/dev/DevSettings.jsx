import { useEffect, useState } from 'react';
import { Check, RotateCcw, Type, X } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import {
  DEFAULTS,
  FONT_PAIRS,
  applySettings,
  readSettings,
  writeSettings,
} from '../../lib/devSettings.js';

/**
 * Development-only type tester. Bottom-left so it never fights the
 * "+ Plan a trip" FAB in the opposite corner.
 *
 * REMOVE BEFORE THE FINAL BUILD — see lib/devSettings.js for the checklist.
 * It is mounted unconditionally rather than behind import.meta.env.DEV so it
 * survives a preview build, which is where the type actually gets judged.
 */
export const DevSettings = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    applySettings(settings);
    writeSettings(settings);
  }, [settings]);

  // Escape closes, and `.` with a modifier toggles — the panel covers content,
  // so getting rid of it has to be faster than aiming at the button.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === '.' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const update = (patch) => setSettings((current) => ({ ...current, ...patch }));
  const active = FONT_PAIRS.find((pair) => pair.id === settings.pairId) || FONT_PAIRS[0];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Type settings (Ctrl/Cmd + .)"
        aria-label="Open type settings"
        className="fixed bottom-5 left-5 z-[60] grid size-11 place-items-center rounded-full border border-line bg-surface text-ink-500 transition-colors hover:border-brand-500 hover:text-brand-500"
      >
        <Type className="size-4" aria-hidden />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 left-5 z-[60] flex max-h-[min(78vh,640px)] w-[330px] flex-col overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="eyebrow text-ink-500">Dev · type</p>
          <p className="mt-0.5 text-sm font-bold text-ink-900">{active.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSettings({ ...DEFAULTS })}
            title="Reset to defaults"
            aria-label="Reset to defaults"
            className="grid size-8 place-items-center rounded-full text-ink-300 transition-colors hover:bg-canvas-deep hover:text-ink-900"
          >
            <RotateCcw className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close type settings"
            className="grid size-8 place-items-center rounded-full text-ink-300 transition-colors hover:bg-canvas-deep hover:text-ink-900"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Each row is rendered in the face it selects — the list doubles as
            the specimen, so you never pick blind. */}
        <div className="flex flex-col gap-1">
          {FONT_PAIRS.map((pair) => {
            const selected = pair.id === settings.pairId;
            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => update({ pairId: pair.id })}
                className={cn(
                  'rounded-2xl border px-3 py-2.5 text-left transition-colors',
                  selected
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-transparent hover:border-line hover:bg-inset'
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className="truncate text-lg leading-tight text-ink-900"
                    style={{
                      fontFamily: pair.display,
                      fontWeight: pair.weight,
                      letterSpacing: pair.tracking,
                      textTransform: settings.uppercase ? 'uppercase' : 'none',
                    }}
                  >
                    Iberia &amp; Atlas
                  </span>
                  {selected && <Check className="size-4 shrink-0 text-brand-500" aria-hidden />}
                </span>
                <span
                  className="mt-1 block truncate text-xs text-ink-500"
                  style={{ fontFamily: pair.body }}
                >
                  {pair.name}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-2 px-1 text-xs leading-relaxed text-ink-500">{active.note}</p>

        <div className="mt-3 space-y-3 border-t border-line pt-3">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-ink-700">Uppercase headings</span>
            <input
              type="checkbox"
              checked={settings.uppercase}
              onChange={(event) => update({ uppercase: event.target.checked })}
              className="size-4 accent-brand-500"
            />
          </label>

          <div>
            <label
              htmlFor="dev-scale"
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-medium text-ink-700">Base size</span>
              <span className="tabular-nums text-ink-500">{settings.scale}%</span>
            </label>
            <input
              id="dev-scale"
              type="range"
              min={85}
              max={115}
              step={1}
              value={settings.scale}
              onChange={(event) => update({ scale: Number(event.target.value) })}
              className="mt-2 w-full accent-brand-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
