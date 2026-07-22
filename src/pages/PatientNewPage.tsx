import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { createPatient, listPatients, PatientConflictError } from '@/lib/dataAccess';

const MAX_CODE_LENGTH = 40;

export default function PatientNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conflictCode, setConflictCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return t('patient.validation.codeRequired');
    if (/\s/.test(value)) return t('patient.validation.codeNoSpaces');
    if (trimmed.length > MAX_CODE_LENGTH) return t('patient.validation.codeTooLong');
    return null;
  }

  async function goToExistingPatient(existingCode: string) {
    const patients = await listPatients();
    const existing = patients.find((patient) => patient.code === existingCode);
    if (existing) {
      void navigate(`/play/${existing.id}`);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConflictCode(null);
    const validationError = validate(code);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const patient = await createPatient(code.trim());
      void navigate(`/play/${patient.id}`);
    } catch (err) {
      if (err instanceof PatientConflictError) {
        setConflictCode(err.code);
      } else {
        setError(t('patient.conflict'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md" padding="lg">
      <h1 className="mb-4 text-xl font-bold text-default">{t('patient.create')}</h1>
      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-4">
        <Input
          label={t('patient.code')}
          placeholder={t('patient.codePlaceholder')}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setConflictCode(null);
          }}
          {...(error ? { error } : {})}
        />
        {conflictCode && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm"
          >
            <p className="text-red-400">{t('patient.conflict')}</p>
            <button
              type="button"
              onClick={() => void goToExistingPatient(conflictCode)}
              className="mt-2 font-medium text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {t('patient.conflictCta')}
            </button>
          </div>
        )}
        <Button type="submit" isLoading={submitting}>
          {t('patient.create')}
        </Button>
      </form>
    </Card>
  );
}
