# Production Deployment Guide - EXC-16 Operation Hours Update

This guide explains how to deploy the operation hours changes to production from the main branch.

## Overview

The monorepo uses different deployment strategies for each package:

1. **API (Cloud Functions)**: GitHub Actions workflow triggered by production branches
2. **Client**: Firebase Hosting (deploy from main)
3. **Signers**: Firebase Hosting (deploy from main)

## Current Status

✅ All changes have been committed and pushed to `main` branch in:
- `packages/api` - Commit: `115abe15`
- `packages/client` - Commit: `4500367`
- `packages/signers` - Commit: `c3dad31`

## Deployment Steps

### Option 1: Automated Script

Run the deployment script:

```bash
./deploy-to-production.sh
```

Follow the prompts to select what to deploy.

### Option 2: Manual Deployment

#### Step 1: Deploy API (Cloud Functions)

The API uses GitHub Actions workflow that deploys when pushing to production branches.

**Option A: Merge main to production branch (Recommended)**

```bash
cd packages/api

# For production (Green environment - us-central1)
git checkout prod-green-central
git pull origin prod-green-central
git merge main
git push origin prod-green-central

# This will automatically trigger GitHub Actions deployment
```

**Option B: Trigger workflow manually**

1. Go to: https://github.com/omidhalavi/pacdocv2-api/actions/workflows/deploy-cloud-functions.yml
2. Click "Run workflow"
3. Configure:
   - **Environment**: `production`
   - **Deployment**: `green-only` (for production) or `blue-only` (for staging)
   - **Function**: `orders-service,document-service` (or leave empty for all)
   - **Project**: `pacdocv2-api-prod` (auto-selected for production)
4. Click "Run workflow"

**Modified Services:**
- `orders-service` - Updated `htmlGenerator.ts` footer
- `document-service` - Updated `htmlGenerator.ts` footer

#### Step 2: Deploy Client (Firebase Hosting)

```bash
cd packages/client

# Ensure on main branch
git checkout main
git pull origin main

# Copy production environment file
cp .env.prod .env

# Build the application
npm run build
# or
yarn run build

# Deploy to Firebase
firebase use host
firebase deploy --only hosting
```

**What's deployed:**
- `src/Pages/ContactUs.js` - Updated operation hours
- `src/Pages/HoursOfOperations.tsx` - Updated operation hours

#### Step 3: Deploy Signers (Firebase Hosting)

```bash
cd packages/signers

# Ensure on main branch
git checkout main
git pull origin main

# Copy production environment file
cp .env.prod .env

# Build the application
npm run build
# or
yarn run build

# Deploy to Firebase
firebase use host
firebase deploy --only hosting
```

**What's deployed:**
- `src/Pages/ContactUs.js` - Updated operation hours
- `src/Pages/HoursOfOperations.tsx` - Updated operation hours

## Verification

After deployment, verify the changes:

### API (PDFs)
1. Generate a signer confirmation PDF
2. Check the footer shows: "M-F: 7:00am to 7:00pm PST"
3. Verify it does NOT show "6 AM" or "7:30pm"

### Client App
1. Navigate to: https://clients.pacdocsign.com/hours-of-operation
2. Verify Monday-Friday shows: "7:00am - 7:00pm PST"
3. Navigate to: https://clients.pacdocsign.com/contact-us
4. Verify office hours show: "7:00am - 7:00pm PST"

### Signers App
1. Navigate to: https://signers.pacdocsign.com/hours-of-operation
2. Verify Monday-Friday shows: "07:00AM - 07:00PM PST"
3. Navigate to: https://signers.pacdocsign.com/contact-us
4. Verify office hours show: "07:00AM - 07:00PM PST"

## Deployment Checklist

- [ ] API: Changes merged to `prod-green-central` OR workflow triggered manually
- [ ] API: GitHub Actions deployment completed successfully
- [ ] Client: Built and deployed to Firebase Hosting
- [ ] Signers: Built and deployed to Firebase Hosting
- [ ] Verified PDFs show correct hours
- [ ] Verified Client app shows correct hours
- [ ] Verified Signers app shows correct hours
- [ ] Saturday hours remain unchanged (8:00am - 4:00pm PST)

## Rollback Plan

If issues occur, rollback by:

### API
```bash
cd packages/api
git checkout prod-green-central
git revert <commit-hash>
git push origin prod-green-central
```

### Client/Signers
```bash
# Revert to previous Firebase deployment
firebase hosting:rollback
```

## Important Notes

1. **API Deployment**: The GitHub Actions workflow automatically detects changed Cloud Functions and deploys only those that changed.

2. **Firebase Deployment**: Make sure you're authenticated:
   ```bash
   firebase login
   ```

3. **Environment Variables**: Ensure `.env.prod` files are up to date before building.

4. **Build Verification**: Test the build locally before deploying:
   ```bash
   npm run build
   # Check the build output
   ```

5. **Staging First**: Consider deploying to staging (Blue environment) first:
   ```bash
   # For API
   git checkout prod-blue-west
   git merge main
   git push origin prod-blue-west
   ```

## Support

If deployment fails:
1. Check GitHub Actions logs for API deployment
2. Check Firebase deployment logs for Client/Signers
3. Verify all dependencies are installed
4. Ensure you have proper permissions for deployment
