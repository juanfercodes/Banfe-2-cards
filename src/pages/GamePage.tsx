import { useTranslation } from 'react-i18next';

export default function GamePage() {
  const { t } = useTranslation();
  return <div className="p-4">{t('route.placeholder')}</div>;
}
