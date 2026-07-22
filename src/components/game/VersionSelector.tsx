import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type GameVersion,
  type GameVersionId,
  DEFAULT_GAME_VERSION,
  GAME_VERSIONS,
  STACK_COUNT,
  getGameVersion,
} from '@/lib/protocol';
import { Badge, Button, Card } from '../ui';
import { cn } from '../ui/cn';

export interface VersionSelectorProps {
  subtitle?: string | undefined;
  onStart: (version: GameVersion) => void;
}

export function VersionSelector({ subtitle, onStart }: VersionSelectorProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<GameVersionId>(DEFAULT_GAME_VERSION.id);

  return (
    <div className="mx-auto mt-10 flex max-w-lg flex-col items-center px-4">
      <div
        aria-hidden="true"
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-inset ring-accent/25"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M16.5 6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3v-6A4.5 4.5 0 0 1 10.5 6h6Z" />
          <path d="M18 7.5a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-7.5a3 3 0 0 1-3-3v-7.5a3 3 0 0 1 3-3H18Z" />
        </svg>
      </div>
      <Card className="w-full shadow-card" padding="lg">
        <h1 className="text-xl font-bold text-default">{t('game.version.title')}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <p className="mt-2 text-sm text-muted">{t('game.version.hint')}</p>

        <fieldset className="mt-6">
          <legend className="sr-only">{t('game.version.title')}</legend>
          <div className="flex flex-col gap-3">
            {GAME_VERSIONS.map((version) => {
              const selected = version.id === selectedId;
              return (
                <label
                  key={version.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition-colors',
                    selected
                      ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent'
                      : 'border-subtle bg-surface hover:border-accent/50 hover:bg-raised/40',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="game-version"
                      value={version.id}
                      checked={selected}
                      onChange={() => setSelectedId(version.id)}
                      className="h-4 w-4 accent-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
                    />
                    <span>
                      <span className="block font-semibold text-default">
                        {t(version.labelKey)}
                      </span>
                      <span className="block text-sm text-muted">
                        {t('game.version.detail', {
                          cards: version.deckSizePerStack * STACK_COUNT,
                          turns: version.totalTurns,
                        })}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {version.id === DEFAULT_GAME_VERSION.id && (
                      <Badge variant="info">{t('game.version.default')}</Badge>
                    )}
                    {selected && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5 text-accent"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Button
          size="lg"
          className="mt-6 w-full"
          onClick={() => onStart(getGameVersion(selectedId))}
        >
          {t('game.version.start')}
        </Button>
      </Card>
    </div>
  );
}
