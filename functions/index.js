// Cloudflare Pages function to handle the root route

export async function onRequest(context) {
  // Redirect to the root path instead of /app
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
    },
  });
}
