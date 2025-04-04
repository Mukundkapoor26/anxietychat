export default {
  async fetch(request, env) {
    // The static site is handled automatically by Cloudflare Pages
    // This worker script does nothing but allows wrangler to deploy successfully
    return new Response("Anxietychat Worker is running", {
      headers: { "content-type": "text/plain" },
    });
  },
}; 