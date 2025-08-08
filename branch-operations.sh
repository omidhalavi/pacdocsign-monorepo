#!/bin/bash

# PacDocSign Monorepo - Branch Operations Script
# This script provides comprehensive branch reading and writing operations

echo "🌿 PacDocSign Monorepo - Branch Operations"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the root of the monorepo directory"
    exit 1
fi

# Function to display menu
show_menu() {
    echo "=== Branch Operations Menu ==="
    echo "1.  List all branches across all submodules"
    echo "2.  Switch all submodules to a specific branch"
    echo "3.  Create new branch across all submodules"
    echo "4.  Merge branch across all submodules"
    echo "5.  Push changes to remote branches"
    echo "6.  Pull latest changes from remote branches"
    echo "7.  Show current branch status"
    echo "8.  Show branch differences"
    echo "9.  Stash changes across all submodules"
    echo "10. Apply stashed changes across all submodules"
    echo "11. Reset all submodules to a specific commit"
    echo "12. Show commit history across all submodules"
    echo "0.  Exit"
    echo ""
}

# Function to list all branches
list_all_branches() {
    echo "📋 Listing all branches across submodules:"
    echo ""
    git submodule foreach 'echo "=== $name ===" && git branch -a && echo ""'
}

# Function to switch all submodules to a specific branch
switch_to_branch() {
    local target_branch=$1
    echo "🔄 Switching all submodules to $target_branch branch..."
    echo ""
    
    git submodule foreach "
        echo \"=== \$name ===\"
        if git show-ref --verify --quiet refs/heads/$target_branch; then
            git checkout $target_branch
            echo \"✅ Switched to $target_branch\"
        else
            echo \"❌ Branch $target_branch not found in \$name\"
        fi
        echo \"\"
    "
}

# Function to create new branch across all submodules
create_new_branch() {
    local new_branch=$1
    echo "🌿 Creating new branch '$new_branch' across all submodules..."
    echo ""
    
    git submodule foreach "
        echo \"=== \$name ===\"
        if ! git show-ref --verify --quiet refs/heads/$new_branch; then
            git checkout -b $new_branch
            echo \"✅ Created and switched to $new_branch\"
        else
            echo \"⚠️  Branch $new_branch already exists in \$name\"
            git checkout $new_branch
        fi
        echo \"\"
    "
}

# Function to merge branch across all submodules
merge_branch() {
    local source_branch=$1
    local target_branch=$2
    
    if [ -z "$target_branch" ]; then
        target_branch=$(git branch --show-current)
    fi
    
    echo "🔀 Merging $source_branch into $target_branch across all submodules..."
    echo ""
    
    git submodule foreach "
        echo \"=== \$name ===\"
        current_branch=\$(git branch --show-current)
        if [ \"\$current_branch\" != \"$target_branch\" ]; then
            git checkout $target_branch
        fi
        if git show-ref --verify --quiet refs/heads/$source_branch; then
            git merge $source_branch
            echo \"✅ Merged $source_branch into $target_branch\"
        else
            echo \"❌ Branch $source_branch not found in \$name\"
        fi
        echo \"\"
    "
}

# Function to push changes to remote
push_changes() {
    local branch_name=$1
    if [ -z "$branch_name" ]; then
        branch_name=$(git branch --show-current)
    fi
    
    echo "🚀 Pushing changes to $branch_name branch across all submodules..."
    echo ""
    
    git submodule foreach "
        echo \"=== \$name ===\"
        current_branch=\$(git branch --show-current)
        if [ \"\$current_branch\" = \"$branch_name\" ]; then
            git push origin $branch_name
            echo \"✅ Pushed changes to $branch_name\"
        else
            echo \"⚠️  Not on $branch_name branch (currently on \$current_branch)\"
        fi
        echo \"\"
    "
}

# Function to pull latest changes
pull_changes() {
    local branch_name=$1
    if [ -z "$branch_name" ]; then
        branch_name=$(git branch --show-current)
    fi
    
    echo "📥 Pulling latest changes from $branch_name branch across all submodules..."
    echo ""
    
    git submodule foreach "
        echo \"=== \$name ===\"
        current_branch=\$(git branch --show-current)
        if [ \"\$current_branch\" = \"$branch_name\" ]; then
            git pull origin $branch_name
            echo \"✅ Pulled latest changes from $branch_name\"
        else
            echo \"⚠️  Not on $branch_name branch (currently on \$current_branch)\"
        fi
        echo \"\"
    "
}

# Function to show current branch status
show_branch_status() {
    echo "📊 Current branch status across all submodules:"
    echo ""
    git submodule foreach '
        echo "=== $name ==="
        current_branch=$(git branch --show-current)
        echo "  Current branch: $current_branch"
        echo "  Status:"
        git status --porcelain | head -5
        if [ $(git status --porcelain | wc -l) -gt 5 ]; then
            echo "  ... and $(($(git status --porcelain | wc -l) - 5)) more files"
        fi
        echo ""
    '
}

# Function to show branch differences
show_branch_differences() {
    local branch1=$1
    local branch2=$2
    
    if [ -z "$branch1" ] || [ -z "$branch2" ]; then
        echo "Usage: show_branch_differences <branch1> <branch2>"
        return 1
    fi
    
    echo "🔍 Showing differences between $branch1 and $branch2 across all submodules:"
    echo ""
    
    git submodule foreach "
        echo \"=== \$name ===\"
        if git show-ref --verify --quiet refs/heads/$branch1 && git show-ref --verify --quiet refs/heads/$branch2; then
            echo \"  Differences between $branch1 and $branch2:\"
            git diff --stat $branch1..$branch2
        else
            echo \"  ❌ One or both branches not found\"
        fi
        echo \"\"
    "
}

# Function to stash changes across all submodules
stash_changes() {
    local stash_message=$1
    if [ -z "$stash_message" ]; then
        stash_message="Auto-stash from monorepo"
    fi
    
    echo "📦 Stashing changes across all submodules..."
    echo ""
    
    git submodule foreach "
        echo \"=== \$name ===\"
        if [ -n \"\$(git status --porcelain)\" ]; then
            git stash push -m \"$stash_message\"
            echo \"✅ Stashed changes\"
        else
            echo \"  No changes to stash\"
        fi
        echo \"\"
    "
}

# Function to apply stashed changes
apply_stash() {
    echo "📤 Applying stashed changes across all submodules..."
    echo ""
    
    git submodule foreach "
        echo \"=== \$name ===\"
        if git stash list | grep -q .; then
            git stash pop
            echo \"✅ Applied stashed changes\"
        else
            echo \"  No stashed changes to apply\"
        fi
        echo \"\"
    "
}

# Function to reset all submodules to a specific commit
reset_to_commit() {
    local commit_hash=$1
    
    if [ -z "$commit_hash" ]; then
        echo "Usage: reset_to_commit <commit-hash>"
        return 1
    fi
    
    echo "🔄 Resetting all submodules to commit $commit_hash..."
    echo ""
    
    git submodule foreach "
        echo \"=== \$name ===\"
        if git show --oneline -s $commit_hash >/dev/null 2>&1; then
            git reset --hard $commit_hash
            echo \"✅ Reset to commit $commit_hash\"
        else
            echo \"❌ Commit $commit_hash not found in \$name\"
        fi
        echo \"\"
    "
}

# Function to show commit history
show_commit_history() {
    local branch_name=$1
    local limit=${2:-10}
    
    if [ -z "$branch_name" ]; then
        branch_name=$(git branch --show-current)
    fi
    
    echo "📜 Showing last $limit commits from $branch_name branch across all submodules:"
    echo ""
    
    git submodule foreach "
        echo \"=== \$name ===\"
        if git show-ref --verify --quiet refs/heads/$branch_name; then
            git log --oneline -n $limit $branch_name
        else
            echo \"❌ Branch $branch_name not found in \$name\"
        fi
        echo \"\"
    "
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice (0-12): " choice
    echo ""
    
    case $choice in
        1)
            list_all_branches
            ;;
        2)
            read -p "Enter branch name to switch to: " branch_name
            switch_to_branch "$branch_name"
            ;;
        3)
            read -p "Enter new branch name: " new_branch
            create_new_branch "$new_branch"
            ;;
        4)
            read -p "Enter source branch to merge from: " source_branch
            read -p "Enter target branch to merge into (or press Enter for current): " target_branch
            merge_branch "$source_branch" "$target_branch"
            ;;
        5)
            read -p "Enter branch name to push (or press Enter for current): " branch_name
            push_changes "$branch_name"
            ;;
        6)
            read -p "Enter branch name to pull from (or press Enter for current): " branch_name
            pull_changes "$branch_name"
            ;;
        7)
            show_branch_status
            ;;
        8)
            read -p "Enter first branch name: " branch1
            read -p "Enter second branch name: " branch2
            show_branch_differences "$branch1" "$branch2"
            ;;
        9)
            read -p "Enter stash message (or press Enter for default): " stash_message
            stash_changes "$stash_message"
            ;;
        10)
            apply_stash
            ;;
        11)
            read -p "Enter commit hash to reset to: " commit_hash
            reset_to_commit "$commit_hash"
            ;;
        12)
            read -p "Enter branch name (or press Enter for current): " branch_name
            read -p "Enter number of commits to show (or press Enter for 10): " limit
            show_commit_history "$branch_name" "$limit"
            ;;
        0)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please enter a number between 0 and 12."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    echo ""
done
