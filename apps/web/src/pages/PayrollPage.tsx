import { useEffect, useState } from 'react';
import {
  Button,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TextInput,
  Grid,
  Column,
  DataTableSkeleton,
  InlineNotification,
} from '@carbon/react';
import { Money } from '@carbon/icons-react';
import { api, ApiError } from '../lib/api';
import { formatMoney } from '../lib/format';
import type { Payslip } from '../lib/types';
import { PageHeader } from '../components/PageHeader';

const headers = [
  { key: 'employee', header: 'Employee' },
  { key: 'period', header: 'Period' },
  { key: 'earnings', header: 'Earnings' },
  { key: 'deductions', header: 'Deductions' },
  { key: 'netPay', header: 'Net pay' },
];

export function PayrollPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const load = () => {
    setLoading(true);
    api<Payslip[]>('/payroll/payslips')
      .then(setPayslips)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setPeriodStart(start.toISOString().slice(0, 10));
    setPeriodEnd(end.toISOString().slice(0, 10));
    load();
  }, []);

  const generateAll = async () => {
    setGenerating(true);
    setError('');
    setMessage('');
    try {
      const res = await api<{ payslips: Payslip[] }>('/payroll/payslips', {
        method: 'POST',
        body: JSON.stringify({ periodStart, periodEnd }),
      });
      setMessage(`Generated ${res.payslips.length} payslip(s)`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const rows = payslips.map((p) => ({
    id: p.id,
    employee: p.employee
      ? `${p.employee.firstName} ${p.employee.lastName}`
      : '—',
    period: `${new Date(p.periodStart).toLocaleDateString()} – ${new Date(p.periodEnd).toLocaleDateString()}`,
    earnings: formatMoney(p.earnings),
    deductions: formatMoney(p.deductions),
    netPay: formatMoney(p.netPay),
  }));

  return (
    <div className="hr-page">
      <PageHeader
        eyebrow="People"
        title="Payroll"
        subtitle="Generate payslips for a pay period across your active workforce."
        actions={
          <Button
            renderIcon={Money}
            onClick={generateAll}
            disabled={generating}
          >
            {generating ? 'Generating…' : 'Generate payslips'}
          </Button>
        }
      />
      <Grid style={{ marginBottom: '2rem' }}>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="periodStart"
            labelText="Period start"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </Column>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="periodEnd"
            labelText="Period end"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </Column>
      </Grid>
      {message && (
        <InlineNotification kind="success" title={message} style={{ marginBottom: '1rem' }} lowContrast />
      )}
      {error && (
        <InlineNotification kind="error" title={error} style={{ marginBottom: '1rem' }} lowContrast />
      )}
      {loading ? (
        <DataTableSkeleton columnCount={5} rowCount={6} showHeader={false} />
      ) : (
        <div className="hr-table-wrap">
          <DataTable rows={rows} headers={headers}>
            {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
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
                    <TableRow {...getRowProps({ row })} key={row.id}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataTable>
        </div>
      )}
    </div>
  );
}
