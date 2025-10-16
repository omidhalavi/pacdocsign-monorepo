# PacDocSign Monorepo

A comprehensive document signing platform organized as a monorepo using git submodules.

## 🏗️ Architecture

This monorepo contains the following packages:

- **`packages/client`** - React-based client application for document signing
- **`packages/api`** - Node.js/Express backend API
- **`packages/signers`** - React-based signer application
- **`packages/dashboard`** - React-based admin dashboard

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### Initial Setup

1. **Clone the monorepo with submodules:**
   ```bash
   git clone --recursive https://github.com/omidhalavi/pacdocsign-monorepo.git
   cd pacdocsign-monorepo
   ```

2. **If you cloned without submodules, initialize them:**
   ```bash
   git submodule update --init --recursive
   ```

3. **Install dependencies:**
   ```bash
   npm run install:all
   ```

4. **Ensure all branches exist:**
   ```bash
   npm run branch:ensure
   ```

### Development

**Start all services in development mode:**
```bash
npm run dev
```

**Start individual services:**
```bash
# Client application
npm run dev:client

# API server
npm run dev:api

# Signers application
npm run dev:signers

# Dashboard application
npm run dev:dashboard
```

### Building

**Build all packages:**
```bash
npm run build
```

**Build individual packages:**
```bash
npm run build:client
npm run build:api
npm run build:signers
npm run build:dashboard
```

### Testing

**Run all tests:**
```bash
npm run test
```

**Run individual package tests:**
```bash
npm run test:client
npm run test:api
npm run test:signers
npm run test:dashboard
```

### Linting

**Lint all packages:**
```bash
npm run lint
```

**Lint individual packages:**
```bash
npm run lint:client
npm run lint:api
npm run lint:signers
npm run lint:dashboard
```

## 📁 Project Structure

```
pacdocsign-monorepo/
├── packages/
│   ├── client/          # React client application
│   ├── api/             # Node.js/Express API
│   ├── signers/         # React signers application
│   └── dashboard/       # React admin dashboard
├── package.json         # Root package.json with workspace config
├── .gitmodules          # Git submodules configuration
├── README.md           # This file
├── SETUP.md            # Setup guide
├── add-submodules.sh   # Interactive submodule setup script
├── ensure-branches.sh  # Ensure branches exist script
├── setup-branches.sh   # Comprehensive branch setup script
└── branch-operations.sh # Interactive branch operations script
```

## 🔧 Git Submodules Management

### Basic Submodule Operations

**Initialize all submodules:**
```bash
npm run submodule:init
```

**Update all submodules to latest:**
```bash
npm run submodule:update
```

**Check submodule status:**
```bash
npm run submodule:status
```

### Adding New Submodules

1. **Add a new submodule:**
   ```bash
   git submodule add -b <branch> <repository-url> packages/<package-name>
   ```

2. **Initialize and update submodules:**
   ```bash
   git submodule update --init --recursive
   ```

### Interactive Submodule Management

**Interactive branch operations menu:**
```bash
./branch-operations.sh
```

This script provides 12 different operations:
1. List all branches across all submodules
2. Switch all submodules to a specific branch
3. Create new branch across all submodules
4. Merge branch across all submodules
5. Push changes to remote branches
6. Pull latest changes from remote branches
7. Show current branch status
8. Show branch differences
9. Stash changes across all submodules
10. Apply stashed changes across all submodules
11. Reset all submodules to a specific commit
12. Show commit history across all submodules

### Direct Git Commands

You can also use git submodule commands directly:
```bash
# Initialize submodules
git submodule update --init --recursive

# Run command in each submodule
git submodule foreach '<command>'

# Show submodule status
git submodule status

# Update submodules to latest remote
git submodule update --remote --recursive
```

### Submodule Workflow

1. **Making changes in a submodule:**
   ```bash
   cd packages/client
   # Make your changes
   git add .
   git commit -m "Your changes"
   git push origin develop
   ```

2. **Updating the main repository:**
   ```bash
   # From the root directory
   git add packages/client
   git commit -m "Update client submodule"
   git push origin main
   ```

## 🌿 Branch Management

### Branch Strategy

Each package maintains both `main` and `develop` branches:

- **`main`** - Production-ready code
- **`develop`** - Development and feature integration

### Branch Management Commands

**Ensure all submodules have both branches:**
```bash
npm run branch:ensure
```

**Comprehensive branch setup (with push options):**
```bash
npm run branch:setup
```

**Check branch status across all submodules:**
```bash
npm run branch:status
```

**Switch all submodules to develop branch:**
```bash
npm run branch:develop
```

**Switch all submodules to main branch:**
```bash
npm run branch:main
```

**Interactive branch operations:**
```bash
npm run branch:operations
```

### Advanced Branch Operations

**List all branches across submodules:**
```bash
npm run branch:list
```

**Switch all submodules to a specific branch:**
```bash
npm run branch:switch -- <branch-name>
```

**Create new branch across all submodules:**
```bash
npm run branch:create -- <new-branch-name>
```

**Merge branches across all submodules:**
```bash
npm run branch:merge -- <source-branch> <target-branch>
```

**Push current branch in all submodules:**
```bash
npm run branch:push
```

**Pull latest changes in all submodules:**
```bash
npm run branch:pull
```

**Stash changes across all submodules:**
```bash
npm run branch:stash
```

**Apply stashed changes across all submodules:**
```bash
npm run branch:stash:apply
```

**Show differences between branches:**
```bash
npm run branch:diff -- <branch1> <branch2>
```

**Show commit history for a branch:**
```bash
npm run branch:history -- <branch-name> <limit>
```

### Branch Workflow

1. **Development workflow:**
   ```bash
   # Switch all submodules to develop
   npm run branch:develop
   
   # Make changes in individual submodules
   cd packages/client
   # ... make changes ...
   git add . && git commit -m "Feature: new functionality"
   git push origin develop
   ```

2. **Release workflow:**
   ```bash
   # Switch all submodules to main
   npm run branch:main
   
   # Merge develop into main for each submodule
   cd packages/client
   git merge develop
   git push origin main
   ```

## 🏷️ Branching Strategy

Each package maintains its own branching strategy:

- **`packages/client`** - Uses `develop` and `main` branches
- **`packages/api`** - Uses `develop` and `main` branches  
- **`packages/signers`** - Uses `develop` and `main` branches
- **`packages/dashboard`** - Uses `develop` and `main` branches

## 🚀 Deployment

**Deploy all packages:**
```bash
npm run deploy
```

**Deploy individual packages:**
```bash
npm run deploy:client
npm run deploy:api
npm run deploy:signers
npm run deploy:dashboard
```

## 🧹 Maintenance

**Clean all build artifacts and node_modules:**
```bash
npm run clean
```

**Reinstall all dependencies:**
```bash
npm run install:all
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## 📄 License

UNLICENSED - Private repository

## 👥 Team

- **Author:** iMationsoft
- **Platform:** Document Signing Platform
