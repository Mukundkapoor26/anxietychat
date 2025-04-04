// Simple Worker to handle static assets for a SPA
export default {
  async fetch(request, env, ctx) {
    try {
      // Log the environment to debug
      console.log("Available env bindings:", Object.keys(env));
      
      // Check if ASSETS binding exists
      if (env.ASSETS) {
        // If it exists, use it to fetch the assets
        return env.ASSETS.fetch(request);
      } else {
        // If ASSETS binding doesn't exist, serve a basic app page
        return new Response(
          `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>AnxietyChat</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .logo { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                .chat { border: 1px solid #ccc; border-radius: 8px; overflow: hidden; }
                .chat-header { background: #f0f0f0; padding: 10px 15px; border-bottom: 1px solid #ccc; }
                .chat-messages { padding: 15px; height: 300px; overflow-y: auto; }
                .message { margin-bottom: 15px; }
                .user-message { text-align: right; }
                .assistant-message { text-align: left; }
                .message-bubble { display: inline-block; padding: 8px 12px; border-radius: 18px; max-width: 70%; }
                .user-message .message-bubble { background: #007bff; color: white; }
                .assistant-message .message-bubble { background: #f1f1f1; color: black; }
                .input-area { display: flex; padding: 10px; border-top: 1px solid #ccc; }
                .input-area input { flex-grow: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-right: 10px; }
                .input-area button { padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="logo">AnxietyChat</div>
              <div class="chat">
                <div class="chat-header">Chat</div>
                <div class="chat-messages">
                  <div class="message assistant-message">
                    <div class="message-bubble">Welcome to AnxietyChat! How can I help you today?</div>
                  </div>
                  <div class="message user-message">
                    <div class="message-bubble">I'm feeling anxious about my presentation tomorrow.</div>
                  </div>
                  <div class="message assistant-message">
                    <div class="message-bubble">That's completely understandable. Presentations can be stressful. Would you like me to share some preparation tips or relaxation techniques?</div>
                  </div>
                </div>
                <div class="input-area">
                  <input type="text" placeholder="Type your message...">
                  <button>Send</button>
                </div>
              </div>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Note: This is a static preview of AnxietyChat. Full functionality requires proper configuration of environment variables and deployment settings.
              </p>
            </body>
          </html>`,
          {
            status: 200,
            headers: { "Content-Type": "text/html" }
          }
        );
      }
    } catch (e) {
      console.error("Error:", e);
      
      // Return a fallback response with error details
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>AnxietyChat</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              h1 { color: #333; }
              .error { background: #fff8f8; border-left: 4px solid #e74c3c; padding: 10px; margin: 20px 0; }
              code { background: #f5f5f5; padding: 3px 5px; border-radius: 3px; font-family: monospace; }
            </style>
          </head>
          <body>
            <h1>AnxietyChat</h1>
            <p>Application is running but couldn't access the static assets.</p>
            
            <div class="error">
              <p><strong>Error:</strong> ${e.message}</p>
              <p>This usually happens when the Worker is not properly configured as a Pages Function.</p>
            </div>
            
            <h2>Troubleshooting Steps:</h2>
            <ol>
              <li>Make sure you're using the <code>@cloudflare/pages-plugin-static-forms</code> Pages configuration</li>
              <li>Check that your build output directory is set to <code>out</code></li>
              <li>Verify that your site is deployed as a Pages site, not a Worker site</li>
              <li>Try deploying directly through the Cloudflare dashboard</li>
            </ol>
          </body>
        </html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html" }
        }
      );
    }
  }
}; 