"use client";

import { BookText, ChartColumn, House, Languages, PenLine, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV, type NavKey } from "@/routes";

const ICONS: Record<NavKey, LucideIcon> = {
  today: House,
  translate: Languages,
  practice: PenLine,
  words: BookText,
  profile: ChartColumn,
};

const isActive = (pathname: string, paths: readonly string[]) =>
  paths.some((path) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`)));

export function TabBar() {
  const pathname = usePathname();
  const tabs = NAV.map((item) => {
    const Icon = ICONS[item.key];
    const active = isActive(pathname, [item.href, ...item.also]);
    const tone = active ? "text-primary" : "text-base-content/70";
    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${tone}`}
      >
        <Icon className="size-5" aria-hidden />
        {item.label}
      </Link>
    );
  });

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-base-300 bg-base-100/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-xl">{tabs}</div>
    </nav>
  );
}
