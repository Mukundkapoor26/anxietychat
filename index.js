export default {
  async fetch(request, env, ctx) {
    // Let Cloudflare Pages handle all requests normally
    return env.ASSETS.fetch(request);
  }
};
