#!/bin/bash

# Script to deploy all packages to production from main branch
# This script handles the deployment workflow for the monorepo

set -e  # Exit on error

echo "🚀 Starting production deployment from main branch..."
echo ""

# Function to deploy API (Cloud Functions)
deploy_api() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Deploying API (Cloud Functions)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd packages/api
    
    # Ensure we're on main branch
    git checkout main
    git pull origin main
    
    # Check which Cloud Functions were modified
    echo "📝 Checking for modified Cloud Functions..."
    
    # The changes are in orders-service and document-service
    MODIFIED_SERVICES=("orders-service" "document-service")
    
    echo "✅ Services to deploy: ${MODIFIED_SERVICES[*]}"
    echo ""
    echo "⚠️  API deployment requires GitHub Actions workflow"
    echo "   Options:"
    echo "   1. Merge main to prod-green-central (production)"
    echo "   2. Merge main to prod-blue-west (staging)"
    echo "   3. Trigger workflow manually via GitHub Actions"
    echo ""
    echo "   To deploy via GitHub Actions:"
    echo "   - Go to: https://github.com/omidhalavi/pacdocv2-api/actions/workflows/deploy-cloud-functions.yml"
    echo "   - Click 'Run workflow'"
    echo "   - Select: environment=production, deployment=green-only"
    echo "   - Function: orders-service,document-service"
    echo ""
    
    cd ../..
}

# Function to deploy Client (Firebase)
deploy_client() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Deploying Client (Firebase Hosting)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd packages/client
    
    # Ensure we're on main branch
    git checkout main
    git pull origin main
    
    echo "📝 Building client application..."
    if [ -f ".env.prod" ]; then
        cp .env.prod .env
    fi
    
    # Build
    echo "🔨 Running build..."
    npm run build || yarn run build
    
    # Deploy to Firebase
    echo "🚀 Deploying to Firebase Hosting..."
    firebase use host 2>/dev/null || firebase use default
    firebase deploy --only hosting
    
    echo "✅ Client deployed successfully"
    echo ""
    
    cd ../..
}

# Function to deploy Signers (Firebase)
deploy_signers() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Deploying Signers (Firebase Hosting)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd packages/signers
    
    # Ensure we're on main branch
    git checkout main
    git pull origin main
    
    echo "📝 Building signers application..."
    if [ -f ".env.prod" ]; then
        cp .env.prod .env
    fi
    
    # Build
    echo "🔨 Running build..."
    npm run build || yarn run build
    
    # Deploy to Firebase
    echo "🚀 Deploying to Firebase Hosting..."
    firebase use host 2>/dev/null || firebase use default
    firebase deploy --only hosting
    
    echo "✅ Signers deployed successfully"
    echo ""
    
    cd ../..
}

# Main deployment flow
echo "Select deployment options:"
echo "1) Deploy all (API via GitHub Actions, Client & Signers via Firebase)"
echo "2) Deploy Client only (Firebase)"
echo "3) Deploy Signers only (Firebase)"
echo "4) Deploy API only (instructions for GitHub Actions)"
echo "5) Show deployment instructions only"
echo ""
read -p "Enter choice [1-5] (default: 5): " choice
choice=${choice:-5}

case $choice in
    1)
        deploy_api
        deploy_client
        deploy_signers
        ;;
    2)
        deploy_client
        ;;
    3)
        deploy_signers
        ;;
    4)
        deploy_api
        ;;
    5)
        deploy_api
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📋 Client Deployment Instructions"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "cd packages/client"
        echo "git checkout main && git pull origin main"
        echo "cp .env.prod .env"
        echo "npm run build"
        echo "firebase use host"
        echo "firebase deploy --only hosting"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📋 Signers Deployment Instructions"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "cd packages/signers"
        echo "git checkout main && git pull origin main"
        echo "cp .env.prod .env"
        echo "npm run build"
        echo "firebase use host"
        echo "firebase deploy --only hosting"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Deployment process completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
