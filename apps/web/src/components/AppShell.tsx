import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavLink,
  Content,
  Theme,
} from '@carbon/react';
import {
  Logout,
  Asleep,
  Light,
  Dashboard,
  UserMultiple,
  Document,
  Money,
  DocumentMultiple_01 as Templates,
  Settings,
} from '@carbon/icons-react';
import { useAuth } from '../context/AuthContext';

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: Dashboard }],
  },
  {
    label: 'People',
    items: [
      { to: '/employees', label: 'Employees', icon: UserMultiple },
      { to: '/documents', label: 'Documents', icon: Document },
      { to: '/payroll', label: 'Payroll', icon: Money },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/templates', label: 'Templates', icon: Templates },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function initials(name?: string) {
  if (!name) return 'HR';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'white' | 'g100'>('g100');

  const toggleTheme = () => setTheme((t) => (t === 'white' ? 'g100' : 'white'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <Theme theme={theme}>
      <Header aria-label="HR Portal">
        <HeaderName prefix="Neurolyx" as={Link} to="/">
          HR&nbsp;Portal
        </HeaderName>
        <HeaderGlobalBar>
          <div className="hr-header-user">
            <span className="hr-avatar">{initials(user?.name)}</span>
            <span className="hr-header-user__name">{user?.name}</span>
          </div>
          <HeaderGlobalAction
            aria-label="Toggle theme"
            onClick={toggleTheme}
            tooltipAlignment="center"
          >
            {theme === 'white' ? <Asleep size={20} /> : <Light size={20} />}
          </HeaderGlobalAction>
          <HeaderGlobalAction
            aria-label="Log out"
            onClick={handleLogout}
            tooltipAlignment="end"
          >
            <Logout size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
      <SideNav isFixedNav expanded isChildOfHeader aria-label="Side navigation">
        <SideNavItems>
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="hr-nav-section">{group.label}</div>
              {group.items.map((item) => (
                <SideNavLink
                  key={item.to}
                  as={Link}
                  to={item.to}
                  renderIcon={item.icon}
                  isActive={isActive(item.to)}
                >
                  {item.label}
                </SideNavLink>
              ))}
            </div>
          ))}
        </SideNavItems>
      </SideNav>
      <Content id="main-content">
        <Outlet />
      </Content>
    </Theme>
  );
}
