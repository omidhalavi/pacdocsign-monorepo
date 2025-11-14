#!/bin/bash

# Recreate Authentication Migration Stories with Proper Epic Links
echo "🔄 Recreating PAC-264 through PAC-285 with Epic PAC-286 link..."
echo ""
echo "⚠️  This will recreate the stories with proper Epic links and Authentication components"
echo "⚠️  Make sure to note the new ticket numbers if they change"
echo ""

# Auto-confirming execution

echo ""
echo "🔧 Creating Sprint 1 Stories (Foundation & Security)..."

# PAC-264: GCP Project Setup & Configuration  
jira create-task \
  --summary "GCP Project Setup & Configuration" \
  --description "Set up GCP projects (prod/staging/dev) with proper IAM, enable Identity Platform API, configure service accounts and monitoring. Claude Code: Generate infrastructure-as-code templates. Human: Review and deploy. Estimate: 8 hours" \
  --type "Story" \
  --priority "High" \
  --components "Authentication" \
  --epic "PAC-286" \
  --estimate "8"

# PAC-265: Identity Platform Multi-Tenant Setup
jira create-task \
  --summary "Identity Platform Multi-Tenant Setup" \
  --description "Configure Identity Platform with three tenants (employees, signers, clients) and appropriate security settings. Claude Code: Generate configuration scripts. Human: Review and apply. Estimate: 12 hours" \
  --type "Story" \
  --priority "High" \
  --components "Authentication" \
  --epic "PAC-286" \
  --estimate "12"

# PAC-266: GLBA Compliance Configuration
jira create-task \
  --summary "GLBA Compliance Configuration" \
  --description "Configure audit logging, session policies, and security measures to meet GLBA compliance requirements. Claude Code: Implement compliance framework. Human: Review compliance. Estimate: 8 hours" \
  --type "Story" \
  --priority "High" \
  --components "Authentication" \
  --epic "PAC-286" \
  --estimate "8"

# PAC-267: Security Vulnerability Assessment
jira create-task \
  --summary "Security Vulnerability Assessment" \
  --description "Complete security audit of current system and remediate high-priority vulnerabilities. Claude Code: Analyze codebase and generate remediation scripts. Human: Security review. Estimate: 12 hours" \
  --type "Story" \
  --priority "High" \
  --components "Authentication" \
  --epic "PAC-286" \
  --estimate "12"

# PAC-268: Development Environment Setup
jira create-task \
  --summary "Development Environment Setup" \
  --description "Set up staging environment and CI/CD pipelines for Identity Platform development. Claude Code: Automate environment provisioning. Human: Environment validation. Estimate: 4 hours" \
  --type "Story" \
  --priority "Medium" \
  --components "Authentication" \
  --epic "PAC-286" \
  --estimate "4"

echo ""
echo "✅ Created Sprint 1 stories with Epic PAC-286 links!"
echo ""
echo "📝 Sprint 1 Total: 44 hours"
echo "   - PAC-264: GCP Project Setup (8h)"
echo "   - PAC-265: Identity Platform Setup (12h)" 
echo "   - PAC-266: GLBA Compliance (8h)"
echo "   - PAC-267: Security Assessment (12h)"
echo "   - PAC-268: Dev Environment (4h)"
echo ""
echo "⚠️  NOTE: If the old stories still exist, you may need to delete them manually"
echo "📋 Next: Run this script again to create Sprint 2, 3, and 4 stories"