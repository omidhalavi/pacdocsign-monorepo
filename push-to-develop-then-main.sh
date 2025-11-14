#!/bin/bash

# Script to push changes to develop, then cherry-pick to main
# This follows the workflow: develop (integration) -> main (production)

set -e  # Exit on error

DEVELOP_BRANCH="develop"
MAIN_BRANCH="main"
COMMIT_MESSAGE="Update operation hours to 7:00am to 7:00pm PST (EXC-16)"

echo "🚀 Starting push workflow: develop → main (cherry-pick)"
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
    
    # STEP 1: Push to develop branch
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 Step 1: Pushing to develop branch"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Checkout or create develop branch
    if git show-ref --verify --quiet refs/heads/$DEVELOP_BRANCH; then
        echo "✅ Develop branch exists locally"
        git checkout $DEVELOP_BRANCH
        git pull origin $DEVELOP_BRANCH 2>/dev/null || echo "⚠️  Could not pull develop (might be first push)"
    else
        echo "⚠️  Develop branch doesn't exist locally, checking out from origin..."
        if git show-ref --verify --quiet refs/remotes/origin/$DEVELOP_BRANCH; then
            git checkout -b $DEVELOP_BRANCH origin/$DEVELOP_BRANCH
        else
            echo "⚠️  Develop branch doesn't exist in origin. Creating new branch from current state..."
            git checkout -b $DEVELOP_BRANCH
        fi
    fi
    
    # Stage all changes
    echo "📝 Staging changes..."
    git add -A
    
    # Commit changes
    echo "💾 Committing changes to develop..."
    COMMIT_HASH=$(git commit -m "$COMMIT_MESSAGE" 2>&1 | grep -oE '^\[.* [a-f0-9]{7}\]' | sed 's/.* //' || git rev-parse HEAD)
    
    if [ -z "$COMMIT_HASH" ]; then
        # Try to get the commit hash another way
        COMMIT_HASH=$(git rev-parse HEAD)
    fi
    
    echo "✅ Committed with hash: $COMMIT_HASH"
    
    # Push to develop
    echo "🚀 Pushing to origin/$DEVELOP_BRANCH..."
    git push origin $DEVELOP_BRANCH || {
        echo "❌ Failed to push $submodule_name to develop"
        cd - > /dev/null
        return 1
    }
    
    echo "✅ Successfully pushed $submodule_name to origin/$DEVELOP_BRANCH"
    echo ""
    
    # STEP 2: Cherry-pick to main branch
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🍒 Step 2: Cherry-picking to main branch"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Checkout main branch
    if git show-ref --verify --quiet refs/heads/$MAIN_BRANCH; then
        echo "✅ Main branch exists locally"
        git checkout $MAIN_BRANCH
        git pull origin $MAIN_BRANCH 2>/dev/null || echo "⚠️  Could not pull main"
    else
        echo "⚠️  Main branch doesn't exist locally, checking out from origin..."
        if git show-ref --verify --quiet refs/remotes/origin/$MAIN_BRANCH; then
            git checkout -b $MAIN_BRANCH origin/$MAIN_BRANCH
        else
            echo "⚠️  Main branch doesn't exist in origin. Creating new branch..."
            git checkout -b $MAIN_BRANCH
        fi
    fi
    
    # Cherry-pick the commit from develop
    echo "🍒 Cherry-picking commit $COMMIT_HASH from develop..."
    if git cherry-pick $COMMIT_HASH 2>/dev/null; then
        echo "✅ Successfully cherry-picked to main"
    else
        echo "⚠️  Cherry-pick had conflicts or commit already exists"
        echo "   Checking if commit is already in main..."
        if git log --oneline | grep -q "$COMMIT_HASH"; then
            echo "✅ Commit already exists in main branch"
        else
            echo "❌ Cherry-pick failed. You may need to resolve conflicts manually."
            echo "   Run: cd $submodule_path && git cherry-pick $COMMIT_HASH"
            cd - > /dev/null
            return 1
        fi
    fi
    
    # Push to main
    echo "🚀 Pushing to origin/$MAIN_BRANCH..."
    git push origin $MAIN_BRANCH || {
        echo "❌ Failed to push $submodule_name to main"
        cd - > /dev/null
        return 1
    }
    
    echo "✅ Successfully pushed $submodule_name to origin/$MAIN_BRANCH"
    echo ""
    
    cd - > /dev/null
}

# Process each submodule that has changes
SUBMODULES_PROCESSED=0

if [ -d "packages/api" ] && [ -n "$(cd packages/api && git status --porcelain 2>/dev/null)" ]; then
    process_submodule "packages/api"
    SUBMODULES_PROCESSED=$((SUBMODULES_PROCESSED + 1))
fi

if [ -d "packages/client" ] && [ -n "$(cd packages/client && git status --porcelain 2>/dev/null)" ]; then
    process_submodule "packages/client"
    SUBMODULES_PROCESSED=$((SUBMODULES_PROCESSED + 1))
fi

if [ -d "packages/signers" ] && [ -n "$(cd packages/signers && git status --porcelain 2>/dev/null)" ]; then
    process_submodule "packages/signers"
    SUBMODULES_PROCESSED=$((SUBMODULES_PROCESSED + 1))
fi

if [ $SUBMODULES_PROCESSED -eq 0 ]; then
    echo "ℹ️  No submodules with changes found"
    exit 0
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
    git commit -m "Update submodule references for EXC-16 operation hours update (develop and main)" || {
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
echo "✅ Changes pushed to develop branch in all submodules"
echo "✅ Changes cherry-picked and pushed to main branch in all submodules"
echo ""
echo "To push the parent repository changes:"
echo "  git push origin $(git branch --show-current)"
echo ""
echo "To verify the commits:"
echo "  git submodule foreach 'echo \"=== \$name ===\" && git log --oneline -2'"
echo ""
