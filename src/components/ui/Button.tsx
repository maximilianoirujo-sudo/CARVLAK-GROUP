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
    // Base styles (Sentence case, clean rounded corners, smooth interaction)
    const baseClasses =
      'inline-flex items-center justify-center font-semibold tracking-normal transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    // Sizes
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
      md: 'h-10 px-4 text-xs sm:text-sm gap-2 rounded-md',
      lg: 'h-12 px-6 text-sm sm:text-base gap-2.5 rounded-lg'
    }[size];

    // Variants according to CARVLAK Light Design System:
    // - Primary: strictly one per view, red (#D7141A) with white text
    // - Secondary: white surface (#FFFFFF) with border (#E5E5E3) and dark text (#161616)
    // - WhatsApp: white surface with border (#E5E5E3), dark text and icon
    // - Ghost: transparent with muted text (#6B6B6B), darkening on hover
    // - Outline: white surface with border (#E5E5E3)
    // - Danger: red (#D7141A) for critical destructive actions
    const variantClasses = {
      primary:
        'bg-[#D7141A] hover:bg-[#B80E14] active:bg-[#9E0C11] text-white shadow-xs border border-transparent',
      secondary:
        'bg-white hover:bg-[#F5F5F4] active:bg-[#EBEBEA] text-[#161616] border border-[#E5E5E3] hover:border-[#D0D0CD] shadow-xs',
      whatsapp:
        'bg-white hover:bg-[#F5F5F4] active:bg-[#EBEBEA] text-[#161616] border border-[#E5E5E3] hover:border-[#D0D0CD] shadow-xs',
      ghost:
        'bg-transparent hover:bg-black/5 active:bg-black/10 text-[#6B6B6B] hover:text-[#161616] border border-transparent',
      outline:
        'bg-white hover:bg-[#F5F5F4] active:bg-[#EBEBEA] text-[#161616] border border-[#E5E5E3] hover:border-[#D0D0CD] shadow-xs',
      danger:
        'bg-[#D7141A] hover:bg-[#B80E14] active:bg-[#9E0C11] text-white border border-transparent shadow-xs'
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          <>
            {variant === 'whatsapp' && !leftIcon && (
              <MessageCircle className="w-4 h-4 text-[#161616] shrink-0" />
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
