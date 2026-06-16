import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="hr-page-header">
      <div>
        <p className="hr-eyebrow">{eyebrow}</p>
        <h1 className="hr-title">{title}</h1>
        {subtitle && <p className="hr-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="hr-page-header__actions">{actions}</div>}
    </header>
  );
}
