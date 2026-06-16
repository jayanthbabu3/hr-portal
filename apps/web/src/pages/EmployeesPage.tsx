import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tag,
  DataTableSkeleton,
} from '@carbon/react';
import { Add, ArrowRight } from '@carbon/icons-react';
import { api } from '../lib/api';
import type { Employee } from '../lib/types';
import { PageHeader } from '../components/PageHeader';

const headers = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'department', header: 'Department' },
  { key: 'jobTitle', header: 'Role' },
  { key: 'status', header: 'Status' },
  { key: 'actions', header: '' },
];

const statusColors: Record<string, 'blue' | 'green' | 'red' | 'gray'> = {
  onboarding: 'blue',
  active: 'green',
  offboarding: 'red',
  terminated: 'gray',
};

export function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api<Employee[]>(`/employees${q}`)
      .then(setEmployees)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const rows = employees.map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    email: e.email,
    department: e.department,
    jobTitle: e.jobTitle,
    status: e.status,
    actions: e.id,
  }));

  return (
    <div className="hr-page">
      <PageHeader
        eyebrow="People"
        title="Employees"
        subtitle="Your single source of truth for everyone in the organization."
        actions={
          <Button renderIcon={Add} onClick={() => navigate('/employees/new')}>
            Add employee
          </Button>
        }
      />

      {loading ? (
        <DataTableSkeleton columnCount={6} rowCount={6} showHeader={false} />
      ) : (
        <div className="hr-table-wrap">
          <DataTable rows={rows} headers={headers}>
            {({
              rows,
              headers,
              getTableProps,
              getHeaderProps,
              getRowProps,
              getToolbarProps,
              onInputChange,
            }) => (
              <TableContainer>
                <TableToolbar {...getToolbarProps()}>
                  <TableToolbarContent>
                    <TableToolbarSearch
                      persistent
                      placeholder="Search by name, email or department"
                      onChange={(e) => {
                        if (e && typeof e !== 'string') onInputChange(e);
                        setSearch(
                          typeof e === 'string'
                            ? e
                            : ((e as React.ChangeEvent<HTMLInputElement>)?.target
                                ?.value ?? ''),
                        );
                      }}
                    />
                  </TableToolbarContent>
                </TableToolbar>
                <Table {...getTableProps()} size="lg">
                  <TableHead>
                    <TableRow>
                      {headers.map((h) => (
                        <TableHeader {...getHeaderProps({ header: h })} key={h.key}>
                          {h.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        {...getRowProps({ row })}
                        key={row.id}
                        onClick={() => navigate(`/employees/${row.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {row.cells.map((cell) => {
                          if (cell.info.header === 'status') {
                            return (
                              <TableCell key={cell.id}>
                                <Tag
                                  type={statusColors[String(cell.value)] ?? 'gray'}
                                  className="hr-status"
                                >
                                  {String(cell.value)}
                                </Tag>
                              </TableCell>
                            );
                          }
                          if (cell.info.header === '') {
                            return (
                              <TableCell key={cell.id}>
                                <ArrowRight
                                  size={16}
                                  style={{ color: 'var(--ln-ink-subtle)' }}
                                />
                              </TableCell>
                            );
                          }
                          return <TableCell key={cell.id}>{cell.value}</TableCell>;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        </div>
      )}
    </div>
  );
}
