// Single source of truth: package.json "version", injected by rollup replace.
export const CARD_VERSION = process.env.VERSION || 'dev';
