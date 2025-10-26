// Immediate CSP override for wallet extension compatibility
(function() {
  'use strict';
  
  // Remove any existing CSP meta tags
  const existingCSP = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
  existingCSP.forEach(meta => meta.remove());
  
  // Add permissive CSP
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: chrome-extension: moz-extension: webkit-extension: *; script-src 'self' 'unsafe-inline' 'unsafe-eval' chrome-extension: moz-extension: webkit-extension: *; style-src 'self' 'unsafe-inline' chrome-extension: moz-extension: *; img-src 'self' data: https: http: chrome-extension: moz-extension: *; connect-src 'self' https: http: wss: ws: chrome-extension: moz-extension: *; frame-src 'self' chrome-extension: moz-extension: *; worker-src 'self' blob: *; child-src 'self' blob: *; object-src 'self' *;";
  
  // Insert at the beginning of head
  if (document.head) {
    document.head.insertBefore(meta, document.head.firstChild);
  } else {
    // If head doesn't exist yet, wait for it
    const observer = new MutationObserver(function(mutations) {
      if (document.head) {
        document.head.insertBefore(meta, document.head.firstChild);
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
  
  console.log('🔓 CSP override applied for wallet extensions');
})();