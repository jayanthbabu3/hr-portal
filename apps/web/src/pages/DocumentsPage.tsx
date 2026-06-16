import { useEffect, useState } from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  Modal,
  TextInput,
  Tag,
  DataTableSkeleton,
  InlineNotification,
} from '@carbon/react';
import { Download, Email } from '@carbon/icons-react';
import { api, ApiError, downloadBlob } from '../lib/api';
import type { Document } from '../lib/types';
import { PageHeader } from '../components/PageHeader';

const headers = [
  { key: 'employee', header: 'Employee' },
  { key: 'type', header: 'Type' },
  { key: 'version', header: 'Ver' },
  { key: 'generatedAt', header: 'Generated' },
  { key: 'sent', header: 'Sent' },
  { key: 'actions', header: 'Actions' },
];

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendModal, setSendModal] = useState<Document | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api<Document[]>('/documents')
      .then(setDocuments)
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const sendDocument = async () => {
    if (!sendModal) return;
    try {
      await api(`/documents/${sendModal.id}/send`, {
        method: 'POST',
        body: JSON.stringify({ toEmail: sendEmail }),
      });
      setSendModal(null);
      setMessage('Email sent successfully');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Send failed');
    }
  };

  const rows = documents.map((d) => ({
    id: d.id,
    employee: d.employee
      ? `${d.employee.firstName} ${d.employee.lastName}`
      : '—',
    type: d.type.replace(/_/g, ' '),
    version: String(d.version),
    generatedAt: new Date(d.generatedAt).toLocaleString(),
    sent: d.sentAt ? `Yes` : 'Pending',
    actions: d.id,
    _doc: d,
  }));

  return (
    <div className="hr-page">
      <PageHeader
        eyebrow="People"
        title="Documents"
        subtitle="Every generated offer, payslip and certificate, with an audit of what has been sent."
      />
      {message && (
        <InlineNotification kind="success" title={message} style={{ marginBottom: '1rem' }} lowContrast />
      )}
      {error && (
        <InlineNotification kind="error" title={error} style={{ marginBottom: '1rem' }} lowContrast />
      )}
      {loading ? (
        <DataTableSkeleton columnCount={6} rowCount={6} showHeader={false} />
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
                      {row.cells.map((cell) => {
                        if (cell.info.header === 'type') {
                          return (
                            <TableCell key={cell.id} style={{ textTransform: 'capitalize' }}>
                              {cell.value}
                            </TableCell>
                          );
                        }
                        if (cell.info.header === 'sent') {
                          const sent = cell.value === 'Yes';
                          return (
                            <TableCell key={cell.id}>
                              <Tag type={sent ? 'green' : 'gray'}>
                                {sent ? 'Sent' : 'Pending'}
                              </Tag>
                            </TableCell>
                          );
                        }
                        if (cell.info.header === 'actions') {
                          const doc = documents.find((d) => d.id === cell.value);
                          return (
                            <TableCell key={cell.id}>
                              <Button
                                kind="ghost"
                                size="sm"
                                hasIconOnly
                                iconDescription="Download"
                                renderIcon={Download}
                                onClick={() =>
                                  doc && downloadBlob(`/documents/${doc.id}/download`, doc.fileName)
                                }
                              />
                              <Button
                                kind="ghost"
                                size="sm"
                                hasIconOnly
                                iconDescription="Email"
                                renderIcon={Email}
                                onClick={() => {
                                  if (doc) {
                                    setSendModal(doc);
                                    setSendEmail(doc.employee?.email ?? '');
                                  }
                                }}
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
            )}
          </DataTable>
        </div>
      )}
      <Modal
        open={!!sendModal}
        modalHeading="Send document"
        primaryButtonText="Send"
        secondaryButtonText="Cancel"
        onRequestClose={() => setSendModal(null)}
        onRequestSubmit={sendDocument}
      >
        <TextInput
          id="toEmail"
          labelText="To"
          value={sendEmail}
          onChange={(e) => setSendEmail(e.target.value)}
        />
      </Modal>
    </div>
  );
}
