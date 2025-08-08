#!/bin/bash

# PacDocSign Monorepo - Add Git Submodules Script
# This script adds the git submodules for the monorepo

echo "🚀 Setting up PacDocSign Monorepo with Git Submodules..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the root of the monorepo directory"
    exit 1
fi

# Create packages directory if it doesn't exist
mkdir -p packages

echo "📋 Please provide the remote URLs for your repositories:"
echo ""

# Function to add submodule with user input
add_submodule_interactive() {
    local name=$1
    local default_branch=$2
    
    echo "🔗 Adding submodule: $name"
    read -p "Enter the remote URL for $name repository: " remote_url
    
    if [ -n "$remote_url" ]; then
        echo "Adding submodule: $name from $remote_url (branch: $default_branch)"
        git submodule add -b $default_branch $remote_url packages/$name
        
        if [ $? -eq 0 ]; then
            echo "✅ Successfully added $name submodule"
        else
            echo "❌ Failed to add $name submodule"
        fi
    else
        echo "⚠️  Skipping $name (no URL provided)"
    fi
    echo ""
}

# Add submodules interactively
echo "=== Adding Submodules ==="
add_submodule_interactive "client" "develop"
add_submodule_interactive "api" "develop"
add_submodule_interactive "signers" "develop"
add_submodule_interactive "dashboard" "main"

echo "=== Finalizing Setup ==="

# Initialize and update submodules
echo "🔄 Initializing submodules..."
git submodule update --init --recursive

if [ $? -eq 0 ]; then
    echo "✅ Submodules initialized successfully"
else
    echo "❌ Failed to initialize submodules"
fi

echo ""
echo "🎉 Monorepo setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Run 'npm run install:all' to install all dependencies"
echo "2. Run 'npm run dev' to start all services in development mode"
echo "3. Check 'npm run submodule:status' to verify submodule status"
echo ""
echo "🔧 Useful commands:"
echo "- npm run submodule:update  # Update all submodules to latest"
echo "- npm run submodule:status  # Check submodule status"
echo "- npm run dev               # Start all services"
echo "- npm run build             # Build all packages"
