import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false

/**
 * Handle requests to the anxiety-chat application
 */
export default {
  async fetch(request, env, ctx) {
    try {
      return await getAssetFromKV({
        request,
        waitUntil: ctx.waitUntil.bind(ctx),
        cacheControl: {
          browserTTL: 60 * 60 * 24, // 1 day
          edgeTTL: 60 * 60 * 24 * 365, // 1 year
          bypassCache: DEBUG,
        },
      })
    } catch (e) {
      // Fall back to serving index.html for SPA routes
      if (!DEBUG) {
        try {
          let notFoundResponse = await getAssetFromKV({
            request: new Request(new URL('/index.html', request.url)),
            waitUntil: ctx.waitUntil.bind(ctx),
          })
          return new Response(notFoundResponse.body, {
            ...notFoundResponse,
            status: 200,
          })
        } catch (e) {}
      }

      return new Response(e.message || e.toString(), { status: 500 })
    }
  },
}
