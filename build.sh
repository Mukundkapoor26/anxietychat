#!/bin/bash

# Set environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Install dependencies with legacy peer deps
npm install --no-package-lock --legacy-peer-deps

# Build Next.js app
npm run build

# Create output directory
mkdir -p dist

# Copy the .next/static directory to dist/_next/static
mkdir -p dist/_next
cp -r .next/static dist/_next/

# Copy all files from the public directory to dist
cp -r public/* dist/

# Create a simple HTML file that loads the app
cat > dist/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anxiety Chat</title>
  <link rel="stylesheet" href="/_next/static/css/app.css">
</head>
<body>
  <div id="__next"></div>
  <script>
    // Redirect to the app route if needed
    if (window.location.pathname === '/app' || window.location.pathname.startsWith('/app/')) {
      window.location.pathname = window.location.pathname.replace(/^\/app/, '') || '/';
    }
  </script>
  <script src="/_next/static/chunks/main.js"></script>
  <script src="/_next/static/chunks/pages/_app.js"></script>
  <script src="/_next/static/chunks/pages/index.js"></script>
</body>
</html>
EOL

# Create a copy for the /app route
mkdir -p dist/app
cp dist/index.html dist/app/index.html

# Create a _redirects file for Cloudflare Pages
cat > dist/_redirects << 'EOL'
/app    /    301
/app/*  /:splat    301
EOL

echo "Build completed successfully"
