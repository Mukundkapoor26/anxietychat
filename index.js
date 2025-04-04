// Simple Worker to handle static assets for a SPA
export default {
  async fetch(request, env, ctx) {
    try {
      // Add some basic logging to understand what's happening
      console.log("Request received:", request.url);
      console.log("Available env bindings:", Object.keys(env));
      
      // Always try to serve static assets first
      return env.ASSETS.fetch(request);
    } catch (e) {
      console.error("Error serving assets:", e);
      
      // If there's an error, try to serve index.html from the static assets
      try {
        // Create a new request for index.html
        const indexRequest = new Request(new URL("/index.html", request.url), request);
        return env.ASSETS.fetch(indexRequest);
      } catch (indexError) {
        // Last resort fallback
        return new Response(
          `<!DOCTYPE html>
          <html>
            <head><title>AnxietyChat</title></head>
            <body>
              <h1>AnxietyChat</h1>
              <p>Application is running but had trouble loading assets. Please check your configuration.</p>
              <p>Error: ${e.message}</p>
            </body>
          </html>`,
          {
            status: 200,
            headers: { "Content-Type": "text/html" }
          }
        );
      }
    }
  }
}; 