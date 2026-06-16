import { useEffect, useState } from 'react';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  TextInput,
  TextArea,
  NumberInput,
  Button,
  InlineNotification,
  Loading,
} from '@carbon/react';
import { api, ApiError } from '../lib/api';
import { PageHeader } from '../components/PageHeader';

type CompanySettings = {
  name: string;
  address: string;
  logoUrl?: string;
  signatoryName: string;
  signatoryTitle: string;
};

type EmailSettings = {
  smtpHost: string;
  smtpPort: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail: string;
  fromName: string;
};

export function SettingsPage() {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [email, setEmail] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<CompanySettings>('/settings/company'),
      api<EmailSettings>('/settings/email'),
    ])
      .then(([c, e]) => {
        setCompany(c);
        setEmail(e);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveCompany = async () => {
    if (!company) return;
    try {
      await api('/settings/company', { method: 'PATCH', body: JSON.stringify(company) });
      setMessage('Company settings saved');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  const saveEmail = async () => {
    if (!email) return;
    try {
      await api('/settings/email', { method: 'PATCH', body: JSON.stringify(email) });
      setMessage('Email settings saved');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  const testSmtp = async () => {
    try {
      const res = await api<{ success: boolean; message: string }>('/settings/email/test', {
        method: 'POST',
      });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'SMTP test failed');
    }
  };

  if (loading) return <Loading description="Loading settings" withOverlay />;
  if (!company || !email) return null;

  return (
    <div className="hr-page">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="Company letterhead used on documents and the SMTP connection used to deliver them."
      />
      {message && (
        <InlineNotification kind="success" title={message} style={{ marginBottom: '1rem' }} lowContrast />
      )}
      {error && (
        <InlineNotification kind="error" title={error} style={{ marginBottom: '1rem' }} lowContrast />
      )}
      <Tabs>
        <TabList aria-label="Settings tabs">
          <Tab>Company</Tab>
          <Tab>Email (SMTP)</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <TextInput
              id="companyName"
              labelText="Company name"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />
            <TextArea
              id="address"
              labelText="Address"
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />
            <TextInput
              id="logoUrl"
              labelText="Logo URL"
              value={company.logoUrl ?? ''}
              onChange={(e) => setCompany({ ...company, logoUrl: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />
            <TextInput
              id="signatoryName"
              labelText="Signatory name"
              value={company.signatoryName}
              onChange={(e) => setCompany({ ...company, signatoryName: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />
            <TextInput
              id="signatoryTitle"
              labelText="Signatory title"
              value={company.signatoryTitle}
              onChange={(e) => setCompany({ ...company, signatoryTitle: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />
            <Button onClick={saveCompany}>Save company</Button>
          </TabPanel>
          <TabPanel>
            <p style={{ marginBottom: '1rem', color: 'var(--cds-text-secondary)' }}>
              Dev default: Mailhog at localhost:1025 (UI: http://localhost:8025)
            </p>
            <TextInput
              id="smtpHost"
              labelText="SMTP host"
              value={email.smtpHost}
              onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />
            <NumberInput
              id="smtpPort"
              label="SMTP port"
              value={email.smtpPort}
              onChange={(_e, { value }) => setEmail({ ...email, smtpPort: Number(value) })}
              style={{ marginBottom: '1rem' }}
            />
            <TextInput
              id="fromEmail"
              labelText="From email"
              value={email.fromEmail}
              onChange={(e) => setEmail({ ...email, fromEmail: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />
            <TextInput
              id="fromName"
              labelText="From name"
              value={email.fromName}
              onChange={(e) => setEmail({ ...email, fromName: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button onClick={saveEmail}>Save email settings</Button>
              <Button kind="secondary" onClick={testSmtp}>
                Test SMTP
              </Button>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
