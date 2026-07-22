import { useLanguage } from '../../i18n/LanguageProvider';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const toggle = () => {
    setLocale(locale === 'es' ? 'en' : 'es');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={locale === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
      className="rounded-md border border-foreground/20 px-3 py-1 text-sm hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-accent"
    >
      {locale === 'es' ? 'EN' : 'ES'}
    </button>
  );
}
