#!/bin/bash
# Build script for Netlify deployment
echo "Installing dependencies including devDependencies..."
npm ci --include=dev

echo "Running build..."
npm run build

echo "Build completed successfully!"
