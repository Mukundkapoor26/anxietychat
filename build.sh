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

# Create a routes.json file for Cloudflare Pages
cat > .next/standalone/routes.json << 'EOL'
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_next/*", "/static/*"],
  "routes": [
    { "src": "/app", "dest": "/" },
    { "src": "/app/(.*)", "dest": "/$1" }
  ]
}
EOL

# Create a _redirects file for Cloudflare Pages
cat > .next/standalone/_redirects << 'EOL'
/app    /    301
/app/*  /:splat    301
EOL

# Copy the server.js file to the root for Cloudflare Pages
cp .next/standalone/server.js .next/standalone/index.js

# Create a simple static HTML file for direct access
cat > .next/standalone/404.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anxiety Chat</title>
  <meta http-equiv="refresh" content="0;url=/" />
</head>
<body>
  <p>Redirecting to application...</p>
  <script>
    window.location.href = "/";
  </script>
</body>
</html>
EOL

echo "Build completed successfully"
