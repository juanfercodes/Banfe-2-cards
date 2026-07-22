import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listPatientsMock } = vi.hoisted(() => ({ listPatientsMock: vi.fn() }));

vi.mock('@/lib/dataAccess', () => ({ listPatients: listPatientsMock }));

import i18n from '@/i18n/index';

import { PatientPicker } from './PatientPicker';

function LocationStub() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPicker() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PatientPicker />} />
          <Route path="/play/:patientId" element={<LocationStub />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

const PATIENTS = [
  { id: 'p-1', clinicianId: 'c-1', code: 'PAC-001', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'p-2', clinicianId: 'c-1', code: 'PAC-002', createdAt: '2026-01-02T00:00:00Z' },
];

describe('<PatientPicker />', () => {
  beforeEach(() => {
    listPatientsMock.mockReset();
  });

  it('lists patients with their code and created date', async () => {
    listPatientsMock.mockResolvedValue(PATIENTS);
    renderPicker();

    const list = screen.getByRole('listbox');
    expect(await within(list).findByText('PAC-001')).toBeInTheDocument();
    expect(within(list).getByText('PAC-002')).toBeInTheDocument();
  });

  it('narrows results by typing', async () => {
    listPatientsMock.mockResolvedValue(PATIENTS);
    const user = userEvent.setup();
    renderPicker();

    const list = screen.getByRole('listbox');
    await within(list).findByText('PAC-001');

    await user.type(screen.getByRole('combobox'), '002');

    expect(within(list).queryByText('PAC-001')).not.toBeInTheDocument();
    expect(within(list).getByText('PAC-002')).toBeInTheDocument();
  });

  it('navigates to /play/:id when a patient is selected', async () => {
    listPatientsMock.mockResolvedValue(PATIENTS);
    const user = userEvent.setup();
    renderPicker();

    const list = screen.getByRole('listbox');
    await within(list).findByText('PAC-001');

    await user.click(screen.getByRole('option', { name: /PAC-001/ }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/play/p-1');
  });
});
