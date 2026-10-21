import clsx from "clsx";
import type { HTMLAttributes } from "react";

const VARIANTS = { default: "badge-primary", secondary: "badge-soft", outline: "badge-outline" } as const;

export function Badge({
  variant = "default",
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof VARIANTS }) {
  return <span className={clsx("badge", VARIANTS[variant], className)} {...rest} />;
}
