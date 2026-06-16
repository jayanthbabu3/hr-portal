import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tag,
  SkeletonText,
} from '@carbon/react';
import {
  UserMultiple,
  UserFollow,
  UserActivity,
  Send,
  Add,
  Money,
  Document as DocumentIcon,
  ArrowRight,
} from '@carbon/icons-react';
import { api } from '../lib/api';
import type { DashboardData } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { MetricTile } from '../components/MetricTile';

const docHeaders = [
  { key: 'employee', header: 'Employee' },
  { key: 'type', header: 'Document' },
  { key: 'generatedAt', header: 'Generated' },
  { key: 'sent', header: 'Status' },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<DashboardData>('/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const docRows = (data?.recentDocuments ?? []).map((d) => ({
    id: d.id,
    employee: d.employee
      ? `${d.employee.firstName} ${d.employee.lastName}`
      : '—',
    type: d.type.replace(/_/g, ' '),
    generatedAt: new Date(d.generatedAt).toLocaleDateString(),
    sent: d.sentAt ? 'Sent' : 'Pending',
  }));

  return (
    <div className="hr-page">
      <PageHeader
        eyebrow="Overview"
        title="Good to see you"
        subtitle="A snapshot of your workforce, document activity and what needs attention today."
      />

      <section className="hr-metrics">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <div className="hr-metric" key={i}>
              <SkeletonText heading width="60%" />
              <SkeletonText width="40%" />
            </div>
          ))
        ) : (
          <>
            <MetricTile
              index={0}
              label="Total employees"
              value={data?.stats.totalEmployees ?? 0}
              icon={UserMultiple}
              accent="blue"
              delta="Across all departments"
            />
            <MetricTile
              index={1}
              label="Onboarding"
              value={data?.stats.onboarding ?? 0}
              icon={UserFollow}
              accent="green"
              delta="New hires in progress"
            />
            <MetricTile
              index={2}
              label="Offboarding"
              value={data?.stats.offboarding ?? 0}
              icon={UserActivity}
              accent="red"
              delta="Exit in progress"
            />
            <MetricTile
              index={3}
              label="Pending sends"
              value={data?.stats.pendingSends ?? 0}
              icon={Send}
              accent="gray"
              delta="Documents not yet emailed"
            />
          </>
        )}
      </section>

      <div className="hr-quick">
        <button className="hr-quick__item" onClick={() => navigate('/employees/new')}>
          <span className="hr-quick__ico">
            <Add size={20} />
          </span>
          <span className="hr-quick__txt">
            <strong>Add employee</strong>
            <span>Onboard a new hire and auto-generate documents</span>
          </span>
          <ArrowRight className="hr-quick__arrow" size={20} />
        </button>
        <button className="hr-quick__item" onClick={() => navigate('/payroll')}>
          <span className="hr-quick__ico">
            <Money size={20} />
          </span>
          <span className="hr-quick__txt">
            <strong>Run payroll</strong>
            <span>Generate payslips for the current period</span>
          </span>
          <ArrowRight className="hr-quick__arrow" size={20} />
        </button>
        <button className="hr-quick__item" onClick={() => navigate('/documents')}>
          <span className="hr-quick__ico">
            <DocumentIcon size={20} />
          </span>
          <span className="hr-quick__txt">
            <strong>Review documents</strong>
            <span>Download or email generated paperwork</span>
          </span>
          <ArrowRight className="hr-quick__arrow" size={20} />
        </button>
      </div>

      <div className="hr-split">
        <div className="hr-card">
          <div className="hr-card__head">
            <h2 className="hr-card__title">Recent documents</h2>
            <Tag type="outline">{docRows.length}</Tag>
          </div>
          {loading ? (
            <div className="hr-card__body" style={{ padding: '1.5rem' }}>
              <SkeletonText paragraph lineCount={4} />
            </div>
          ) : docRows.length === 0 ? (
            <div className="hr-empty">No documents generated yet.</div>
          ) : (
            <DataTable rows={docRows} headers={docHeaders} size="lg">
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
                          if (cell.info.header === 'sent') {
                            const sent = cell.value === 'Sent';
                            return (
                              <TableCell key={cell.id}>
                                <Tag type={sent ? 'green' : 'gray'}>
                                  {String(cell.value)}
                                </Tag>
                              </TableCell>
                            );
                          }
                          if (cell.info.header === 'type') {
                            return (
                              <TableCell
                                key={cell.id}
                                style={{ textTransform: 'capitalize' }}
                              >
                                {cell.value}
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
          )}
        </div>

        <div className="hr-card">
          <div className="hr-card__head">
            <h2 className="hr-card__title">Activity</h2>
          </div>
          {loading ? (
            <div className="hr-card__body" style={{ padding: '1.5rem' }}>
              <SkeletonText paragraph lineCount={4} />
            </div>
          ) : (data?.recentAudit ?? []).length === 0 ? (
            <div className="hr-empty">No activity recorded yet.</div>
          ) : (
            <ul className="hr-feed">
              {data!.recentAudit.map((a, i) => (
                <li className="hr-feed__item" key={i}>
                  <span className="hr-feed__dot" />
                  <div className="hr-feed__body">
                    <strong style={{ textTransform: 'capitalize' }}>
                      {a.action.replace(/_/g, ' ')}
                    </strong>
                    {a.details && <span>{a.details}</span>}
                    <div className="hr-feed__time">
                      {a.user?.name ? `${a.user.name} · ` : ''}
                      {timeAgo(a.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
