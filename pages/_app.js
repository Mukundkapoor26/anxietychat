import { useEffect } from 'react';

// This polyfills localStorage during server-side rendering
function polyfillLocalStorage() {
  if (typeof window === 'undefined') {
    global.localStorage = {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
    };
  }
}

function MyApp({ Component, pageProps }) {
  // Run the polyfill immediately
  polyfillLocalStorage();
  
  // Also run it on the client side to ensure it's available
  useEffect(() => {
    // This is just to ensure the polyfill runs in the browser too
    if (typeof window !== 'undefined' && !window.localStorage) {
      window.localStorage = {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null,
      };
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
