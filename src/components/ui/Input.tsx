import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B6B6B]">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full h-10 bg-white border rounded-md px-3 text-sm text-[#161616] placeholder-[#9A9A9A] transition-colors disabled:opacity-50 disabled:bg-[#F5F5F4] disabled:text-[#9A9A9A] disabled:cursor-not-allowed ${
            leftIcon ? 'pl-9' : ''
          } ${rightIcon ? 'pr-9' : ''} ${
            error
              ? 'border-[#D7141A] focus:border-[#D7141A] focus:outline-none focus:ring-1 focus:ring-[#D7141A]/20'
              : 'border-[#E5E5E3] focus:border-[#161616] focus:outline-none focus:ring-1 focus:ring-[#161616]/10'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#6B6B6B]">
            {rightIcon}
          </div>
        )}
        {error && <p className="text-xs text-[#D7141A] mt-1 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={`w-full h-10 bg-white border rounded-md px-3 pr-9 text-sm text-[#161616] transition-colors disabled:opacity-50 disabled:bg-[#F5F5F4] disabled:text-[#9A9A9A] disabled:cursor-not-allowed appearance-none cursor-pointer ${
            error
              ? 'border-[#D7141A] focus:border-[#D7141A] focus:outline-none focus:ring-1 focus:ring-[#D7141A]/20'
              : 'border-[#E5E5E3] focus:border-[#161616] focus:outline-none focus:ring-1 focus:ring-[#161616]/10'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6B6B6B]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && <p className="text-xs text-[#D7141A] mt-1 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          className={`w-full bg-white border rounded-md p-3 text-sm text-[#161616] placeholder-[#9A9A9A] transition-colors disabled:opacity-50 disabled:bg-[#F5F5F4] disabled:text-[#9A9A9A] disabled:cursor-not-allowed resize-y min-h-[80px] ${
            error
              ? 'border-[#D7141A] focus:border-[#D7141A] focus:outline-none focus:ring-1 focus:ring-[#D7141A]/20'
              : 'border-[#E5E5E3] focus:border-[#161616] focus:outline-none focus:ring-1 focus:ring-[#161616]/10'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[#D7141A] mt-1 font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export const FormLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <label
    className={`block text-xs sm:text-sm font-semibold text-[#161616] mb-1.5 ${className}`}
    {...props}
  >
    {children}
  </label>
);
