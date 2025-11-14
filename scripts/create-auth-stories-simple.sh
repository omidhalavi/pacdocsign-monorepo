#!/bin/bash

# Create Authentication Migration Stories (Simplified - No Custom Fields)
echo "🔧 Creating Phase 1 Stories (Sprint 1)..."

echo "Creating: GCP Project Setup & Configuration"
jira create-task \
  --type "Story" \
  --summary "GCP Project Setup & Configuration" \
  --description "Set up GCP projects for production, staging, and development environments with proper IAM and resource configuration. Claude Code will generate infrastructure-as-code templates. Story Points: 2" \
  --priority "High"

echo "Creating: Identity Platform Multi-Tenant Setup"  
jira create-task \
  --type "Story" \
  --summary "Identity Platform Multi-Tenant Setup" \
  --description "Configure Identity Platform with three tenants (employees, signers, clients) and appropriate security settings. Claude Code will generate configuration scripts. Story Points: 3" \
  --priority "High"

echo "Creating: GLBA Compliance Configuration"
jira create-task \
  --type "Story" \
  --summary "GLBA Compliance Configuration" \
  --description "Configure audit logging, session policies, and security measures to meet GLBA compliance requirements. Claude Code will implement compliance framework. Story Points: 2" \
  --priority "High"

echo "Creating: Security Vulnerability Assessment"
jira create-task \
  --type "Story" \
  --summary "Security Vulnerability Assessment" \
  --description "Complete security audit of current system and remediate high-priority vulnerabilities. Claude Code will analyze codebase and generate remediation scripts. Story Points: 3" \
  --priority "High"

echo "Creating: Development Environment Setup"
jira create-task \
  --type "Story" \
  --summary "Development Environment Setup" \
  --description "Set up staging environment and CI/CD pipelines for Identity Platform development. Claude Code will automate environment provisioning. Story Points: 1" \
  --priority "Medium"

echo ""
echo "🔄 Creating Phase 2 Stories (Sprint 2)..."

echo "Creating: User Data Analysis & Migration Strategy"
jira create-task \
  --type "Story" \
  --summary "User Data Analysis & Migration Strategy" \
  --description "Analyze current user data and create comprehensive migration strategy. Claude Code will analyze database schema and generate migration plan. Story Points: 2" \
  --priority "High"

echo "Creating: MD5 Password Migration Implementation"
jira create-task \
  --type "Story" \
  --summary "MD5 Password Migration Implementation" \
  --description "Implement MD5 password import with automatic upgrade to scrypt on password change. Claude Code will build migration scripts and upgrade tracking. Story Points: 5" \
  --priority "High"

echo "Creating: RBAC System Design & Implementation"
jira create-task \
  --type "Story" \
  --summary "RBAC System Design & Implementation" \
  --description "Design and implement role-based access control with custom claims. Claude Code will generate RBAC framework and permission enforcement. Story Points: 5" \
  --priority "High"

echo "Creating: User Migration Execution"
jira create-task \
  --type "Story" \
  --summary "User Migration Execution" \
  --description "Execute user migration in batches with monitoring and error handling. Claude Code will execute migration scripts with human oversight. Story Points: 3" \
  --priority "High"

echo "Creating: Migration Validation & Testing"
jira create-task \
  --type "Story" \
  --summary "Migration Validation & Testing" \
  --description "Validate migrated users and test authentication functionality. Human-led validation with Claude Code assistance for test automation. Story Points: 2" \
  --priority "High"

echo ""
echo "🔗 Creating Phase 3 Stories (Sprint 3)..."

echo "Creating: Shared Authentication Library Development"
jira create-task \
  --type "Story" \
  --summary "Shared Authentication Library Development" \
  --description "Develop shared authentication utilities for use across all applications. Claude Code will generate reusable authentication components. Story Points: 3" \
  --priority "High"

echo "Creating: Dashboard Application Integration"
jira create-task \
  --type "Story" \
  --summary "Dashboard Application Integration" \
  --description "Update dashboard application to use Identity Platform authentication. Claude Code will update all authentication flows and UI components. Story Points: 5" \
  --priority "High"

echo "Creating: API Services Integration"
jira create-task \
  --type "Story" \
  --summary "API Services Integration" \
  --description "Update API services and Cloud Functions to use Identity Platform. Claude Code will update middleware, endpoints, and authentication logic. Story Points: 5" \
  --priority "High"

echo "Creating: Signers Application Integration"
jira create-task \
  --type "Story" \
  --summary "Signers Application Integration" \
  --description "Update signers application to use Identity Platform with signer-specific features. Claude Code will update authentication and professional workflows. Story Points: 3" \
  --priority "High"

echo "Creating: Client Application Integration"
jira create-task \
  --type "Story" \
  --summary "Client Application Integration" \
  --description "Update client portal to use Identity Platform authentication. Claude Code will update client portal authentication flows. Story Points: 2" \
  --priority "Medium"

echo "Creating: SSO Implementation & Cross-App Navigation"
jira create-task \
  --type "Story" \
  --summary "SSO Implementation & Cross-App Navigation" \
  --description "Implement single sign-on across all applications. Claude Code will implement cross-domain authentication and session sharing. Story Points: 3" \
  --priority "High"

echo ""
echo "🚀 Creating Phase 4 Stories (Sprint 4)..."

echo "Creating: Production Environment Preparation"
jira create-task \
  --type "Story" \
  --summary "Production Environment Preparation" \
  --description "Set up production Identity Platform and deployment infrastructure. Claude Code will generate production configuration and monitoring setup. Story Points: 3" \
  --priority "High"

echo "Creating: Security Testing & Penetration Testing"
jira create-task \
  --type "Story" \
  --summary "Security Testing & Penetration Testing" \
  --description "Complete security testing and penetration testing of authentication system. Claude Code will automate security tests with human security review. Story Points: 3" \
  --priority "High"

echo "Creating: Performance Testing & Optimization"
jira create-task \
  --type "Story" \
  --summary "Performance Testing & Optimization" \
  --description "Conduct load testing and optimize authentication performance. Claude Code will generate load tests and optimization scripts. Story Points: 2" \
  --priority "Medium"

echo "Creating: User Acceptance Testing & Training"
jira create-task \
  --type "Story" \
  --summary "User Acceptance Testing & Training" \
  --description "Conduct UAT with stakeholders and create training materials. Human-led UAT with Claude Code generating documentation and training materials. Story Points: 2" \
  --priority "Medium"

echo "Creating: Production Deployment"
jira create-task \
  --type "Story" \
  --summary "Production Deployment" \
  --description "Execute blue-green deployment to production with Claude Code automation and human oversight. Includes traffic shifting and cutover procedures. Story Points: 3" \
  --priority "Highest"

echo "Creating: Post-Deployment Monitoring & Support"
jira create-task \
  --type "Story" \
  --summary "Post-Deployment Monitoring & Support" \
  --description "Set up monitoring and support for production system. Claude Code will configure dashboards and alerting systems. Story Points: 1" \
  --priority "High"

echo ""
echo "✅ All 22 stories created!"
echo ""
echo "📊 Summary:"
echo "   Epic: DMPA-108 - GCP Authentication Migration"
echo "   Total Stories: 22 (DMPA-109 through DMPA-130)"
echo "   Total Story Points: 62 (included in descriptions)"
echo "   Timeline: 8 weeks (4 sprints of 2 weeks each)"
echo ""
echo "🎯 Next Steps:"
echo "1. Review all tickets in Jira"
echo "2. Manually update story points in each ticket"
echo "3. Create 4 sprints (2 weeks each)"
echo "4. Assign tickets to appropriate sprints"
echo "5. Assign team members to tickets"
echo "6. Link stories to Epic DMPA-108"