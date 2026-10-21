import type { HTMLAttributes } from "react";

export function Empty(props: HTMLAttributes<HTMLDivElement>) {
  return <div className="flex flex-col items-center gap-2 py-16 text-center" {...props} />;
}

export function EmptyHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <div className="flex flex-col gap-1" {...props} />;
}

export function EmptyTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className="text-lg font-semibold" {...props} />;
}

export function EmptyDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p className="text-sm text-base-content/60" {...props} />;
}
