#!/bin/bash

# PacDocSign Monorepo - Ensure Branches Script
# This script ensures all submodules have both main and develop branches

echo "🌿 Ensuring main and develop branches exist in all submodules..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the root of the monorepo directory"
    exit 1
fi

# Function to ensure branches exist for a submodule
ensure_branches() {
    local submodule_path=$1
    local submodule_name=$2
    
    if [ ! -d "$submodule_path" ]; then
        echo "⚠️  Submodule $submodule_name not found at $submodule_path"
        return 1
    fi
    
    echo "🔧 Checking branches for $submodule_name..."
    cd "$submodule_path"
    
    # Get current branch
    current_branch=$(git branch --show-current)
    echo "  Current branch: $current_branch"
    
    # Fetch all branches from remote
    git fetch --all --quiet
    
    # Check and create main branch
    if ! git show-ref --verify --quiet refs/heads/main; then
        if git show-ref --verify --quiet refs/remotes/origin/main; then
            echo "  ✅ Creating local main branch from remote..."
            git checkout -b main origin/main
        else
            echo "  ✅ Creating new main branch from current branch..."
            git checkout -b main
        fi
    else
        echo "  ✅ Main branch already exists"
    fi
    
    # Check and create develop branch
    if ! git show-ref --verify --quiet refs/heads/develop; then
        if git show-ref --verify --quiet refs/remotes/origin/develop; then
            echo "  ✅ Creating local develop branch from remote..."
            git checkout -b develop origin/develop
        else
            echo "  ✅ Creating new develop branch from current branch..."
            git checkout -b develop
        fi
    else
        echo "  ✅ Develop branch already exists"
    fi
    
    # Switch back to original branch
    git checkout "$current_branch" --quiet
    echo "  Switched back to $current_branch"
    
    cd - > /dev/null
    echo ""
}

# Check if submodules exist
if [ ! -d "packages" ]; then
    echo "❌ Packages directory not found. Please add submodules first using ./add-submodules.sh"
    exit 1
fi

# Ensure branches for each submodule
echo "=== Ensuring branches for all submodules ==="

submodules=("client" "api" "signers" "dashboard")
for submodule in "${submodules[@]}"; do
    if [ -d "packages/$submodule" ]; then
        ensure_branches "packages/$submodule" "$submodule"
    else
        echo "⚠️  $submodule submodule not found"
    fi
done

echo "=== Branch Check Complete ==="
echo ""
echo "📋 Branch status summary:"
echo ""

# Display branch status for each submodule
for submodule in "${submodules[@]}"; do
    if [ -d "packages/$submodule" ]; then
        echo "🌿 $submodule:"
        cd "packages/$submodule"
        
        # Check main branch
        if git show-ref --verify --quiet refs/heads/main; then
            echo "  ✅ main branch exists"
        else
            echo "  ❌ main branch missing"
        fi
        
        # Check develop branch
        if git show-ref --verify --quiet refs/heads/develop; then
            echo "  ✅ develop branch exists"
        else
            echo "  ❌ develop branch missing"
        fi
        
        cd - > /dev/null
    fi
done

echo ""
echo "🎉 Branch setup complete!"
echo ""
echo "🔧 Useful commands:"
echo "- git submodule foreach 'git branch -a'  # List all branches in all submodules"
echo "- git submodule foreach 'git checkout develop'  # Switch all submodules to develop"
echo "- git submodule foreach 'git checkout main'     # Switch all submodules to main"
echo ""
echo "📝 To push new branches to remote repositories:"
echo "cd packages/<submodule> && git push -u origin main && git push -u origin develop"
