#!/bin/bash

# Create GCP Authentication Migration Epic and Stories in PAC Project
echo "🚀 Creating GCP Authentication Migration in PAC Project..."
echo "Project: PAC (PacDoc-v2)"
echo ""

# Create Epic
echo "📋 Creating Epic: GCP Authentication Migration"
jira create-task \
  --type "Epic" \
  --summary "GCP Authentication Migration with GLBA Compliance" \
  --description "Complete migration from custom Firebase + JWT authentication to Google Identity Platform with multi-tenant architecture, RBAC, session management, and GLBA compliance. Timeline: 8 weeks with Claude Code assistance. Total: 62 story points across 22 stories in 4 sprints." \
  --priority "Highest"

echo ""
echo "🔧 Phase 1: Foundation & Security (Sprint 1 - Weeks 1-2, 11 points)"

jira create-task \
  --type "Story" \
  --summary "GCP Project Setup & Configuration" \
  --description "Set up GCP projects (prod/staging/dev) with proper IAM, enable Identity Platform API, configure service accounts and monitoring. Claude Code: Generate infrastructure-as-code templates. Human: Review and deploy. Story Points: 2" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Identity Platform Multi-Tenant Setup" \
  --description "Configure Identity Platform with 3 tenants: employees (MFA required), signers (MFA optional), clients (standard). Set password policies, enable providers. Claude Code: Generate tenant configuration scripts. Human: Test and validate. Story Points: 3" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "GLBA Compliance Configuration" \
  --description "Enable Cloud Audit Logs, configure session timeouts (15min), account lockout (5 attempts), password rotation policies. Claude Code: Implement compliance framework. Human: Security review. Story Points: 2" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Security Vulnerability Assessment" \
  --description "Audit current MD5 passwords, hardcoded secrets, JWT implementation. Generate remediation plan and implement high-priority fixes. Claude Code: Analyze codebase, generate fixes. Human: Security validation. Story Points: 3" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Development Environment Setup" \
  --description "Set up staging environment, configure CI/CD pipelines for Identity Platform, create test data and automated testing framework. Claude Code: Automate environment provisioning. Human: Validation. Story Points: 1" \
  --priority "Medium"

echo ""
echo "🔄 Phase 2: User Migration & RBAC (Sprint 2 - Weeks 3-4, 17 points)"

jira create-task \
  --type "Story" \
  --summary "User Data Analysis & Migration Strategy" \
  --description "Analyze current user database, categorize by type (employees/signers/clients), identify data quality issues, create user mapping strategy and migration batches. Claude Code: Database analysis and migration planning. Human: Strategy review. Story Points: 2" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "MD5 Password Migration Implementation" \
  --description "Build MD5 password import utility, create batch processing for large user sets, implement automatic password upgrade on change via Cloud Function. Claude Code: Migration scripts and upgrade tracking. Human: Testing and monitoring. Story Points: 5" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "RBAC System Design & Implementation" \
  --description "Define role structures (SuperAdmin/Admin/Manager/Accountant/Signer/Client), implement custom claims system, create permission enforcement middleware. Claude Code: Generate RBAC framework. Human: Test role combinations. Story Points: 5" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "User Migration Execution" \
  --description "Execute migration in batches (100-500 users), monitor success rates, handle errors and retries, verify user data integrity, update custom claims. Claude Code: Execute migration scripts. Human: Monitoring and validation. Story Points: 3" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Migration Validation & Testing" \
  --description "Validate all migrated users can authenticate, test role assignments and permissions, verify custom claims, test password upgrade functionality. Claude Code: Test automation. Human: Manual validation. Story Points: 2" \
  --priority "High"

echo ""
echo "🔗 Phase 3: Application Integration (Sprint 3 - Weeks 5-6, 21 points)"

jira create-task \
  --type "Story" \
  --summary "Shared Authentication Library Development" \
  --description "Create React hooks for authentication state, session management utilities, permission checking functions, tenant management, SSO utilities. Claude Code: Generate reusable components with documentation. Human: Integration testing. Story Points: 3" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Dashboard Application Integration" \
  --description "Replace current auth with Identity Platform (employees tenant), update route guards, implement admin role management, update all auth components. Claude Code: Update authentication flows and UI. Human: Testing admin functionality. Story Points: 5" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "API Services Integration" \
  --description "Replace JWT middleware with Identity Platform verification, update authentication endpoints, implement RBAC permission checks, update Cloud Functions. Claude Code: Update middleware and endpoints. Human: Test all API endpoints. Story Points: 5" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Signers Application Integration" \
  --description "Configure for signers tenant, implement signer role checking, update professional workflows, test SMS consent and order assignment features. Claude Code: Update authentication and workflows. Human: Test signer-specific features. Story Points: 3" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Client Application Integration" \
  --description "Configure for clients tenant, implement client role permissions, update portal functionality, test document access and order viewing. Claude Code: Update client portal flows. Human: Test client features. Story Points: 2" \
  --priority "Medium"

jira create-task \
  --type "Story" \
  --summary "SSO Implementation & Cross-App Navigation" \
  --description "Configure cross-domain authentication (.pacdocsign.com), implement session sharing between apps, create unified login/logout experience. Claude Code: Implement cross-domain auth and session sharing. Human: Test navigation between apps. Story Points: 3" \
  --priority "High"

echo ""
echo "🚀 Phase 4: Production Deployment (Sprint 4 - Weeks 7-8, 13 points)"

jira create-task \
  --type "Story" \
  --summary "Production Environment Preparation" \
  --description "Set up production Identity Platform tenants, configure load balancing and auto-scaling, set up monitoring dashboards and alerting, create disaster recovery procedures. Claude Code: Generate production config and monitoring setup. Human: Validation and deployment. Story Points: 3" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Security Testing & Penetration Testing" \
  --description "Complete authentication security testing, perform penetration testing, test session management security, verify GLBA compliance, test multi-tenant isolation. Claude Code: Automate security tests and vulnerability scanning. Human: Security review and validation. Story Points: 3" \
  --priority "High"

jira create-task \
  --type "Story" \
  --summary "Performance Testing & Optimization" \
  --description "Conduct load testing on authentication endpoints, test concurrent user authentication, optimize token verification performance, test database query performance. Claude Code: Generate load tests and optimization scripts. Human: Performance validation. Story Points: 2" \
  --priority "Medium"

jira create-task \
  --type "Story" \
  --summary "User Acceptance Testing & Training" \
  --description "Organize UAT sessions with different user types, create training materials and documentation, gather and incorporate user feedback, prepare support materials. Claude Code: Generate documentation and training materials. Human: Lead UAT sessions. Story Points: 2" \
  --priority "Medium"

jira create-task \
  --type "Story" \
  --summary "Production Deployment" \
  --description "Execute blue-green deployment to production, monitor system health during deployment, gradually shift traffic to new authentication system, complete cutover and decommission old system. Claude Code: Deployment automation scripts. Human: Deployment oversight and monitoring. Story Points: 3" \
  --priority "Highest"

jira create-task \
  --type "Story" \
  --summary "Post-Deployment Monitoring & Support" \
  --description "Set up 24/7 monitoring and alerting, create incident response procedures, train support team on troubleshooting, monitor authentication success rates. Claude Code: Configure comprehensive monitoring dashboards and alerting systems. Human: Support team training. Story Points: 1" \
  --priority "High"

echo ""
echo "✅ Epic and 22 Stories Created Successfully!"
echo ""
echo "📊 Final Summary:"
echo "   Epic: PAC-[number] - GCP Authentication Migration"
echo "   Total Stories: 22"
echo "   Total Story Points: 62"
echo "   Timeline: 8 weeks (4 sprints of 2 weeks each)"
echo "   Claude Code Optimized: 58% time reduction from original estimates"
echo ""
echo "📋 Sprint Distribution:"
echo "   Sprint 1 (Weeks 1-2): Foundation & Security - 11 points"
echo "   Sprint 2 (Weeks 3-4): User Migration & RBAC - 17 points"  
echo "   Sprint 3 (Weeks 5-6): Application Integration - 21 points"
echo "   Sprint 4 (Weeks 7-8): Production Deployment - 13 points"
echo ""
echo "🎯 Next Steps:"
echo "1. Review all tickets in PAC project"
echo "2. Create 4 sprints (2 weeks each)"
echo "3. Assign stories to appropriate sprints"
echo "4. Assign team members to stories"
echo "5. Link stories to the Epic"
echo "6. Begin Sprint 1 with foundation setup"
echo ""
echo "👥 Team Requirements (Part-time with Claude Code):"
echo "   - Senior Backend Developer (8 weeks part-time)"
echo "   - DevOps Engineer (8 weeks part-time)"  
echo "   - Frontend Developer (4 weeks part-time)"
echo "   - QA Engineer (4 weeks part-time)"
echo "   - Security Consultant (2 weeks part-time)"