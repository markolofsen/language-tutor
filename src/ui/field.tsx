import clsx from "clsx";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx("input w-full", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx("textarea w-full", className)} {...rest} />;
}
