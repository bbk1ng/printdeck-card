/**
 * Append a cache-bust query param to an entity_picture URL.
 * Uses ?t= when no query yet, &t= when one already exists (e.g. ?token=).
 *
 * @param {string|undefined|null} url
 * @param {number|string} [timestamp]
 * @returns {string}
 */
export const withCacheBust = (url, timestamp = Date.now()) => {
  if (!url) return '';
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${timestamp}`;
};
