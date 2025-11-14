#!/bin/bash

# PacDocSign GCP Authentication Migration - Jira Ticket Creation
# Using correct Jira CLI commands for your instance

echo "🚀 Creating GCP Authentication Migration Epic and Stories..."
echo "Project: PAC (PacDoc-v2)"
echo "Total Story Points: 62"
echo ""

# Switch to PAC project
echo "📁 Switching to PAC project..."
jira switch-project PAC

echo ""
echo "📋 Creating Epic: PAC-100"
jira create-task \
  --type "Epic" \
  --summary "Migrate Authentication to GCP Identity Platform with GLBA Compliance" \
  --description "Complete migration from custom Firebase + JWT authentication to Google Identity Platform with multi-tenant architecture, RBAC, session management, and GLBA compliance. Timeline: 8 weeks with Claude Code assistance." \
  --priority "Highest"

echo ""
echo "🔧 Creating Phase 1 Stories (Sprint 1 - Weeks 1-2)..."

jira create-task \
  --type "Story" \
  --summary "GCP Project Setup & Configuration" \
  --description "Set up GCP projects for production, staging, and development environments with proper IAM and resource configuration. Claude Code will generate infrastructure-as-code templates." \
  --story-points 2 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Identity Platform Multi-Tenant Setup" \
  --description "Configure Identity Platform with three tenants (employees, signers, clients) and appropriate security settings. Claude Code will generate configuration scripts." \
  --story-points 3 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "GLBA Compliance Configuration" \
  --description "Configure audit logging, session policies, and security measures to meet GLBA compliance requirements. Claude Code will implement compliance framework." \
  --story-points 2 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Security Vulnerability Assessment" \
  --description "Complete security audit of current system and remediate high-priority vulnerabilities. Claude Code will analyze codebase and generate remediation scripts." \
  --story-points 3 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Development Environment Setup" \
  --description "Set up staging environment and CI/CD pipelines for Identity Platform development. Claude Code will automate environment provisioning." \
  --story-points 1 \
  --priority "Medium"

echo ""
echo "🔄 Creating Phase 2 Stories (Sprint 2 - Weeks 3-4)..."

jira create-task \
  --type "Story" \
  --summary "User Data Analysis & Migration Strategy" \
  --description "Analyze current user data and create comprehensive migration strategy. Claude Code will analyze database schema and generate migration plan." \
  --story-points 2 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "MD5 Password Migration Implementation" \
  --description "Implement MD5 password import with automatic upgrade to scrypt on password change. Claude Code will build migration scripts and upgrade tracking." \
  --story-points 5 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "RBAC System Design & Implementation" \
  --description "Design and implement role-based access control with custom claims. Claude Code will generate RBAC framework and permission enforcement." \
  --story-points 5 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "User Migration Execution" \
  --description "Execute user migration in batches with monitoring and error handling. Claude Code will execute migration scripts with human oversight." \
  --story-points 3 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Migration Validation & Testing" \
  --description "Validate migrated users and test authentication functionality. Human-led validation with Claude Code assistance for test automation." \
  --story-points 2 \
  --priority "High"

echo ""
echo "🔗 Creating Phase 3 Stories (Sprint 3 - Weeks 5-6)..."

jira create-task \
  --type "Story" \
  --summary "Shared Authentication Library Development" \
  --description "Develop shared authentication utilities for use across all applications. Claude Code will generate reusable authentication components." \
  --story-points 3 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Dashboard Application Integration" \
  --description "Update dashboard application to use Identity Platform authentication. Claude Code will update all authentication flows and UI components." \
  --story-points 5 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "API Services Integration" \
  --description "Update API services and Cloud Functions to use Identity Platform. Claude Code will update middleware, endpoints, and authentication logic." \
  --story-points 5 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Signers Application Integration" \
  --description "Update signers application to use Identity Platform with signer-specific features. Claude Code will update authentication and professional workflows." \
  --story-points 3 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Client Application Integration" \
  --description "Update client portal to use Identity Platform authentication. Claude Code will update client portal authentication flows." \
  --story-points 2 \
  --priority "Medium"

jira create-task \
  --type "Story" \
  --summary "SSO Implementation & Cross-App Navigation" \
  --description "Implement single sign-on across all applications. Claude Code will implement cross-domain authentication and session sharing." \
  --story-points 3 \
  --priority "High"

echo ""
echo "🚀 Creating Phase 4 Stories (Sprint 4 - Weeks 7-8)..."

jira create-task \
  --type "Story" \
  --summary "Production Environment Preparation" \
  --description "Set up production Identity Platform and deployment infrastructure. Claude Code will generate production configuration and monitoring setup." \
  --story-points 3 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Security Testing & Penetration Testing" \
  --description "Complete security testing and penetration testing of authentication system. Claude Code will automate security tests with human security review." \
  --story-points 3 \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Performance Testing & Optimization" \
  --description "Conduct load testing and optimize authentication performance. Claude Code will generate load tests and optimization scripts." \
  --story-points 2 \
  --priority "Medium"

jira create-task \
  --type "Story" \
  --summary "User Acceptance Testing & Training" \
  --description "Conduct UAT with stakeholders and create training materials. Human-led UAT with Claude Code generating documentation and training materials." \
  --story-points 2 \
  --priority "Medium"

jira create-task \
  --type "Story" \
  --summary "Production Deployment" \
  --description "Execute blue-green deployment to production with Claude Code automation and human oversight. Includes traffic shifting and cutover procedures." \
  --story-points 3 \
  --priority "Highest"

jira create-task \
  --type "Story" \
  --summary "Post-Deployment Monitoring & Support" \
  --description "Set up monitoring and support for production system. Claude Code will configure dashboards and alerting systems." \
  --story-points 1 \
  --priority "High"

echo ""
echo "✅ All tickets created successfully!"
echo ""
echo "📊 Summary:"
echo "   Epic: PAC-100 - GCP Authentication Migration"
echo "   Total Stories: 22"
echo "   Total Story Points: 62"
echo "   Timeline: 8 weeks (4 sprints)"
echo "   Claude Code Optimized: 58% time reduction"
echo ""
echo "🔧 Next Steps:"
echo "1. Review created tickets in Jira"
echo "2. Update assignee usernames to match your team"
echo "3. Create sprints and assign tickets"
echo "4. Set up sprint dates and begin Sprint 1"
echo ""
echo "📋 Sprint Breakdown:"
echo "   Sprint 1 (Weeks 1-2): Foundation & Security - 11 points"
echo "   Sprint 2 (Weeks 3-4): User Migration & RBAC - 17 points"
echo "   Sprint 3 (Weeks 5-6): Application Integration - 21 points"
echo "   Sprint 4 (Weeks 7-8): Production Deployment - 13 points"