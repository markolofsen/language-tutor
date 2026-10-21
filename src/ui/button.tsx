import clsx from "clsx";
import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement } from "react";

const VARIANTS = { default: "btn-primary", outline: "btn-outline", ghost: "btn-ghost" } as const;
const SIZES = { default: "", sm: "btn-sm", lg: "btn-lg", icon: "btn-square" } as const;

export type ButtonStyle = { variant?: keyof typeof VARIANTS; size?: keyof typeof SIZES };

/** The daisyUI classes of a button: for a link that must look like one. */
export function buttonClass({ variant = "default", size = "default" }: ButtonStyle = {}): string {
  return clsx("btn", VARIANTS[variant], SIZES[size]);
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyle & {
    loading?: boolean;
    /** Style the single child (a link) as a button instead of rendering a <button>. */
    asChild?: boolean;
  };

export function Button({ variant, size, loading, asChild, className, children, disabled, ...rest }: Props) {
  const classes = clsx(buttonClass({ ...(variant ? { variant } : {}), ...(size ? { size } : {}) }), className);
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, { className: clsx(classes, child.props.className) });
  }
  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <span className="loading loading-spinner loading-sm" aria-hidden /> : null}
      {children}
    </button>
  );
}
