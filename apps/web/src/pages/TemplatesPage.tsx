import { useEffect, useState } from 'react';
import {
  Select,
  SelectItem,
  TextArea,
  Button,
  InlineNotification,
  Loading,
} from '@carbon/react';
import { api, ApiError } from '../lib/api';
import type { Template } from '../lib/types';
import { PageHeader } from '../components/PageHeader';

const TEMPLATE_TYPES = [
  'offer_letter',
  'onboarding_pack',
  'payslip',
  'experience_letter',
  'relieving_letter',
];

const VARIABLES = `{{fullName}} {{firstName}} {{lastName}} {{email}} {{department}}
{{jobTitle}} {{joinDate}} {{lastWorkingDay}} {{monthlySalary}} {{companyName}}
{{companyAddress}} {{signatoryName}} {{signatoryTitle}} {{generatedDate}}
{{periodStart}} {{periodEnd}} {{earningsFormatted}} {{deductionsFormatted}} {{netPayFormatted}}`;

export function TemplatesPage() {
  const [type, setType] = useState('offer_letter');
  const [htmlBody, setHtmlBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api<Template>(`/templates/${type}`)
      .then((t) => setHtmlBody(t.htmlBody))
      .catch(() => setHtmlBody(''))
      .finally(() => setLoading(false));
  }, [type]);

  const save = async () => {
    setError('');
    setMessage('');
    try {
      await api(`/templates/${type}`, {
        method: 'PATCH',
        body: JSON.stringify({ htmlBody }),
      });
      setMessage('Template saved');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  return (
    <div className="hr-page">
      <PageHeader
        eyebrow="Configuration"
        title="Document templates"
        subtitle="Edit the Handlebars HTML used to render each generated PDF. Use the variables below to merge employee data."
      />
      <Select
        id="templateType"
        labelText="Template type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={{ maxWidth: 320, marginBottom: '1rem' }}
      >
        {TEMPLATE_TYPES.map((t) => (
          <SelectItem key={t} value={t} text={t.replace(/_/g, ' ')} />
        ))}
      </Select>
      <pre
        style={{
          background: 'var(--cds-layer-01)',
          padding: '1rem',
          fontSize: '12px',
          marginBottom: '1rem',
          overflow: 'auto',
        }}
      >
        {VARIABLES}
      </pre>
      {message && (
        <InlineNotification kind="success" title={message} style={{ marginBottom: '1rem' }} lowContrast />
      )}
      {error && (
        <InlineNotification kind="error" title={error} style={{ marginBottom: '1rem' }} lowContrast />
      )}
      {loading ? (
        <Loading description="Loading template" withOverlay />
      ) : (
        <>
          <TextArea
            id="htmlBody"
            labelText="HTML template (Handlebars)"
            rows={20}
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
          />
          <Button style={{ marginTop: '1rem' }} onClick={save}>
            Save template
          </Button>
        </>
      )}
    </div>
  );
}
