#!/usr/bin/env node

/**
 * Fix Firebase import format to match auth:import requirements
 */

import fs from 'fs';

function fixImportFormat() {
  const files = [
    'firebase-employees-import.json',
    'firebase-clients-import.json', 
    'firebase-signers-import.json'
  ];

  files.forEach(filename => {
    try {
      const data = JSON.parse(fs.readFileSync(`/Users/ohalavi/Documents/GitHub2025/pacdocsign/${filename}`, 'utf8'));
      
      // Fix format for Firebase auth:import
      const fixedData = {
        users: data.users.map(user => ({
          localId: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName,
          disabled: user.disabled,
          passwordHash: user.passwordHash,
          salt: '',
          customAttributes: JSON.stringify({
            userType: user.customClaims.userType,
            originalId: user.customClaims.originalId,
            roleID: user.customClaims.roleID,
            companyName: user.customClaims.companyName,
            migrated: true,
            migratedAt: new Date().toISOString()
          })
        }))
      };

      // Save fixed file
      const fixedFilename = filename.replace('.json', '-fixed.json');
      fs.writeFileSync(
        `/Users/ohalavi/Documents/GitHub2025/pacdocsign/${fixedFilename}`,
        JSON.stringify(fixedData, null, 2)
      );
      
      console.log(`✅ Fixed ${filename} → ${fixedFilename} (${fixedData.users.length} users)`);
      
    } catch (error) {
      console.error(`❌ Error fixing ${filename}:`, error.message);
    }
  });

  // Create hash config file
  const hashConfig = {
    hashAlgorithm: 'MD5',
    rounds: 1
  };
  
  fs.writeFileSync(
    '/Users/ohalavi/Documents/GitHub2025/pacdocsign/hash-config.json',
    JSON.stringify(hashConfig, null, 2)
  );
  
  console.log('✅ Created hash-config.json for MD5 import');
}

fixImportFormat();