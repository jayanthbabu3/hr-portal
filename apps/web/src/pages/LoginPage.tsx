import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Theme,
  TextInput,
  PasswordInput,
  Button,
  InlineNotification,
} from '@carbon/react';
import { ArrowRight, CheckmarkOutline } from '@carbon/icons-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

const FEATURES = [
  'Automated offer letters & onboarding packs',
  'Payslip generation and exit documents',
  'One-click download and email delivery',
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@hrportal.local');
  const [password, setPassword] = useState('hradmin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Theme theme="g100">
      <div className="hr-login">
        <aside className="hr-login__brand">
          <div className="hr-login__mark">
            <span className="hr-login__mark-box">N</span>
            <span>Neurolyx HR Portal</span>
          </div>

          <div className="hr-login__hero">
            <h1>People operations, engineered.</h1>
            <p>
              The single workspace for hiring, documents, payroll and
              offboarding — built on the IBM Carbon design system.
            </p>
            <ul className="hr-login__features">
              {FEATURES.map((f) => (
                <li key={f}>
                  <CheckmarkOutline size={20} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="hr-login__foot">
            © {new Date().getFullYear()} Neurolyx Technologies Pvt Ltd · Human Resources
          </div>
        </aside>

        <main className="hr-login__panel">
          <form className="hr-login__form" onSubmit={handleSubmit}>
            <h2>Sign in</h2>
            <p>Use your HR admin credentials to continue.</p>

            {error && (
              <InlineNotification
                kind="error"
                title="Sign in failed"
                subtitle={error}
                style={{ marginBottom: '1.25rem' }}
                lowContrast
                hideCloseButton
              />
            )}

            <div className="hr-stack">
              <TextInput
                id="email"
                labelText="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                size="lg"
              />
              <PasswordInput
                id="password"
                labelText="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                size="lg"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              renderIcon={ArrowRight}
              size="lg"
              style={{ marginTop: '1.5rem', width: '100%', maxWidth: 'none' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>

            <div className="hr-login__hint">
              Demo account · <code>admin@hrportal.local</code> /{' '}
              <code>hradmin123</code>
            </div>
          </form>
        </main>
      </div>
    </Theme>
  );
}
