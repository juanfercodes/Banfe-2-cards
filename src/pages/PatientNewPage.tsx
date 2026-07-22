import { useTranslation } from 'react-i18next';

export default function PatientNewPage() {
  const { t } = useTranslation();
  return <div className="p-4">{t('route.placeholder')}</div>;
}
