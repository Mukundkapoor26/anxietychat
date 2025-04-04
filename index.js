export default {
  async fetch(request, env) {
    // This just passes the request to the static asset handler
    return env.ASSETS.fetch(request);
  }
}; 