# PacDocSign Monorepo Setup Guide

## 🎯 Current Status

✅ **Completed:**
- Monorepo structure created
- Root package.json with workspace configuration
- Git submodules configuration files
- Comprehensive README and documentation
- Setup scripts for easy submodule management

⏳ **Next Steps:**
- Add git submodules for each repository
- Install dependencies
- Test the setup

## 🚀 Quick Setup Instructions

### Step 1: Add Git Submodules

You have two options to add the submodules:

#### Option A: Interactive Script (Recommended)
```bash
./add-submodules.sh
```
This script will prompt you for the remote URLs of each repository.

#### Option B: Manual Addition
```bash
# Add client repository
git submodule add -b develop <client-repo-url> packages/client

# Add API repository  
git submodule add -b develop <api-repo-url> packages/api

# Add signers repository
git submodule add -b develop <signers-repo-url> packages/signers

# Add dashboard repository
git submodule add -b main <dashboard-repo-url> packages/dashboard
```

### Step 2: Initialize Submodules
```bash
git submodule update --init --recursive
```

### Step 3: Install Dependencies
```bash
npm run install:all
```

### Step 4: Test the Setup
```bash
# Check submodule status
npm run submodule:status

# Start development servers
npm run dev
```

## 📁 Repository Structure

After setup, your directory structure will look like this:

```
pacdocsign-monorepo/
├── packages/
│   ├── client/          # React client application (submodule)
│   ├── api/             # Node.js/Express API (submodule)
│   ├── signers/         # React signers application (submodule)
│   └── dashboard/       # React admin dashboard (submodule)
├── package.json         # Root package.json with workspace config
├── .gitmodules          # Git submodules configuration
├── README.md           # Comprehensive documentation
├── SETUP.md            # This setup guide
├── add-submodules.sh   # Interactive submodule setup script
└── setup-submodules.sh # Manual submodule setup script
```

## 🔧 Git Submodules Management

### Useful Commands

```bash
# Check submodule status
npm run submodule:status

# Update all submodules to latest
npm run submodule:update

# Initialize submodules (if not done during clone)
npm run submodule:init

# Clone with submodules
git clone --recursive <monorepo-url>

# Clone without submodules, then initialize
git clone <monorepo-url>
git submodule update --init --recursive
```

### Working with Submodules

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

## 🏷️ Branching Strategy

Each package maintains its own branching strategy:

- **`packages/client`** - Uses `develop` and `main` branches
- **`packages/api`** - Uses `develop` and `main` branches  
- **`packages/signers`** - Uses `develop` and `main` branches
- **`packages/dashboard`** - Uses `develop` and `main` branches

## 🚀 Development Workflow

### Starting Development
```bash
# Start all services
npm run dev

# Start individual services
npm run dev:client
npm run dev:api
npm run dev:signers
npm run dev:dashboard
```

### Building and Testing
```bash
# Build all packages
npm run build

# Test all packages
npm run test

# Lint all packages
npm run lint
```

## 🆘 Troubleshooting

### Common Issues

1. **Submodules not initialized:**
   ```bash
   git submodule update --init --recursive
   ```

2. **Dependencies not installed:**
   ```bash
   npm run install:all
   ```

3. **Permission denied on scripts:**
   ```bash
   chmod +x add-submodules.sh
   chmod +x setup-submodules.sh
   ```

4. **Git hooks issues:**
   ```bash
   git commit --no-verify -m "Your commit message"
   ```

## 📞 Support

If you encounter any issues during setup:

1. Check the README.md for detailed documentation
2. Verify your repository URLs are correct
3. Ensure you have the necessary permissions for all repositories
4. Check that all branches exist in the remote repositories

## 🎉 Success Criteria

You'll know the setup is complete when:

- ✅ All submodules are added and initialized
- ✅ Dependencies are installed for all packages
- ✅ `npm run dev` starts all services successfully
- ✅ `npm run submodule:status` shows all submodules as up-to-date
- ✅ All packages can be built and tested individually
