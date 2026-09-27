import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center font-bold uppercase tracking-wider rounded-lg border transition-colors select-none';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-[11px] gap-1.5'
  }[size];

  const variantClasses = {
    default: 'bg-[#141414] border-[#2A2A2A] text-white',
    primary: 'bg-[#D7141A]/15 border-[#D7141A] text-[#D7141A]',
    secondary: 'bg-black border-[#2A2A2A] text-[#8A8A8A]',
    outline: 'bg-transparent border-white/40 text-white',
    danger: 'bg-[#D7141A]/15 border-[#D7141A] text-[#D7141A]'
  }[variant];

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </span>
  );
};
