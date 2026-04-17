// Este script debe ir en la carpeta public y cargarse antes que cualquier otro script
// Previene el FOUC (Flash of Unstyled Content) al cargar el tema

(function() {
  'use strict';
  
  // Function to get the theme from localStorage
  function getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (e) {
      return null;
    }
  }
  
  // Function to get system preference
  function getSystemPreference() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      // Fallback for older browsers
    }
    return 'light';
  }
  
  // Apply theme immediately
  function applyTheme() {
    const storedTheme = getStoredTheme();
    // Light mode por defecto como pediste
    const theme = storedTheme || 'light';
    
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Set meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = theme === 'dark' ? '#000000' : '#ffffff';
    }
  }
  
  // Apply theme immediately on script execution
  applyTheme();
  
  // Also listen for storage changes (when user changes theme in another tab)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', function(e) {
      if (e.key === 'theme') {
        applyTheme();
      }
    });
  }
})();
