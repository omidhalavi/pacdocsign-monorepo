#!/bin/bash

# JIRA CLI Commands for GCP Authentication Migration Epic
# Prerequisites: 
# 1. Install JIRA CLI: npm install -g jira-cli
# 2. Configure JIRA CLI with your credentials: jira config
# 3. Set PROJECT_KEY variable to your actual project key

PROJECT_KEY="PAC"
EPIC_KEY="${PROJECT_KEY}-100"

echo "Creating GCP Authentication Migration Epic and Stories..."

# Create Epic
echo "Creating Epic: ${EPIC_KEY}"
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Epic" \
  --summary="Migrate Authentication to GCP Identity Platform with GLBA Compliance" \
  --description="Complete migration from custom Firebase + JWT authentication to Google Identity Platform with multi-tenant architecture, RBAC, session management, and GLBA compliance. This initiative leverages Claude Code for implementation to reduce development time by 58%." \
  --priority="High" \
  --labels="gcp,authentication,security,glba,claude-code" \
  --epic-name="GCP Auth Migration"

echo "Epic created: ${EPIC_KEY}"
echo ""

# Phase 1 Stories (Sprint 1)
echo "Creating Phase 1 Stories (Sprint 1)..."

# PAC-101
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="GCP Project Setup & Configuration" \
  --description="Set up GCP project infrastructure and base configuration for Identity Platform migration." \
  --priority="Highest" \
  --labels="gcp,setup,claude-code" \
  --story-points="2" \
  --assignee="devops.engineer" \
  --epic-link="$EPIC_KEY"

# PAC-102
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Identity Platform Multi-Tenant Setup" \
  --description="Configure multi-tenant architecture in GCP Identity Platform for organization segregation." \
  --priority="High" \
  --labels="gcp,identity-platform,multi-tenant,claude-code" \
  --story-points="3" \
  --assignee="senior.backend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-103
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="GLBA Compliance Configuration" \
  --description="Implement GLBA compliance requirements including audit logging and security policies." \
  --priority="Highest" \
  --labels="security,glba,compliance,claude-code" \
  --story-points="2" \
  --assignee="security.consultant" \
  --epic-link="$EPIC_KEY"

# PAC-104
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Security Vulnerability Assessment" \
  --description="Conduct comprehensive security assessment of current authentication system and new GCP setup." \
  --priority="High" \
  --labels="security,vulnerability,assessment,claude-code" \
  --story-points="3" \
  --assignee="security.consultant" \
  --epic-link="$EPIC_KEY"

# PAC-105
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Development Environment Setup" \
  --description="Automate development environment setup for authentication migration." \
  --priority="Medium" \
  --labels="development,environment,claude-code" \
  --story-points="1" \
  --assignee="devops.engineer" \
  --epic-link="$EPIC_KEY"

echo "Phase 1 stories created."
echo ""

# Phase 2 Stories (Sprint 2)
echo "Creating Phase 2 Stories (Sprint 2)..."

# PAC-201
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="User Data Analysis & Migration Strategy" \
  --description="Analyze existing user data and develop comprehensive migration strategy." \
  --priority="High" \
  --labels="migration,analysis,strategy,claude-code" \
  --story-points="2" \
  --assignee="senior.backend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-202
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="MD5 Password Migration Implementation" \
  --description="Implement secure migration of MD5 hashed passwords to GCP Identity Platform." \
  --priority="High" \
  --labels="migration,passwords,md5,claude-code" \
  --story-points="5" \
  --assignee="senior.backend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-203
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="RBAC System Design & Implementation" \
  --description="Design and implement Role-Based Access Control system integrated with GCP Identity Platform." \
  --priority="High" \
  --labels="rbac,authorization,design,claude-code" \
  --story-points="5" \
  --assignee="senior.backend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-204
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="User Migration Execution" \
  --description="Execute user data migration to GCP Identity Platform with monitoring." \
  --priority="High" \
  --labels="migration,execution,claude-code" \
  --story-points="3" \
  --assignee="senior.backend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-205
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Migration Validation & Testing" \
  --description="Comprehensive validation and testing of migrated user data and authentication flow." \
  --priority="High" \
  --labels="testing,validation,migration" \
  --story-points="2" \
  --assignee="qa.engineer" \
  --epic-link="$EPIC_KEY"

echo "Phase 2 stories created."
echo ""

# Phase 3 Stories (Sprint 3)
echo "Creating Phase 3 Stories (Sprint 3)..."

# PAC-301
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Shared Authentication Library Development" \
  --description="Develop shared authentication library for consistent integration across all applications." \
  --priority="Medium" \
  --labels="library,authentication,shared,claude-code" \
  --story-points="3" \
  --assignee="senior.backend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-302
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Dashboard Application Integration" \
  --description="Integrate GCP Identity Platform authentication into the Dashboard application." \
  --priority="Medium" \
  --labels="dashboard,integration,claude-code" \
  --story-points="5" \
  --assignee="frontend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-303
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="API Services Integration" \
  --description="Update API services to use GCP Identity Platform for authentication and authorization." \
  --priority="Medium" \
  --labels="api,services,integration,claude-code" \
  --story-points="5" \
  --assignee="senior.backend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-304
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Signers Application Integration" \
  --description="Integrate Signers application with new authentication system." \
  --priority="Medium" \
  --labels="signers,integration,claude-code" \
  --story-points="3" \
  --assignee="frontend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-305
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Client Application Integration" \
  --description="Update client application to use new authentication system." \
  --priority="Medium" \
  --labels="client,integration,claude-code" \
  --story-points="2" \
  --assignee="frontend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-306
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="SSO Implementation" \
  --description="Implement Single Sign-On across all applications using GCP Identity Platform." \
  --priority="Medium" \
  --labels="sso,single-sign-on,claude-code" \
  --story-points="3" \
  --assignee="senior.backend.developer" \
  --epic-link="$EPIC_KEY"

echo "Phase 3 stories created."
echo ""

# Phase 4 Stories (Sprint 4)
echo "Creating Phase 4 Stories (Sprint 4)..."

# PAC-401
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Production Environment Preparation" \
  --description="Prepare production environment for authentication system deployment." \
  --priority="Highest" \
  --labels="production,deployment,claude-code" \
  --story-points="3" \
  --assignee="devops.engineer" \
  --epic-link="$EPIC_KEY"

# PAC-402
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Security Testing & Penetration Testing" \
  --description="Conduct comprehensive security testing and penetration testing of the new authentication system." \
  --priority="Highest" \
  --labels="security,penetration-testing,claude-code" \
  --story-points="3" \
  --assignee="security.consultant" \
  --epic-link="$EPIC_KEY"

# PAC-403
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Performance Testing & Optimization" \
  --description="Conduct performance testing and optimization of authentication flows." \
  --priority="High" \
  --labels="performance,testing,optimization,claude-code" \
  --story-points="2" \
  --assignee="senior.backend.developer" \
  --epic-link="$EPIC_KEY"

# PAC-404
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="User Acceptance Testing" \
  --description="Conduct comprehensive User Acceptance Testing with stakeholders." \
  --priority="High" \
  --labels="uat,testing,acceptance" \
  --story-points="2" \
  --assignee="qa.engineer" \
  --epic-link="$EPIC_KEY"

# PAC-405
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Production Deployment" \
  --description="Execute production deployment of new authentication system with blue-green deployment strategy." \
  --priority="Highest" \
  --labels="deployment,production,claude-code" \
  --story-points="3" \
  --assignee="devops.engineer" \
  --epic-link="$EPIC_KEY"

# PAC-406
jira create issue \
  --project="$PROJECT_KEY" \
  --type="Story" \
  --summary="Post-Deployment Monitoring" \
  --description="Implement comprehensive monitoring and alerting for production authentication system." \
  --priority="Medium" \
  --labels="monitoring,post-deployment,claude-code" \
  --story-points="1" \
  --assignee="devops.engineer" \
  --epic-link="$EPIC_KEY"

echo "Phase 4 stories created."
echo ""

echo "All tickets created successfully!"
echo "Epic: ${EPIC_KEY}"
echo "Total Story Points: 62"
echo "Please update assignee usernames to match your JIRA instance."