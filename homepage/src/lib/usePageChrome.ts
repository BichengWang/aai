import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";

export const SITE_TITLE = "Altair AI LLC | Applied AI for everyday local services";
export const SITE_DESCRIPTION =
  "Altair is an applied AI lab in the San Francisco Bay Area. We build AI-guided intake, verification and matching for trusted local providers, plus tools like a document review workspace.";

export function formatPageTitle(title?: string) {
  return title ? `${title} | Altair` : SITE_TITLE;
}

export type PageMeta = {
  title?: string;
  description?: string;
};

/**
 * Set only while prerendering (src/entry-prerender.tsx): pages write their
 * title and description into it, and the build puts them in that page's <head>.
 */
export const PageMetaContext = createContext<PageMeta | null>(null);

/**
 * Names the browser tab (and the page screen readers announce) per route.
 * The description only feeds the prerendered <head>; client-side navigation
 * keeps the one the page loaded with, as crawlers load each URL afresh.
 */
export function usePageTitle(title?: string, description?: string) {
  const prerendered = useContext(PageMetaContext);
  if (prerendered) {
    prerendered.title = title;
    prerendered.description = description;
  }

  useEffect(() => {
    document.title = formatPageTitle(title);
  }, [title]);
}

const subscribeNever = () => () => {};

/**
 * False while prerendering and while hydrating that HTML, true afterwards.
 * Lets output that depends on the browser (window.location) render once the
 * page is live without a hydration mismatch.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

/**
 * Client-side navigation keeps the previous page's scroll position and focus,
 * so a link near the bottom of one page would open the next one mid-way.
 * On every route change (not the first render) go to the top, or to the
 * #fragment when there is one, and move focus to the main landmark.
 */
export function useRouteChangeReset(mainId: string) {
  const { pathname, hash } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) {
      target.scrollIntoView();
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.getElementById(mainId)?.focus({ preventScroll: true });
  }, [pathname, hash, mainId]);
}
