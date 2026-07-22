import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Input } from '@/components/ui/Input';
import { listPatients, type Patient } from '@/lib/dataAccess';

export function PatientPicker() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    void listPatients().then((result) => {
      if (!active) return;
      setPatients(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return patients;
    return patients.filter((patient) => patient.code.toLowerCase().includes(normalized));
  }, [patients, query]);

  function selectPatient(patient: Patient) {
    void navigate(`/play/${patient.id}`);
  }

  return (
    <div className="w-full max-w-sm">
      <Input
        label={t('patient.pickExisting')}
        placeholder={t('patient.search')}
        role="combobox"
        aria-expanded="true"
        aria-autocomplete="list"
        aria-controls="patient-picker-list"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul
        id="patient-picker-list"
        role="listbox"
        aria-label={t('patient.pickExisting')}
        className="mt-2 max-h-60 overflow-auto rounded-lg border border-subtle bg-surface py-1 shadow-sm"
      >
        {loading && <li className="px-3 py-2 text-sm text-muted">{t('common.loading')}</li>}
        {!loading && filtered.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted">{t('common.noData')}</li>
        )}
        {!loading &&
          filtered.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => selectPatient(patient)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-default hover:bg-base focus:outline-none focus:bg-base"
              >
                <span>{patient.code}</span>
                <span className="text-xs text-muted">
                  {new Date(patient.createdAt).toLocaleDateString()}
                </span>
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}
