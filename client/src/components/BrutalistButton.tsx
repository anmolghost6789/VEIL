import React, { useState } from 'react';
import { playMechanicalClick } from '../services/audio';

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'cyber' | 'dark' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  techLabel?: string;
  children: React.ReactNode;
}

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  variant = 'primary',
  size = 'md',
  techLabel,
  children,
  onClick,
  className = '',
  disabled,
  ...props
}) => {
  const [hovered, setHovered] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-acid text-ink font-bold border-2 border-offwhite shadow-brutal-white hover:bg-offwhite hover:text-ink hover:border-acid hover:shadow-brutal-acid';
      case 'secondary':
        return 'bg-offwhite text-ink font-bold border-2 border-ink shadow-brutal hover:bg-acid hover:text-ink';
      case 'cyber':
        return 'bg-cyber text-ink font-bold border-2 border-offwhite shadow-brutal-white hover:bg-offwhite hover:shadow-brutal-cyber';
      case 'danger':
        return 'bg-danger text-offwhite font-bold border-2 border-offwhite shadow-brutal-white hover:bg-warning hover:text-ink hover:border-warning';
      case 'dark':
        return 'bg-ink-800 text-offwhite font-medium border-2 border-ink-600 shadow-brutal hover:border-acid hover:text-acid';
      case 'outline':
        return 'bg-transparent text-offwhite font-mono border-2 border-offwhite/40 hover:border-offwhite hover:bg-offwhite/10';
      default:
        return 'bg-acid text-ink';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1 text-xs tracking-wider';
      case 'lg':
        return 'px-6 py-3.5 text-base tracking-widest uppercase';
      case 'md':
      default:
        return 'px-4 py-2 text-sm tracking-wider uppercase';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playMechanicalClick();
    if (onClick) onClick(e);
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative inline-flex items-center justify-center font-mono select-none
        transition-all duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${className}
      `}
    >
      <span className="flex items-center gap-1.5 z-10">{children}</span>
      {techLabel && hovered && (
        <span className="absolute -top-6 right-0 bg-ink-900 border border-acid text-[10px] text-acid px-1 font-mono tracking-tighter uppercase pointer-events-none">
          {techLabel}
        </span>
      )}
    </button>
  );
};
