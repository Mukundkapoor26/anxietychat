export default {
  async fetch(request, env, ctx) {
    try {
      // First check if the request is for a static asset
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      
      // Fallback response if assets binding is not available
      return new Response("AnxietyChat application is running", {
        headers: { "Content-Type": "text/plain" }
      });
    } catch (e) {
      // Return a basic response if anything fails
      return new Response("AnxietyChat application", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
}; 