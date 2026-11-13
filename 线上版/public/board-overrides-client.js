(() => {
  const overrides = window.LIORA_BOARD_OVERRIDES || {};
  for (const [board, spec] of Object.entries(window.LIORA_BOARD_CATALOG)) {
    if (!overrides[board]) continue;
    const data = spec.expression === 'ARTICLES'
      ? (typeof ARTICLES === 'undefined' ? undefined : ARTICLES)
      : window[spec.expression.slice('window.'.length)];
    for (const [key, entry] of spec.entries(data)) {
      const patch = overrides[board][key];
      if (!patch) continue;
      for (const field of spec.fields) {
        if (Object.hasOwn(patch, field)) entry[field] = patch[field];
      }
    }
  }
})();
