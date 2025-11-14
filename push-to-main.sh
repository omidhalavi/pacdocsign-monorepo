#!/bin/bash

# Script to commit and push changes to main branch in each submodule
# This script handles the monorepo workflow for pushing changes to main branches

set -e  # Exit on error

BRANCH_NAME="main"
COMMIT_MESSAGE="Update operation hours to 7:00am to 7:00pm PST (EXC-16)"

echo "🚀 Starting push to main branches for all submodules..."
echo ""

# Function to process a submodule
process_submodule() {
    local submodule_path=$1
    local submodule_name=$(basename "$submodule_path")
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Processing: $submodule_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd "$submodule_path"
    
    # Check if there are any changes
    if [ -z "$(git status --porcelain)" ]; then
        echo "✅ No changes in $submodule_name, skipping..."
        echo ""
        cd - > /dev/null
        return
    fi
    
    # Show current status
    echo "Current status:"
    git status --short
    echo ""
    
    # Check if main branch exists locally
    if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
        echo "✅ Main branch exists locally"
        git checkout $BRANCH_NAME
    else
        echo "⚠️  Main branch doesn't exist locally, checking out from origin..."
        if git show-ref --verify --quiet refs/remotes/origin/$BRANCH_NAME; then
            git checkout -b $BRANCH_NAME origin/$BRANCH_NAME
        else
            echo "❌ Main branch doesn't exist in origin either. Creating new branch..."
            git checkout -b $BRANCH_NAME
        fi
    fi
    
    # Stage all changes
    echo "📝 Staging changes..."
    git add -A
    
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "$COMMIT_MESSAGE" || {
        echo "⚠️  No changes to commit (might be already committed)"
    }
    
    # Push to remote
    echo "🚀 Pushing to origin/$BRANCH_NAME..."
    git push origin $BRANCH_NAME || {
        echo "❌ Failed to push $submodule_name"
        cd - > /dev/null
        return 1
    }
    
    echo "✅ Successfully pushed $submodule_name to origin/$BRANCH_NAME"
    echo ""
    
    cd - > /dev/null
}

# Process each submodule that has changes
if [ -d "packages/api" ] && [ -n "$(cd packages/api && git status --porcelain)" ]; then
    process_submodule "packages/api"
fi

if [ -d "packages/client" ] && [ -n "$(cd packages/client && git status --porcelain)" ]; then
    process_submodule "packages/client"
fi

if [ -d "packages/signers" ] && [ -n "$(cd packages/signers && git status --porcelain)" ]; then
    process_submodule "packages/signers"
fi

# Update parent repository to reference new submodule commits
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Updating parent repository submodule references"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$(git rev-parse --show-toplevel)"

# Stage submodule updates
git add packages/api packages/client packages/signers 2>/dev/null || true

if [ -n "$(git status --porcelain packages/api packages/client packages/signers 2>/dev/null)" ]; then
    echo "💾 Committing submodule reference updates..."
    git commit -m "Update submodule references for EXC-16 operation hours update" || {
        echo "⚠️  No submodule reference changes to commit"
    }
    echo "✅ Parent repository updated"
else
    echo "ℹ️  No submodule reference changes to commit"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All done! Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To push the parent repository changes:"
echo "  git push origin $(git branch --show-current)"
echo ""
echo "To push parent repository and update submodules on remote:"
echo "  git push origin $(git branch --show-current) --recurse-submodules=on-demand"
echo ""
