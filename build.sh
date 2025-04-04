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
cp -r .next/static .next/standalone/.next/
if [ -d "public" ]; then
  cp -r public .next/standalone/
fi

echo "Build completed successfully"
