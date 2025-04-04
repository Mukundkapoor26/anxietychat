// Cloudflare Pages middleware to handle routing

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  
  // Handle root path
  if (url.pathname === '/' || url.pathname === '') {
    // Redirect to the app page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/app',
      },
    });
  }
  
  // Continue to the next middleware or route handler
  return next();
}
