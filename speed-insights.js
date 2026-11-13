// Vercel Speed Insights initialization
// This script loads and initializes Speed Insights for performance tracking
(function() {
  // Import the inject function from the installed package
  // For production, this will be served from Vercel's CDN automatically
  // The script loads asynchronously and doesn't block page rendering
  
  window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
  
  // Create and inject the Speed Insights script
  var script = document.createElement('script');
  script.src = '/_vercel/speed-insights/script.js';
  script.defer = true;
  script.setAttribute('data-sdkn', '@vercel/speed-insights');
  script.setAttribute('data-sdkv', '1.3.1');
  
  script.onerror = function() {
    console.log('[Vercel Speed Insights] Failed to load script. Please check if any content blockers are enabled and try again.');
  };
  
  document.head.appendChild(script);
})();
