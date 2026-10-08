(() => {
  const key = 'interview-docs-theme';
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem(key);
    root.dataset.theme = ['light', 'dark', 'auto'].includes(saved)
      ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch { root.dataset.theme = 'light'; }
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-site-theme-toggle]')) return;
    const dark = root.dataset.theme === 'dark' ||
      (root.dataset.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem(key, root.dataset.theme); } catch {}
  });
})();
