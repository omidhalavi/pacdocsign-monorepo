#!/bin/bash

# PacDocSign Monorepo - Git Submodules Setup Script
# This script sets up git submodules for the monorepo structure

echo "Setting up PacDocSign Monorepo with Git Submodules..."

# Create packages directory if it doesn't exist
mkdir -p packages

# Function to add submodule
add_submodule() {
    local name=$1
    local remote_url=$2
    local branch=$3
    
    echo "Adding submodule: $name"
    if [ -n "$remote_url" ]; then
        git submodule add -b $branch $remote_url packages/$name
    else
        echo "Warning: No remote URL provided for $name. You'll need to add it manually."
        echo "Run: git submodule add -b $branch <remote-url> packages/$name"
    fi
}

# Add submodules (you'll need to replace these URLs with your actual repository URLs)
echo "Please provide the remote URLs for your repositories:"
echo ""

# Example submodule additions (replace with actual URLs)
# add_submodule "client" "https://github.com/your-org/pacdocv2-client.git" "develop"
# add_submodule "api" "https://github.com/your-org/pacdocv2-api.git" "develop"
# add_submodule "signers" "https://github.com/your-org/pacdocv2-signers.git" "develop"
# add_submodule "dashboard" "https://github.com/your-org/pacdocv2-dashboard.git" "main"

echo "To add submodules manually, run the following commands:"
echo ""
echo "# For client repository:"
echo "git submodule add -b develop <client-repo-url> packages/client"
echo ""
echo "# For API repository:"
echo "git submodule add -b develop <api-repo-url> packages/api"
echo ""
echo "# For signers repository:"
echo "git submodule add -b develop <signers-repo-url> packages/signers"
echo ""
echo "# For dashboard repository:"
echo "git submodule add -b main <dashboard-repo-url> packages/dashboard"
echo ""
echo "After adding submodules, run:"
echo "git submodule update --init --recursive"
echo "npm run install:all"
