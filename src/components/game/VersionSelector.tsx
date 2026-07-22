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
    <Card className="mx-auto mt-8 max-w-lg" padding="lg">
      <h1 className="text-xl font-bold text-default">{t('game.version.title')}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}

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
                    ? 'border-accent bg-accent/10 ring-1 ring-accent'
                    : 'border-subtle bg-surface hover:border-accent/50',
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
                    <span className="block font-semibold text-default">{t(version.labelKey)}</span>
                    <span className="block text-sm text-muted">
                      {t('game.version.detail', {
                        cards: version.deckSizePerStack * STACK_COUNT,
                        turns: version.totalTurns,
                      })}
                    </span>
                  </span>
                </span>
                {version.id === DEFAULT_GAME_VERSION.id && (
                  <Badge variant="info">{t('game.version.default')}</Badge>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <Button className="mt-6 w-full" onClick={() => onStart(getGameVersion(selectedId))}>
        {t('game.version.start')}
      </Button>
    </Card>
  );
}
