import type { ContentLink } from "@/hooks/useContent";

/** One platform = all links sharing a title within a category (case/space-insensitive). */
export const linkGroupKey = (link: Pick<ContentLink, "title" | "category_id">) =>
  `${link.category_id}|${link.title.trim().toLowerCase().replace(/\s+/g, " ")}`;

export function groupLinks<T extends ContentLink>(links: T[]): T[][] {
  const groups = new Map<string, T[]>();
  links.forEach((link) => {
    const key = linkGroupKey(link);
    groups.set(key, [...(groups.get(key) ?? []), link]);
  });
  return [...groups.values()].map((g) => [...g].sort((a, b) => a.sort_order - b.sort_order));
}
