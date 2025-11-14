# Guide: Push to Develop, Then Cherry-Pick to Main

This guide explains the workflow for pushing changes to `develop` branch first, then cherry-picking to `main` branch in each submodule.

## Workflow Overview

1. **Develop Branch** (Integration/Testing)
   - Commit changes to `develop`
   - Push to `origin/develop`

2. **Main Branch** (Production)
   - Cherry-pick the commit from `develop` to `main`
   - Push to `origin/main`

3. **Parent Repository**
   - Update submodule references
   - Commit and push

## Quick Start (Automated)

Run the provided script:

```bash
./push-to-develop-then-main.sh
```

This script will:
- ✅ Checkout develop branch in each submodule
- ✅ Commit changes to develop
- ✅ Push to origin/develop
- ✅ Checkout main branch
- ✅ Cherry-pick the commit from develop to main
- ✅ Push to origin/main
- ✅ Update parent repository submodule references

## Manual Process

### Step 1: Process API Submodule

```bash
cd packages/api

# === DEVELOP BRANCH ===
git checkout develop
git pull origin develop  # Get latest changes

# Stage and commit
git add Cloud\ Functions/document-service/service/htmlGenerator.ts
git add Cloud\ Functions/orders-service/service/htmlGenerator.ts
git commit -m "Update operation hours to 7:00am to 7:00pm PST (EXC-16)"

# Push to develop
git push origin develop

# Get the commit hash
COMMIT_HASH=$(git rev-parse HEAD)
echo "Commit hash: $COMMIT_HASH"

# === MAIN BRANCH ===
git checkout main
git pull origin main  # Get latest changes

# Cherry-pick from develop
git cherry-pick $COMMIT_HASH

# Push to main
git push origin main

cd ../..
```

### Step 2: Process Client Submodule

```bash
cd packages/client

# === DEVELOP BRANCH ===
git checkout develop
git pull origin develop

git add src/Pages/ContactUs.js
git add src/Pages/HoursOfOperations.tsx
git commit -m "Update operation hours to 7:00am to 7:00pm PST (EXC-16)"
git push origin develop

COMMIT_HASH=$(git rev-parse HEAD)

# === MAIN BRANCH ===
git checkout main
git pull origin main
git cherry-pick $COMMIT_HASH
git push origin main

cd ../..
```

### Step 3: Process Signers Submodule

```bash
cd packages/signers

# === DEVELOP BRANCH ===
git checkout develop
git pull origin develop

git add src/Pages/ContactUs.js
git add src/Pages/HoursOfOperations.tsx
git commit -m "Update operation hours to 7:00am to 7:00pm PST (EXC-16)"
git push origin develop

COMMIT_HASH=$(git rev-parse HEAD)

# === MAIN BRANCH ===
git checkout main
git pull origin main
git cherry-pick $COMMIT_HASH
git push origin main

cd ../..
```

### Step 4: Update Parent Repository

```bash
# From the root of the monorepo
git add packages/api packages/client packages/signers

git commit -m "Update submodule references for EXC-16 operation hours update (develop and main)"

# Push parent repository
git push origin cursor/EXC-16-update-operation-hours-across-application-c50c
```

## Cherry-Pick Troubleshooting

### If cherry-pick has conflicts:

```bash
# Resolve conflicts manually
git status  # See conflicted files
# Edit files to resolve conflicts
git add <resolved-files>
git cherry-pick --continue

# Or abort and try again later
git cherry-pick --abort
```

### If commit already exists in main:

The cherry-pick will fail if the commit is already in main. You can:
- Skip it: `git cherry-pick --skip`
- Check if it exists: `git log --oneline | grep "EXC-16"`

### To verify cherry-pick worked:

```bash
# Check that both branches have the commit
git log develop --oneline -1
git log main --oneline -1

# Both should show the same commit message
```

## Alternative: Using Git Aliases

You can create aliases for this workflow:

```bash
# Add to ~/.gitconfig or .git/config
[alias]
    push-dev-main = "!f() { \
        git checkout develop && \
        git add -A && \
        git commit -m \"$1\" && \
        git push origin develop && \
        COMMIT=$(git rev-parse HEAD) && \
        git checkout main && \
        git cherry-pick $COMMIT && \
        git push origin main && \
        git checkout develop; \
    }; f"
```

Then use: `git push-dev-main "Your commit message"`

## Verification

After pushing, verify:

```bash
# Check submodule status
git submodule status

# Check commits in each branch
cd packages/api && echo "=== API ===" && \
  echo "Develop:" && git log develop --oneline -1 && \
  echo "Main:" && git log main --oneline -1 && \
  cd ../..

cd packages/client && echo "=== CLIENT ===" && \
  echo "Develop:" && git log develop --oneline -1 && \
  echo "Main:" && git log main --oneline -1 && \
  cd ../..

cd packages/signers && echo "=== SIGNERS ===" && \
  echo "Develop:" && git log develop --oneline -1 && \
  echo "Main:" && git log main --oneline -1 && \
  cd ../..
```

## Benefits of This Workflow

1. **Separation of Concerns**: Develop for integration, main for production
2. **Testing**: Changes can be tested in develop before going to main
3. **Clean History**: Main branch only contains production-ready commits
4. **Flexibility**: Can cherry-pick specific commits, not entire branches

## Important Notes

- Always pull latest changes before pushing
- Resolve any cherry-pick conflicts before pushing to main
- The commit hash will be different in main (cherry-pick creates new commit)
- Both branches will have the same changes, but different commit hashes
