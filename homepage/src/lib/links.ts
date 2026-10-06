/** True for links that leave this site (any scheme, or protocol-relative). */
export function isExternalUrl(url: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith("//");
}

/** External links open in a new tab; on-site links stay in this one. */
export function linkTargetProps(url: string) {
  return isExternalUrl(url) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
