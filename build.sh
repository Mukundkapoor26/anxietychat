#!/bin/bash

# Set environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Remove existing package-lock.json if it exists
if [ -f "package-lock.json" ]; then
  rm package-lock.json
  echo "Removed existing package-lock.json"
fi

# Install dependencies with legacy peer deps
npm install --no-package-lock --legacy-peer-deps

# Build Next.js app with special flags to prevent static generation issues
NODE_OPTIONS="--max_old_space_size=4096" npm run build

# Create a special file to indicate to Cloudflare that this is a Next.js app
echo '{"framework": "nextjs", "buildCommand": "npm run build"}' > .next/standalone/framework.json

# Copy static and public assets to the standalone directory
mkdir -p .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/

# Copy public directory if it exists
if [ -d "public" ]; then
  cp -r public .next/standalone/
fi

# Create a _worker.js file for Cloudflare Pages
cat > .next/standalone/_worker.js << 'EOL'
import { createEventHandler } from '@cloudflare/next-on-pages';

// The event handler for handling HTTP requests
export const onRequest = createEventHandler({
  // Optional: Specify the build output directory if different from '.next'
  buildOutput: '.next',
});
EOL

# Create an index.html file as a fallback
cat > .next/standalone/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anxiety Chat</title>
  <meta http-equiv="refresh" content="0;url=/app" />
</head>
<body>
  <p>Redirecting to application...</p>
  <script>
    window.location.href = "/app";
  </script>
</body>
</html>
EOL

# Create a routes.json file for Cloudflare Pages
cat > .next/standalone/routes.json << 'EOL'
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_next/*", "/static/*"],
  "routes": [
    { "src": "/", "dest": "/app" },
    { "src": "/(.*)", "dest": "/app/$1" }
  ]
}
EOL

echo "Build completed successfully"
