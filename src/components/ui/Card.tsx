import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white border border-[#E5E5E3] rounded-xl overflow-hidden shadow-xs transition-all duration-150 ${
          hoverable ? 'hover:border-[#D0D0CD] hover:shadow-[0_2px_4px_rgba(0,0,0,0.03)]' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div
    className={`p-4 sm:p-5 border-b border-[#E5E5E3] flex flex-col gap-1.5 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3
    className={`text-base sm:text-lg font-bold text-[#161616] tracking-tight font-display ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <p className={`text-xs sm:text-sm text-[#6B6B6B] leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`p-4 sm:p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div
    className={`p-4 sm:p-5 border-t border-[#E5E5E3] bg-[#FAFAF9] flex items-center justify-between gap-3 ${className}`}
    {...props}
  >
    {children}
  </div>
);
