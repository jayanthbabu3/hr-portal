import type { ComponentType } from 'react';
import type { CarbonIconProps } from '@carbon/icons-react';

type Accent = 'blue' | 'green' | 'red' | 'gray';

const ACCENTS: Record<Accent, { accent: string; tint: string }> = {
  blue: { accent: '#828fff', tint: 'rgba(94, 106, 210, 0.16)' },
  green: { accent: '#3fb950', tint: 'rgba(39, 166, 68, 0.16)' },
  red: { accent: '#f0796b', tint: 'rgba(235, 87, 87, 0.16)' },
  gray: { accent: '#8a8f98', tint: 'rgba(138, 143, 152, 0.14)' },
};

type MetricTileProps = {
  label: string;
  value: number | string;
  icon: ComponentType<CarbonIconProps>;
  accent?: Accent;
  delta?: string;
  index?: number;
};

export function MetricTile({
  label,
  value,
  icon: Icon,
  accent = 'blue',
  delta,
  index = 0,
}: MetricTileProps) {
  const { accent: accentColor, tint } = ACCENTS[accent];
  return (
    <div
      className="hr-metric"
      style={
        {
          '--hr-metric-accent': accentColor,
          '--hr-metric-tint': tint,
          animationDelay: `${index * 70}ms`,
        } as React.CSSProperties
      }
    >
      <div className="hr-metric__top">
        <div className="hr-metric__icon">
          <Icon size={20} />
        </div>
      </div>
      <p className="hr-metric__label">{label}</p>
      <p className="hr-metric__value">{value}</p>
      {delta && <span className="hr-metric__delta">{delta}</span>}
    </div>
  );
}
