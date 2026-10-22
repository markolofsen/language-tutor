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
      className={`tab ${mode.label === active ? "tab-active font-medium" : ""}`}
    >
      {mode.label}
    </Link>
  ));
  return (
    <div role="tablist" className="tabs tabs-box w-full">
      {tabs}
    </div>
  );
}
