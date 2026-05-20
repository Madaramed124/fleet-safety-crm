#!/bin/bash

# Fleet Safety CRM - Quick Start Script for macOS/Linux

echo ""
echo "========================================"
echo "Fleet Safety CRM - Quick Start"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "ERROR: Node.js is not installed!"
    echo "Please download and install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js detected: $(node --version)"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "✓ Dependencies installed"
echo ""
echo "========================================"
echo "Starting development server..."
echo "========================================"
echo ""
echo "The app will open at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start dev server
npm run dev
