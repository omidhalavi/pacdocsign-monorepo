#!/bin/bash

# Assign Authentication component to migration stories
echo "📝 Assigning Authentication component to PAC-264 through PAC-285..."
echo ""

# List of authentication migration stories
stories=(
  "PAC-264" "PAC-265" "PAC-266" "PAC-267" "PAC-268"
  "PAC-269" "PAC-270" "PAC-271" "PAC-272" "PAC-273" 
  "PAC-274" "PAC-275" "PAC-276" "PAC-277" "PAC-278" "PAC-279"
  "PAC-280" "PAC-281" "PAC-282" "PAC-283" "PAC-284" "PAC-285"
)

# Since we can't update components directly, let's recreate key stories with components
echo "⚠️ The CLI doesn't support updating components on existing tasks."
echo "📝 We need to either:"
echo "1. Delete and recreate the tasks with --components 'Authentication' --epic 'PAC-286'"
echo "2. Or use Jira web interface to bulk assign components"
echo ""
echo "Let's try the link-tasks-to-epics command first to see if keyword matching works:"