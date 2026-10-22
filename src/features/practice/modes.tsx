import Link from "next/link";

import { PRACTICE_MODES } from "@/routes";

/** Switch between the kinds of practice; the Practice tab owns both. */
export function PracticeModes({ active }: { active: (typeof PRACTICE_MODES)[number]["label"] }) {
  const tabs = PRACTICE_MODES.map((mode) => (
    <Link
      key={mode.label}
      href={mode.href}
      role="tab"
      aria-selected={mode.label === active}
      className={`tab h-10 flex-1 rounded-field ${mode.label === active ? "bg-primary/15 font-semibold text-primary" : "text-base-content/70"}`}
    >
      {mode.label}
    </Link>
  ));
  return (
    <div role="tablist" className="tabs tabs-box gap-1 p-1">
      {tabs}
    </div>
  );
}
