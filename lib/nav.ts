// Primary site navigation. Several targets (/map, /leaderboard, /about,
// /methodology) don't exist yet — they 404 until those pages are built.
export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/map", label: "Map" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "About" },
  { href: "/methodology", label: "Methodology" },
];
