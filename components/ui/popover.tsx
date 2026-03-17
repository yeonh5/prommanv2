'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
} | null>(null);

export function Popover({ open, onOpenChange, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const isControlled = typeof open === 'boolean';
  const actualOpen = isControlled ? open! : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  return (
    <PopoverContext.Provider value={{ open: actualOpen, setOpen, triggerRef }}>
      <div className="relative inline-block">
        {children}
      </div>
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

    const triggerRef = React.useContext(PopoverContext)?.triggerRef;
    return (
      <div ref={(el) => { (triggerRef as React.MutableRefObject<HTMLElement | null>).current = el; if (typeof ref === 'function') ref(el); else if (ref) ref.current = el; }} {...props}>
        {child}
      </div>
    );
  },
);

PopoverTrigger.displayName = 'PopoverTrigger';

export interface PopoverContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** 'bottom' = 아래, 'right' = 오른쪽, 'top' = 위 */
  side?: 'bottom' | 'right' | 'top';
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, children, style, side = 'bottom', ...props }, ref) => {
    const ctx = React.useContext(PopoverContext);
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = React.useState<{ top?: number; bottom?: number; left: number } | null>(null);

    React.useLayoutEffect(() => {
      if (!ctx?.open || !ctx.triggerRef?.current) {
        setPosition(null);
        return;
      }
      const el = ctx.triggerRef.current;
      const rect = el.getBoundingClientRect();
      if (side === 'right') {
        setPosition({ top: rect.top, left: rect.right + 8 });
      } else if (side === 'top') {
        setPosition({ bottom: window.innerHeight - rect.top + 8, left: rect.left });
      } else {
        setPosition({ top: rect.bottom + 8, left: rect.left });
      }
    }, [ctx?.open, ctx?.triggerRef, side]);

    React.useEffect(() => {
      if (!ctx?.open) return;
      const handleClick = (e: MouseEvent) => {
        const target = e.target as Node;
        if (contentRef.current?.contains(target)) return;
        if (ctx.triggerRef.current?.contains(target as Node)) return;
        ctx.setOpen(false);
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [ctx]);

    if (!ctx || !ctx.open) return null;
    if (!position) return null;

    const content = (
      <div
        ref={node => {
          contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={
          'fixed z-[9999] mt-0 rounded-md border border-border bg-popover text-popover-foreground shadow-lg ' +
          (className || '')
        }
        style={{ ...position, ...style }}
        {...props}
      >
        {children}
      </div>
    );

    if (typeof document !== 'undefined') {
      return createPortal(content, document.body);
    }
    return content;
  },
);

PopoverContent.displayName = 'PopoverContent';
