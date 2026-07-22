import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createPatientMock, listPatientsMock } = vi.hoisted(() => ({
  createPatientMock: vi.fn(),
  listPatientsMock: vi.fn(),
}));

vi.mock('@/lib/dataAccess', async () => {
  const actual = await vi.importActual<typeof import('@/lib/dataAccess')>('@/lib/dataAccess');
  return {
    ...actual,
    createPatient: createPatientMock,
    listPatients: listPatientsMock,
  };
});

import { PatientConflictError } from '@/lib/dataAccess';
import i18n from '@/i18n/index';

import PatientNewPage from './PatientNewPage';

function LocationStub() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/patients/new']}>
        <Routes>
          <Route path="/patients/new" element={<PatientNewPage />} />
          <Route path="/play/:patientId" element={<LocationStub />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('<PatientNewPage />', () => {
  beforeEach(() => {
    createPatientMock.mockReset();
    listPatientsMock.mockReset();
  });

  it('shows a validation error for an empty code', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /crear paciente|create patient/i }));

    expect(await screen.findByText(/ingresa un código|enter a code/i)).toBeInTheDocument();
    expect(createPatientMock).not.toHaveBeenCalled();
  });

  it('navigates to /play/:id with the short flag on success', async () => {
    createPatientMock.mockResolvedValue({
      id: 'patient-1',
      clinicianId: 'c-1',
      code: 'PAC-001',
      createdAt: '2026-01-01T00:00:00Z',
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/código del paciente|patient code/i), 'PAC-001');
    await user.click(screen.getByRole('button', { name: /crear paciente|create patient/i }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/play/patient-1?short=1');
    expect(createPatientMock).toHaveBeenCalledWith('PAC-001');
  });

  it('shows a conflict message and navigates to the existing patient on CTA click', async () => {
    createPatientMock.mockRejectedValue(new PatientConflictError('PAC-001'));
    listPatientsMock.mockResolvedValue([
      { id: 'existing-1', clinicianId: 'c-1', code: 'PAC-001', createdAt: '2026-01-01T00:00:00Z' },
    ]);
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/código del paciente|patient code/i), 'PAC-001');
    await user.click(screen.getByRole('button', { name: /crear paciente|create patient/i }));

    expect(
      await screen.findByText(/ya existe un paciente|patient with this code already exists/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ir a jugar|go play/i }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/play/existing-1');
  });
});
