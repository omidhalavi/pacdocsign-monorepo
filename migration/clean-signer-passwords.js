#!/usr/bin/env node

/**
 * Clean signer passwords - remove invalid password hashes
 */

import fs from 'fs';

function cleanSignerPasswords() {
  try {
    const data = JSON.parse(fs.readFileSync('/Users/ohalavi/Documents/GitHub2025/pacdocsign/firebase-signers-import-fixed.json', 'utf8'));
    
    console.log(`🔍 Original signers: ${data.users.length}`);
    
    // Filter out users with invalid password hashes
    const validUsers = data.users.filter(user => {
      const hash = user.passwordHash;
      
      // Check if it's a valid MD5 hash (32 hex characters)
      const isValidMD5 = /^[a-f0-9]{32}$/i.test(hash);
      
      if (!isValidMD5) {
        console.log(`❌ Invalid hash for ${user.email}: "${hash}"`);
        return false;
      }
      
      return true;
    });
    
    console.log(`✅ Valid signers: ${validUsers.length}`);
    console.log(`🗑️  Filtered out: ${data.users.length - validUsers.length} users with invalid passwords`);
    
    // Create cleaned data
    const cleanedData = {
      users: validUsers
    };
    
    // Save cleaned file
    fs.writeFileSync(
      '/Users/ohalavi/Documents/GitHub2025/pacdocsign/firebase-signers-import-cleaned.json',
      JSON.stringify(cleanedData, null, 2)
    );
    
    console.log('💾 Saved: firebase-signers-import-cleaned.json');
    
    return {
      original: data.users.length,
      valid: validUsers.length,
      filtered: data.users.length - validUsers.length
    };
    
  } catch (error) {
    console.error('❌ Error cleaning signer passwords:', error.message);
    throw error;
  }
}

cleanSignerPasswords();