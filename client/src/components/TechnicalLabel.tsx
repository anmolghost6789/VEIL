import React from 'react';

interface TechnicalLabelProps {
  label: string;
  value?: string | number | React.ReactNode;
  color?: 'default' | 'acid' | 'cyber' | 'magenta' | 'warning' | 'danger';
  size?: 'xs' | 'sm' | 'md';
}

export const TechnicalLabel: React.FC<TechnicalLabelProps> = ({
  label,
  value,
  color = 'default',
  size = 'xs'
}) => {
  const getColorStyles = () => {
    switch (color) {
      case 'acid':
        return 'border-acid/60 text-acid bg-acid/10';
      case 'cyber':
        return 'border-cyber/60 text-cyber bg-cyber/10';
      case 'magenta':
        return 'border-magenta/60 text-magenta bg-magenta/10';
      case 'warning':
        return 'border-warning/60 text-warning bg-warning/10';
      case 'danger':
        return 'border-danger/60 text-danger bg-danger/10';
      case 'default':
      default:
        return 'border-offwhite/30 text-offwhite/80 bg-ink-800';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return 'text-[10px] px-1.5 py-0.5';
      case 'md':
        return 'text-xs px-2.5 py-1';
      case 'sm':
      default:
        return 'text-[11px] px-2 py-0.5';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-widest border ${getColorStyles()} ${getSizeStyles()} select-none`}
    >
      <span className="opacity-60">{label}</span>
      {value !== undefined && <span className="font-bold">{value}</span>}
    </div>
  );
};
