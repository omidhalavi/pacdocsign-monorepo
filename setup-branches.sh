#!/bin/bash

# PacDocSign Monorepo - Setup Branches Script
# This script ensures all submodules have both main and develop branches

echo "🌿 Setting up main and develop branches for all submodules..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the root of the monorepo directory"
    exit 1
fi

# Function to setup branches for a submodule
setup_submodule_branches() {
    local submodule_path=$1
    local submodule_name=$2
    
    if [ ! -d "$submodule_path" ]; then
        echo "⚠️  Submodule $submodule_name not found at $submodule_path"
        return 1
    fi
    
    echo "🔧 Setting up branches for $submodule_name..."
    cd "$submodule_path"
    
    # Get current branch
    current_branch=$(git branch --show-current)
    echo "  Current branch: $current_branch"
    
    # Fetch all branches from remote
    echo "  Fetching all branches from remote..."
    git fetch --all
    
    # Check if main branch exists
    if git show-ref --verify --quiet refs/remotes/origin/main; then
        echo "  ✅ Main branch exists on remote"
        # Create local main branch if it doesn't exist
        if ! git show-ref --verify --quiet refs/heads/main; then
            echo "  Creating local main branch..."
            git checkout -b main origin/main
        else
            echo "  Local main branch already exists"
        fi
    else
        echo "  ⚠️  Main branch not found on remote"
    fi
    
    # Check if develop branch exists
    if git show-ref --verify --quiet refs/remotes/origin/develop; then
        echo "  ✅ Develop branch exists on remote"
        # Create local develop branch if it doesn't exist
        if ! git show-ref --verify --quiet refs/heads/develop; then
            echo "  Creating local develop branch..."
            git checkout -b develop origin/develop
        else
            echo "  Local develop branch already exists"
        fi
    else
        echo "  ⚠️  Develop branch not found on remote"
    fi
    
    # Switch back to original branch
    git checkout "$current_branch"
    echo "  Switched back to $current_branch"
    
    cd - > /dev/null
    echo ""
}

# Function to create missing branches
create_missing_branches() {
    local submodule_path=$1
    local submodule_name=$2
    
    if [ ! -d "$submodule_path" ]; then
        return 1
    fi
    
    echo "🔧 Creating missing branches for $submodule_name..."
    cd "$submodule_path"
    
    # Get current branch
    current_branch=$(git branch --show-current)
    
    # Check if main branch exists locally
    if ! git show-ref --verify --quiet refs/heads/main; then
        echo "  Creating main branch..."
        if git show-ref --verify --quiet refs/remotes/origin/main; then
            git checkout -b main origin/main
        else
            # Create main branch from current branch
            git checkout -b main
            echo "  Created main branch from $current_branch"
        fi
    fi
    
    # Check if develop branch exists locally
    if ! git show-ref --verify --quiet refs/heads/develop; then
        echo "  Creating develop branch..."
        if git show-ref --verify --quiet refs/remotes/origin/develop; then
            git checkout -b develop origin/develop
        else
            # Create develop branch from current branch
            git checkout -b develop
            echo "  Created develop branch from $current_branch"
        fi
    fi
    
    # Switch back to original branch
    git checkout "$current_branch"
    
    cd - > /dev/null
    echo ""
}

# Function to push branches to remote
push_branches() {
    local submodule_path=$1
    local submodule_name=$2
    
    if [ ! -d "$submodule_path" ]; then
        return 1
    fi
    
    echo "🚀 Pushing branches for $submodule_name..."
    cd "$submodule_path"
    
    # Push main branch if it exists locally
    if git show-ref --verify --quiet refs/heads/main; then
        echo "  Pushing main branch..."
        git push -u origin main 2>/dev/null || echo "  Main branch already exists on remote or push failed"
    fi
    
    # Push develop branch if it exists locally
    if git show-ref --verify --quiet refs/heads/develop; then
        echo "  Pushing develop branch..."
        git push -u origin develop 2>/dev/null || echo "  Develop branch already exists on remote or push failed"
    fi
    
    cd - > /dev/null
    echo ""
}

# Check if submodules exist
if [ ! -d "packages" ]; then
    echo "❌ Packages directory not found. Please add submodules first using ./add-submodules.sh"
    exit 1
fi

# Setup branches for each submodule
echo "=== Setting up branches for all submodules ==="

# Client submodule
if [ -d "packages/client" ]; then
    setup_submodule_branches "packages/client" "client"
    create_missing_branches "packages/client" "client"
    read -p "Push branches for client? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_branches "packages/client" "client"
    fi
else
    echo "⚠️  Client submodule not found"
fi

# API submodule
if [ -d "packages/api" ]; then
    setup_submodule_branches "packages/api" "api"
    create_missing_branches "packages/api" "api"
    read -p "Push branches for api? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_branches "packages/api" "api"
    fi
else
    echo "⚠️  API submodule not found"
fi

# Signers submodule
if [ -d "packages/signers" ]; then
    setup_submodule_branches "packages/signers" "signers"
    create_missing_branches "packages/signers" "signers"
    read -p "Push branches for signers? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_branches "packages/signers" "signers"
    fi
else
    echo "⚠️  Signers submodule not found"
fi

# Dashboard submodule
if [ -d "packages/dashboard" ]; then
    setup_submodule_branches "packages/dashboard" "dashboard"
    create_missing_branches "packages/dashboard" "dashboard"
    read -p "Push branches for dashboard? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_branches "packages/dashboard" "dashboard"
    fi
else
    echo "⚠️  Dashboard submodule not found"
fi

echo "=== Branch Setup Complete ==="
echo ""
echo "📋 Summary of branches for each submodule:"
echo ""

# Display branch status for each submodule
for submodule in client api signers dashboard; do
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
echo "📝 Next steps:"
echo "1. Review the branch status above"
echo "2. Push any new branches to remote repositories if needed"
echo "3. Update your .gitmodules file if you want to change default branches"
