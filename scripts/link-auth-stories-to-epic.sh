#!/bin/bash

# Link Authentication Migration Stories to Epic PAC-286
echo "🔗 Linking Authentication Migration Stories to Epic PAC-286"
echo ""

# List of authentication migration stories
stories=(
  "PAC-264"
  "PAC-265" 
  "PAC-266"
  "PAC-267"
  "PAC-268"
  "PAC-269"
  "PAC-270"
  "PAC-271"
  "PAC-272"
  "PAC-273"
  "PAC-274"
  "PAC-275"
  "PAC-276"
  "PAC-277"
  "PAC-278"
  "PAC-279"
  "PAC-280"
  "PAC-281"
  "PAC-282"
  "PAC-283"
  "PAC-284"
  "PAC-285"
)

# Try to link each story to Epic PAC-286
for story in "${stories[@]}"; do
  echo "Linking $story to Epic PAC-286..."
  
  # Method 1: Try updating the story with Epic Link
  result=$(jira update-task --issue "$story" --epic-link "PAC-286" 2>&1)
  
  if [[ $result == *"error"* ]] || [[ $result == *"Error"* ]]; then
    echo "  ❌ Direct linking failed: $result"
    
    # Method 2: Add comment as alternative
    echo "  📝 Adding Epic relationship comment instead..."
    jira add-comment --issue "$story" --comment "🏗️ **Epic Link**: PAC-286 - GCP Authentication Migration with GLBA Compliance"
    
  else
    echo "  ✅ Successfully linked $story to Epic PAC-286"
  fi
done

echo ""
echo "✅ Epic linking process complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Check Jira web interface for Epic PAC-286"
echo "2. Look under 'Issues in Epic' section"
echo "3. If stories don't appear, manually link them via Jira UI:"
echo "   - Edit each story PAC-264 through PAC-285" 
echo "   - Set Epic Link field to 'PAC-286'"
echo "   - Save the story"
echo ""
echo "💡 Alternative: Use Jira Bulk Edit Feature"
echo "1. Search: project = PAC AND key >= PAC-264 AND key <= PAC-285"
echo "2. Select all 22 stories"
echo "3. Bulk Change → Edit Issues → Epic Link → PAC-286"