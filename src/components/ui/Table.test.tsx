import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Table } from './Table';
import { renderWithProviders } from '../../test/render';

type Row = { id: string; name: string; score: number };

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'score', header: 'Score', render: (row: Row) => row.score },
];

describe('<Table />', () => {
  it('renders rows from data', () => {
    const data: Row[] = [
      { id: '1', name: 'Alice', score: 10 },
      { id: '2', name: 'Bob', score: 20 },
    ];
    renderWithProviders(<Table data={data} columns={columns} keyExtractor={(row) => row.id} />);
    expect(screen.getByRole('cell', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '20' })).toBeInTheDocument();
  });

  it('shows empty state when no rows', () => {
    renderWithProviders(<Table data={[]} columns={columns} keyExtractor={(row) => row.id} />);
    expect(screen.getByText(/No hay datos|No data/i)).toBeInTheDocument();
  });

  it('toggles sort direction on header click', async () => {
    const user = userEvent.setup();
    const data: Row[] = [
      { id: '1', name: 'Bob', score: 20 },
      { id: '2', name: 'Alice', score: 10 },
    ];
    renderWithProviders(<Table data={data} columns={columns} keyExtractor={(row) => row.id} />);
    const header = screen.getByRole('button', { name: /Name/i });
    await user.click(header);
    const cells = screen.getAllByRole('cell', { name: /Alice|Bob/i });
    expect(cells[0]).toHaveTextContent('Alice');
  });

  it('fires row click handler', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();
    const data: Row[] = [{ id: '1', name: 'Alice', score: 10 }];
    renderWithProviders(
      <Table
        data={data}
        columns={columns}
        keyExtractor={(row) => row.id}
        onRowClick={handleRowClick}
      />,
    );
    await user.click(screen.getByRole('row', { name: /Alice/i }));
    expect(handleRowClick).toHaveBeenCalledWith(data[0]);
  });
});
