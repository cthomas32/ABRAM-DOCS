import pagesData from "./navigation-data.json";

export interface DocPage {
  slug: string[]; // e.g. ["user-guide", "1.1-signing-in-and-onboarding"]
  path: string; // e.g. "user-guide/1.1-signing-in-and-onboarding"
  title: string;
  group: string;
  product: string;
}

export function getAllDocPages(): DocPage[] {
  return pagesData as DocPage[];
}

export function getAdjacentPages(currentSlugStr: string) {
  const allPages = getAllDocPages();
  const index = allPages.findIndex((p) => p.path === currentSlugStr);

  if (index === -1) {
    return { prev: null, next: null };
  }

  const prev = index > 0 ? allPages[index - 1] : null;
  const next = index < allPages.length - 1 ? allPages[index + 1] : null;

  return { prev, next };
}
