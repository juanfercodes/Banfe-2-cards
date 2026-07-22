import { useLanguage } from '../../i18n/LanguageProvider';
import { cn } from './cn';

export interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  const toggle = () => {
    setLocale(locale === 'es' ? 'en' : 'es');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={locale === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
      className={cn(
        'rounded-md border border-subtle px-3 py-1 text-sm text-default hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent',
        className,
      )}
    >
      {locale === 'es' ? 'EN' : 'ES'}
    </button>
  );
}
