import type { ReactNode } from "react";

import { TabBar } from "@/features/shell/tab-bar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">{children}</main>
      <TabBar />
    </>
  );
}
