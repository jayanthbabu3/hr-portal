import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Modal,
  TextInput,
  InlineNotification,
  Loading,
  Tag,
} from '@carbon/react';
import { api, ApiError, downloadBlob } from '../lib/api';
import { formatMoney } from '../lib/format';
import type { Document, Employee } from '../lib/types';
import { PageHeader } from '../components/PageHeader';

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sendModal, setSendModal] = useState<Document | null>(null);
  const [sendEmail, setSendEmail] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api<Employee>(`/employees/${id}`)
      .then((e) => {
        setEmployee(e);
        setSendEmail(e.email);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => load(), [load]);

  const runAction = async (
    path: string,
    body?: object,
    successMsg?: string,
  ) => {
    setError('');
    setMessage('');
    try {
      await api(path, {
        method: 'POST',
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setMessage(successMsg ?? 'Done');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    }
  };

  const sendDocument = async () => {
    if (!sendModal) return;
    try {
      await api(`/documents/${sendModal.id}/send`, {
        method: 'POST',
        body: JSON.stringify({ toEmail: sendEmail }),
      });
      setSendModal(null);
      setMessage('Email sent');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Send failed');
    }
  };

  if (loading) return <Loading description="Loading employee" withOverlay />;
  if (!employee) return <p>Employee not found</p>;

  const docHeaders = [
    { key: 'type', header: 'Type' },
    { key: 'version', header: 'Ver' },
    { key: 'generatedAt', header: 'Generated' },
    { key: 'sent', header: 'Sent' },
    { key: 'actions', header: 'Actions' },
  ];

  const docRows = (employee.documents ?? []).map((d) => ({
    id: d.id,
    type: d.type.replace(/_/g, ' '),
    version: String(d.version),
    generatedAt: new Date(d.generatedAt).toLocaleString(),
    sent: d.sentAt ? `Yes → ${d.sentTo}` : 'No',
    actions: d.id,
    _doc: d,
  }));

  return (
    <div className="hr-page">
      <PageHeader
        eyebrow={`${employee.department} · ${employee.jobTitle}`}
        title={`${employee.firstName} ${employee.lastName}`}
        actions={
          <>
            <Button
              kind="secondary"
              size="md"
              onClick={() =>
                runAction(`/employees/${id}/onboard`, undefined, 'Onboarding docs generated')
              }
            >
              Regenerate onboarding
            </Button>
            <Button
              kind="danger--tertiary"
              size="md"
              onClick={() => {
                const day = prompt('Last working day (YYYY-MM-DD):');
                if (day)
                  runAction(`/employees/${id}/offboard`, { lastWorkingDay: day }, 'Exit docs generated');
              }}
            >
              Offboard
            </Button>
          </>
        }
      />
      {message && (
        <InlineNotification kind="success" title={message} style={{ margin: '1rem 0' }} lowContrast />
      )}
      {error && (
        <InlineNotification kind="error" title={error} subtitle={error} style={{ margin: '1rem 0' }} lowContrast />
      )}

      <Tabs>
        <TabList aria-label="Employee tabs">
          <Tab>Profile</Tab>
          <Tab>Documents</Tab>
          <Tab>Payroll</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div style={{ paddingTop: '1.5rem' }}>
              <dl className="hr-dl">
                <dt>Status</dt>
                <dd>
                  <Tag type="blue" className="hr-status">
                    {employee.status}
                  </Tag>
                </dd>
                <dt>Email</dt>
                <dd>{employee.email}</dd>
                <dt>Phone</dt>
                <dd>{employee.phone ?? '—'}</dd>
                <dt>Department</dt>
                <dd>{employee.department}</dd>
                <dt>Job title</dt>
                <dd>{employee.jobTitle}</dd>
                <dt>Join date</dt>
                <dd>{new Date(employee.joinDate).toLocaleDateString()}</dd>
                {employee.lastWorkingDay && (
                  <>
                    <dt>Last working day</dt>
                    <dd>{new Date(employee.lastWorkingDay).toLocaleDateString()}</dd>
                  </>
                )}
                <dt>Salary</dt>
                <dd>
                  {formatMoney(employee.salary, employee.currency)} / year
                </dd>
              </dl>
            </div>
          </TabPanel>
          <TabPanel>
            <DataTable rows={docRows} headers={docHeaders}>
              {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                <Table {...getTableProps()}>
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
                        {row.cells.map((cell) => {
                          if (cell.info.header === 'actions') {
                            const doc = (employee.documents ?? []).find((d) => d.id === cell.value);
                            return (
                              <TableCell key={cell.id}>
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  onClick={() =>
                                    doc && downloadBlob(`/documents/${doc.id}/download`, doc.fileName)
                                  }
                                >
                                  Download
                                </Button>
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  onClick={() => doc && setSendModal(doc)}
                                >
                                  Email
                                </Button>
                              </TableCell>
                            );
                          }
                          return <TableCell key={cell.id}>{cell.value}</TableCell>;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          </TabPanel>
          <TabPanel>
            {(employee.payslips ?? []).length === 0 ? (
              <p>No payslips yet.</p>
            ) : (
              <ul>
                {(employee.payslips ?? []).map((p) => (
                  <li key={p.id}>
                    {new Date(p.periodStart).toLocaleDateString()} —{' '}
                    {new Date(p.periodEnd).toLocaleDateString()}: net{' '}
                    {formatMoney(p.netPay)}
                  </li>
                ))}
              </ul>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Modal
        open={!!sendModal}
        modalHeading="Send document by email"
        primaryButtonText="Send"
        secondaryButtonText="Cancel"
        onRequestClose={() => setSendModal(null)}
        onRequestSubmit={sendDocument}
      >
        <TextInput
          id="sendEmail"
          labelText="Recipient email"
          value={sendEmail}
          onChange={(e) => setSendEmail(e.target.value)}
        />
      </Modal>
    </div>
  );
}
