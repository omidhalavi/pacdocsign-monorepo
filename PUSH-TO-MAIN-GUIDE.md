# Guide: Pushing Changes to Main Branch in Monorepo

This guide explains how to push the operation hours changes (EXC-16) to the main branch of each submodule repository.

## Overview

The monorepo uses git submodules. Each package (api, client, signers) is a separate repository. To push changes to main:

1. Commit changes in each submodule
2. Push each submodule to its main branch
3. Update the parent repository to reference the new commits

## Quick Start (Automated)

Run the provided script:

```bash
./push-to-main.sh
```

This script will:
- ✅ Checkout main branch in each submodule
- ✅ Commit the changes with a descriptive message
- ✅ Push to origin/main for each submodule
- ✅ Update parent repository submodule references

## Manual Process

If you prefer to do it manually or need more control:

### Step 1: Process API Submodule

```bash
cd packages/api

# Checkout main branch
git checkout main

# Stage changes
git add Cloud\ Functions/document-service/service/htmlGenerator.ts
git add Cloud\ Functions/orders-service/service/htmlGenerator.ts

# Commit
git commit -m "Update operation hours to 7:00am to 7:00pm PST (EXC-16)"

# Push
git push origin main

cd ../..
```

### Step 2: Process Client Submodule

```bash
cd packages/client

# Checkout main branch
git checkout main

# Stage changes
git add src/Pages/ContactUs.js
git add src/Pages/HoursOfOperations.tsx

# Commit
git commit -m "Update operation hours to 7:00am to 7:00pm PST (EXC-16)"

# Push
git push origin main

cd ../..
```

### Step 3: Process Signers Submodule

```bash
cd packages/signers

# Checkout main branch
git checkout main

# Stage changes
git add src/Pages/ContactUs.js
git add src/Pages/HoursOfOperations.tsx

# Commit
git commit -m "Update operation hours to 7:00am to 7:00pm PST (EXC-16)"

# Push
git push origin main

cd ../..
```

### Step 4: Update Parent Repository

```bash
# From the root of the monorepo
git add packages/api packages/client packages/signers

git commit -m "Update submodule references for EXC-16 operation hours update"

# Push parent repository
git push origin cursor/EXC-16-update-operation-hours-across-application-c50c
```

## Alternative: Push to Develop Branch

If your workflow uses `develop` branch instead of `main`, you can modify the script or use:

```bash
# For each submodule, replace 'main' with 'develop'
git checkout develop
git add -A
git commit -m "Update operation hours to 7:00am to 7:00pm PST (EXC-16)"
git push origin develop
```

## Using NPM Scripts

The monorepo has some helpful npm scripts, but you'll need to commit and push manually:

```bash
# Check branch status across all submodules
npm run branch:status

# Switch all submodules to main
npm run branch:main

# Then manually commit and push in each submodule
```

## Important Notes

1. **Branch Strategy**: According to `.gitmodules`, the default branches are:
   - `api`: develop
   - `client`: develop
   - `signers`: develop
   - `dashboard`: main

2. **Detached HEAD**: The submodules are currently in detached HEAD state. You need to checkout a branch before committing.

3. **Parent Repository**: After pushing submodules, update the parent repository to reference the new commits.

4. **Merge Strategy**: If you push to `develop` first, you may need to merge `develop` into `main` later:
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

## Troubleshooting

### If main branch doesn't exist locally:
```bash
git checkout -b main origin/main
```

### If you need to create main from current state:
```bash
git checkout -b main
git push -u origin main
```

### To see what changed in each submodule:
```bash
cd packages/api && git diff && cd ../..
cd packages/client && git diff && cd ../..
cd packages/signers && git diff && cd ../..
```

## Verification

After pushing, verify the changes:

1. Check each repository on GitHub
2. Verify the commits are on the correct branch
3. Check that the parent repository references the new commits

```bash
# Check submodule status
git submodule status

# Check what branch each submodule is on
git submodule foreach 'echo "=== $name ===" && git branch --show-current'
```
