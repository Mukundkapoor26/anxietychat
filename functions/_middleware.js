// Cloudflare Pages middleware to handle routing

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  
  // Handle /app path specifically
  if (url.pathname === '/app' || url.pathname.startsWith('/app/')) {
    // Rewrite to the root path
    const newUrl = new URL(request.url);
    newUrl.pathname = url.pathname.replace(/^\/app/, '');
    
    // If the new path is empty, set it to /
    if (newUrl.pathname === '') {
      newUrl.pathname = '/';
    }
    
    // Create a new request with the modified URL
    const newRequest = new Request(newUrl.toString(), request);
    return next(newRequest);
  }
  
  // Continue to the next middleware or route handler
  return next();
}
