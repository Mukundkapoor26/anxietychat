#!/bin/bash

# Set environment variables
export NODE_OPTIONS="--max-old-space-size=4096"

# Remove existing package-lock.json
rm -f package-lock.json

# Install dependencies with legacy peer deps
npm install --legacy-peer-deps

# Build the Next.js application
npm run build
