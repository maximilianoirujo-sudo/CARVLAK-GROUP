import React from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'whatsapp' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseClasses =
      'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    // Sizes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2.5 text-xs sm:text-sm gap-2',
      lg: 'px-6 py-3.5 text-sm sm:text-base gap-2.5'
    }[size];

    // Variants according to CARVLAK design spec:
    // - Principal: fondo rojo (#D7141A) con texto blanco
    // - Secundario: fondo transparente con borde blanco (#FFFFFF) y texto blanco
    // - WhatsApp: fondo transparente con borde blanco (#FFFFFF), texto blanco e ícono blanco
    const variantClasses = {
      primary:
        'bg-[#D7141A] hover:bg-[#B51015] active:bg-[#8C0B0F] text-white shadow-lg shadow-red-950/30 border border-transparent',
      secondary:
        'bg-transparent hover:bg-white/10 active:bg-white/20 text-white border border-white',
      whatsapp:
        'bg-transparent hover:bg-white/10 active:bg-white/20 text-white border border-white',
      ghost:
        'bg-transparent hover:bg-white/5 active:bg-white/10 text-[#8A8A8A] hover:text-white border border-transparent',
      outline:
        'bg-transparent hover:bg-white/5 active:bg-white/10 text-white border border-[#2A2A2A] hover:border-white',
      danger:
        'bg-[#D7141A] hover:bg-[#B51015] active:bg-[#8C0B0F] text-white border border-transparent'
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <>
            {variant === 'whatsapp' && !leftIcon && (
              <MessageCircle className="w-4 h-4 text-white shrink-0" />
            )}
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
