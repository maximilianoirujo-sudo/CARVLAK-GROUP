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
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A8A8A]">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-black border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#D7141A] focus:ring-1 focus:ring-[#D7141A] transition-all disabled:opacity-50 disabled:bg-[#141414] ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            error ? 'border-[#D7141A] ring-1 ring-[#D7141A]' : ''
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#8A8A8A]">
            {rightIcon}
          </div>
        )}
        {error && <p className="text-[11px] text-[#D7141A] mt-1 font-medium">{error}</p>}
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
          className={`w-full bg-black border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D7141A] focus:ring-1 focus:ring-[#D7141A] transition-all disabled:opacity-50 disabled:bg-[#141414] appearance-none cursor-pointer ${
            error ? 'border-[#D7141A] ring-1 ring-[#D7141A]' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[#8A8A8A]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && <p className="text-[11px] text-[#D7141A] mt-1 font-medium">{error}</p>}
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
          className={`w-full bg-black border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#D7141A] focus:ring-1 focus:ring-[#D7141A] transition-all disabled:opacity-50 disabled:bg-[#141414] resize-y min-h-[80px] ${
            error ? 'border-[#D7141A] ring-1 ring-[#D7141A]' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] text-[#D7141A] mt-1 font-medium">{error}</p>}
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
    className={`block text-[11px] sm:text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1.5 ${className}`}
    {...props}
  >
    {children}
  </label>
);
