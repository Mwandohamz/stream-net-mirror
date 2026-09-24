import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ContentSnapshot = { categories: ContentCategory[]; links: ContentLink[]; at: number };
const contentCache = new Map<string, ContentSnapshot>();
const CONTENT_CACHE_MS = 5 * 60_000;

export interface ContentCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ContentLink {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  url: string;
  logo_url: string | null;
  platform: string;
  sort_order: number;
  is_active: boolean;
}

/**
 * Categories (NetMirror, Live Sports, Downloads) and their links.
 * Everything here is managed by the admin — never hardcoded in the UI.
 */
export function useContent(includeInactive = false) {
  const cacheKey = includeInactive ? "admin" : "member";
  const initial = contentCache.get(cacheKey);
  const [categories, setCategories] = useState<ContentCategory[]>(initial?.categories ?? []);
  const [links, setLinks] = useState<ContentLink[]>(initial?.links ?? []);
  const [loading, setLoading] = useState(!initial);

  const load = useCallback(async () => {
    const cached = contentCache.get(cacheKey);
    if (!cached) setLoading(true);
    if (cached && Date.now() - cached.at < CONTENT_CACHE_MS) {
      setLoading(false);
      return;
    }
    let catQuery = supabase.from("content_categories" as any).select("*").order("sort_order");
    if (!includeInactive) catQuery = catQuery.eq("is_active", true);

    // Admin views read the table directly; everyone else goes through a
    // server-side function that only returns real URLs to paid members.
    const linkPromise = includeInactive
      ? supabase.from("content_links" as any).select("*").order("sort_order")
      : supabase.rpc("list_content_links" as any);

    const [cats, lks] = await Promise.all([catQuery, linkPromise]);
    const nextCategories = ((cats.data as any[]) ?? []) as ContentCategory[];
    const nextLinks = ((lks.data as any[]) ?? []) as ContentLink[];
    contentCache.set(cacheKey, { categories: nextCategories, links: nextLinks, at: Date.now() });
    setCategories(nextCategories);
    setLinks(nextLinks);
    setLoading(false);
  }, [cacheKey, includeInactive]);


  useEffect(() => {
    void load();
  }, [load]);

  const linksFor = useCallback(
    (categoryId: string) => links.filter((l) => l.category_id === categoryId),
    [links]
  );

  const categoryBySlug = useCallback(
    (slug: string) => categories.find((c) => c.slug === slug) ?? null,
    [categories]
  );

  return { categories, links, linksFor, categoryBySlug, loading, reload: load };
}
