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
    
    # Stage all changes first (before checking out)
    echo "📝 Staging changes..."
    git add -A
    
    # Stash changes if we need to switch branches
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
    NEED_STASH=false
    
    # Checkout or create develop branch
    if git show-ref --verify --quiet refs/heads/$DEVELOP_BRANCH; then
        echo "✅ Develop branch exists locally"
        if [ "$CURRENT_BRANCH" != "$DEVELOP_BRANCH" ]; then
            NEED_STASH=true
        fi
    else
        echo "⚠️  Develop branch doesn't exist locally, checking out from origin..."
        if git show-ref --verify --quiet refs/remotes/origin/$DEVELOP_BRANCH; then
            NEED_STASH=true
        else
            echo "⚠️  Develop branch doesn't exist in origin. Creating new branch from current state..."
        fi
    fi
    
    # Stash if needed, then checkout
    if [ "$NEED_STASH" = true ] && [ "$CURRENT_BRANCH" != "$DEVELOP_BRANCH" ]; then
        echo "💾 Stashing changes before branch switch..."
        git stash push -m "Temporary stash for EXC-16" > /dev/null 2>&1
        STASHED=true
    else
        STASHED=false
    fi
    
    # Now checkout develop
    if git show-ref --verify --quiet refs/heads/$DEVELOP_BRANCH; then
        git checkout $DEVELOP_BRANCH
        git pull origin $DEVELOP_BRANCH 2>/dev/null || echo "⚠️  Could not pull develop (might be first push)"
    else
        if git show-ref --verify --quiet refs/remotes/origin/$DEVELOP_BRANCH; then
            git checkout -b $DEVELOP_BRANCH origin/$DEVELOP_BRANCH
        else
            git checkout -b $DEVELOP_BRANCH
        fi
    fi
    
    # Apply stashed changes if we stashed
    if [ "$STASHED" = true ]; then
        echo "📦 Applying stashed changes..."
        git stash pop > /dev/null 2>&1 || true
        git add -A  # Re-stage after applying stash
    fi
    
    # Commit changes
    echo "💾 Committing changes to develop..."
    git commit -m "$COMMIT_MESSAGE" > /dev/null 2>&1 || {
        echo "⚠️  Commit failed or already committed"
    }
    
    # Get the commit hash
    COMMIT_HASH=$(git rev-parse HEAD)
    
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
    
    # Check if commit message already exists in main (to avoid duplicate commits)
    if git log --oneline --grep="$COMMIT_MESSAGE" | grep -q "$COMMIT_MESSAGE"; then
        echo "✅ Commit with same message already exists in main branch"
    elif git cherry-pick $COMMIT_HASH 2>&1; then
        echo "✅ Successfully cherry-picked to main"
    else
        # Check if it's because the commit is already in the branch
        if git merge-base --is-ancestor $COMMIT_HASH HEAD 2>/dev/null; then
            echo "✅ Commit is already in main branch (ancestor)"
        else
            echo "⚠️  Cherry-pick had conflicts or failed"
            echo "   Attempting to continue..."
            if git cherry-pick --continue 2>/dev/null; then
                echo "✅ Cherry-pick completed after conflict resolution"
            else
                echo "❌ Cherry-pick failed. You may need to resolve conflicts manually."
                echo "   Run: cd $submodule_path && git cherry-pick $COMMIT_HASH"
                git cherry-pick --abort 2>/dev/null || true
                cd - > /dev/null
                return 1
            fi
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
