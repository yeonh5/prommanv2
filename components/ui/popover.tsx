import * as React from 'react';

export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function Popover({ open, onOpenChange, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof open === 'boolean';
  const actualOpen = isControlled ? open! : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  return (
    <PopoverContext.Provider value={{ open: actualOpen, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

export interface PopoverTriggerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<HTMLDivElement, PopoverTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    const ctx = React.useContext(PopoverContext);
    if (!ctx) return <>{children}</>;

    const child = React.isValidElement(children) && asChild ? (
      React.cloneElement(
        children as React.ReactElement<{ onClick?: () => void }>,
        {
          onClick: () => ctx.setOpen(!ctx.open),
        },
      )
    ) : (
      <button
        type="button"
        onClick={() => ctx.setOpen(!ctx.open)}
        className="inline-flex"
      >
        {children}
      </button>
    );

    return (
      <div ref={ref} {...props}>
        {child}
      </div>
    );
  },
);

PopoverTrigger.displayName = 'PopoverTrigger';

export interface PopoverContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, children, ...props }, ref) => {
    const ctx = React.useContext(PopoverContext);
    if (!ctx || !ctx.open) return null;

    return (
      <div
        ref={ref}
        className={
          'absolute z-50 mt-2 rounded-md border border-gray-700 bg-black/90 shadow-lg ' +
          (className || '')
        }
        {...props}
      >
        {children}
      </div>
    );
  },
);

PopoverContent.displayName = 'PopoverContent';

