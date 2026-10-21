/** Every internal destination is built here; nothing else writes a path. */
export const routes = {
  today: "/",
  practice: "/practice",
  exercise: (id: number) => `/practice/${id}`,
  review: "/review",
  listen: "/listen",
  words: "/words",
  profile: "/profile",
  login: "/login",
} as const;

export type NavKey = "today" | "practice" | "review" | "listen" | "words" | "profile";

export const NAV: readonly { key: NavKey; label: string; href: string }[] = [
  { key: "today", label: "Today", href: routes.today },
  { key: "practice", label: "Translate", href: routes.practice },
  { key: "review", label: "Review", href: routes.review },
  { key: "listen", label: "Listen", href: routes.listen },
  { key: "words", label: "Words", href: routes.words },
  { key: "profile", label: "Profile", href: routes.profile },
];
