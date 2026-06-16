import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Column,
  TextInput,
  Select,
  SelectItem,
  NumberInput,
  Button,
  InlineNotification,
  ProgressIndicator,
  ProgressStep,
} from '@carbon/react';
import { api, ApiError } from '../lib/api';
import { formatMoney } from '../lib/format';
import { PageHeader } from '../components/PageHeader';

const steps = ['Personal', 'Job & compensation', 'Review'];

export function EmployeeFormPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    joinDate: new Date().toISOString().slice(0, 10),
    salary: 1200000,
    currency: 'INR',
    status: 'onboarding',
  });

  const update = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const employee = await api<{ id: string }>('/employees', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      navigate(`/employees/${employee.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-page">
      <PageHeader
        eyebrow="People"
        title="Add employee"
        subtitle="Capture the essentials. On submit we generate the offer letter and onboarding pack automatically."
      />
      <ProgressIndicator currentIndex={step} style={{ marginBottom: '2rem' }}>
        {steps.map((label) => (
          <ProgressStep key={label} label={label} />
        ))}
      </ProgressIndicator>
      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          style={{ marginBottom: '1rem' }}
          lowContrast
        />
      )}
      {step === 0 && (
        <Grid>
          <Column lg={8}>
            <TextInput
              id="firstName"
              labelText="First name"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
            <TextInput
              id="lastName"
              labelText="Last name"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              style={{ marginTop: '1rem' }}
            />
            <TextInput
              id="email"
              labelText="Email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              style={{ marginTop: '1rem' }}
            />
            <TextInput
              id="phone"
              labelText="Phone"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              style={{ marginTop: '1rem' }}
            />
          </Column>
        </Grid>
      )}
      {step === 1 && (
        <Grid>
          <Column lg={8}>
            <TextInput
              id="department"
              labelText="Department"
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
            />
            <TextInput
              id="jobTitle"
              labelText="Job title"
              value={form.jobTitle}
              onChange={(e) => update('jobTitle', e.target.value)}
              style={{ marginTop: '1rem' }}
            />
            <TextInput
              id="joinDate"
              labelText="Join date"
              type="date"
              value={form.joinDate}
              onChange={(e) => update('joinDate', e.target.value)}
              style={{ marginTop: '1rem' }}
            />
            <NumberInput
              id="salary"
              label="Annual salary (INR)"
              value={form.salary}
              step={50000}
              onChange={(_e, { value }) => update('salary', Number(value) || 0)}
              style={{ marginTop: '1rem' }}
            />
            <Select
              id="status"
              labelText="Status"
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              style={{ marginTop: '1rem' }}
            >
              <SelectItem value="onboarding" text="Onboarding" />
              <SelectItem value="active" text="Active" />
            </Select>
          </Column>
        </Grid>
      )}
      {step === 2 && (
        <div>
          <p>
            <strong>{form.firstName} {form.lastName}</strong> — {form.jobTitle},{' '}
            {form.department}
          </p>
          <p>Email: {form.email}</p>
          <p>Join date: {form.joinDate}</p>
          <p>Salary: {formatMoney(form.salary, form.currency)} / year</p>
          <p style={{ marginTop: '1rem', color: 'var(--cds-text-secondary)' }}>
            Offer letter and onboarding pack will be generated automatically.
          </p>
        </div>
      )}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        {step > 0 && (
          <Button kind="secondary" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        {step < 2 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
        ) : (
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Creating…' : 'Create & generate documents'}
          </Button>
        )}
      </div>
    </div>
  );
}
