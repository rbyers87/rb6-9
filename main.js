// Detect if the app is running as a PWA (standalone mode)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

// Apply the dark class if the system is in dark mode and the app is in standalone mode
if (isStandalone && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}

// Optional: Listen for system theme changes in standalone mode
if (isStandalone) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
}
