# JIRA Automation Scripts

This directory contains scripts for automating JIRA ticket creation and management for the GCP authentication migration project.

## 📁 Script Files

### JIRA Creation Scripts
- **`jira-create-auth-migration.sh`** - Main script to create JIRA epic and stories
- **`create-pac-auth-migration.sh`** - Alternative creation script
- **`create-auth-stories-simple.sh`** - Simplified story creation
- **`recreate-auth-stories-with-epic.sh`** - Recreate stories with epic linking

### JIRA Linking Scripts
- **`link-auth-stories-to-epic.sh`** - Link stories to parent epic
- **`link-epic-tasks.sh`** - Link tasks to epic
- **`manual-epic-linking.sh`** - Manual epic linking utility

### Component Assignment
- **`assign-auth-components.sh`** - Assign components to stories

### Reference Data
- **`jira-tickets-import.csv`** - JIRA ticket import template
- **`jira-cli-commands.sh`** - Common JIRA CLI commands

## 🚀 Usage

### Prerequisites
```bash
# Install JIRA CLI
npm install -g jira-cli

# Configure JIRA credentials
jira config
```

### Create Epic and Stories
```bash
# Create complete migration epic with all stories
./jira-create-auth-migration.sh

# Or create stories individually
./create-auth-stories-simple.sh
```

### Link Stories to Epic
```bash
# Link all auth migration stories to epic
./link-auth-stories-to-epic.sh PAC-100
```

### Assign Components
```bash
# Assign components to stories
./assign-auth-components.sh
```

## 📊 Project Structure

### Epic: PAC-100
- **Total Story Points**: 62
- **Timeline**: 8 weeks (4 sprints)
- **Stories**: 22 stories across 4 phases

### Story Ranges
- **PAC-101 to PAC-105**: Foundation & Security (Sprint 1)
- **PAC-201 to PAC-205**: User Migration & RBAC (Sprint 2)
- **PAC-301 to PAC-306**: Application Integration (Sprint 3)
- **PAC-401 to PAC-406**: Production Deployment (Sprint 4)

## ⚙️ Configuration

Scripts assume:
- JIRA project key: `PAC`
- Epic key: `PAC-100`
- Board: PacDoc-v2

Modify scripts if your JIRA configuration differs.

## 🔗 Related Documentation

See `/docs/auth-migration/gcp-auth-migration-jira-spec.md` for complete story specifications.



