export type BrowserPageKind = 'unauthenticated' | 'authenticated' | 'unknown';

export interface BrowserPageSnapshot {
  url: string;
  title: string;
  bodyText: string;
}

export function classifyBrowserPage(snapshot: BrowserPageSnapshot): BrowserPageKind {
  const haystack = `${snapshot.url}\n${snapshot.title}\n${snapshot.bodyText}`.toLowerCase();

  const unauthenticatedSignals = [
    'log in',
    'login',
    'sign in',
    'join now',
    'create account',
  ];

  const authenticatedSignals = [
    'host dashboard',
    'my trips',
    'calendar',
    'inbox',
    'earnings',
    'vehicles',
  ];

  if (unauthenticatedSignals.some((signal) => haystack.includes(signal))) {
    return 'unauthenticated';
  }

  if (authenticatedSignals.some((signal) => haystack.includes(signal))) {
    return 'authenticated';
  }

  return 'unknown';
}
