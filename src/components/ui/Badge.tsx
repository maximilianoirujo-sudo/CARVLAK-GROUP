import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  // Base classes: sentence case (no uppercase), subtle border, calm indicator
  const baseClasses =
    'inline-flex items-center font-medium rounded-md border select-none transition-colors';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1 leading-tight',
    md: 'px-2.5 py-1 text-xs gap-1.5 leading-tight'
  }[size];

  const variantClasses = {
    default: 'bg-[#EBEBEA] border-[#E5E5E3] text-[#161616]',
    secondary: 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B]',
    primary: 'bg-[#D7141A]/10 border-[#D7141A]/20 text-[#D7141A]',
    danger: 'bg-[#FDF2F2] border-[#F9D2D2] text-[#B80E14]',
    warning: 'bg-[#FEF7EC] border-[#FDE5C3] text-[#945B0E]',
    success: 'bg-[#EEF7F2] border-[#D4EBDC] text-[#1E6B43]',
    info: 'bg-[#EEF2F6] border-[#D3DFEE] text-[#002B7A]',
    outline: 'bg-transparent border-[#E5E5E3] text-[#161616]'
  }[variant];

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
