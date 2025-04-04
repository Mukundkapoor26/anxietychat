export async function onRequest(context) {
  // Just pass the request through to the static assets
  return await context.next();
} 