/** Every internal destination is built here; nothing else writes a path. */
export const routes = {
  today: "/",
  translate: "/translate",
  practice: "/practice",
  exercise: (id: number) => `/practice/${id}`,
  review: "/review",
  listen: "/listen",
  words: "/words",
  profile: "/profile",
  login: "/login",
} as const;

export type NavKey = "today" | "translate" | "practice" | "words" | "profile";

/** Five tabs by intent. Review opens from Today; dictation is a mode of Practice. `also` are the other paths a tab owns. */
export const NAV: readonly { key: NavKey; label: string; href: string; also: readonly string[] }[] = [
  { key: "today", label: "Today", href: routes.today, also: [routes.review] },
  { key: "translate", label: "Translate", href: routes.translate, also: [] },
  { key: "practice", label: "Practice", href: routes.practice, also: [routes.listen] },
  { key: "words", label: "Words", href: routes.words, also: [] },
  { key: "profile", label: "Profile", href: routes.profile, also: [] },
];

/** The two modes of the Practice tab. */
export const PRACTICE_MODES = [
  { label: "Paragraphs", href: routes.practice },
  { label: "Dictation", href: routes.listen },
] as const;
