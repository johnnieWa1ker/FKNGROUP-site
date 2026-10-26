// Run before CSS to avoid a light flash when a dark preference was saved.
(() => {
 let preference = 'system';
 try {
  const saved = localStorage.getItem('fkngroup-site-theme');
  if (['system', 'light', 'dark'].includes(saved)) preference = saved;
 } catch { /* Storage can be disabled; system theme still works. */ }
 const dark = preference === 'dark' || (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
 document.documentElement.dataset.themePreference = preference;
 document.documentElement.dataset.theme = dark ? 'dark' : 'light';
 document.querySelector('meta[name="theme-color"]').content = dark ? '#171c16' : '#f5f5ef';
})();
