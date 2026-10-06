import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const SITE_TITLE = "Altair AI LLC | Applied AI for everyday local services";

/** Names the browser tab (and the page screen readers announce) per route. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Altair` : SITE_TITLE;
  }, [title]);
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
