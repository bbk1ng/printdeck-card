
## 2026-07-19 — overrides list vs map
User's first-instinct YAML shape (list-of-maps) was silently ignored because
implementation accepted map only. Pattern: config parsing must either accept
the obvious alternative shapes or fail loudly (console.warn) — silent ignore
of user config always comes back as a "not working" report.
