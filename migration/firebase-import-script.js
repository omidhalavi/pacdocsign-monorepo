#!/usr/bin/env node

/**
 * Firebase User Import Script
 * Imports users extracted from MySQL into Firebase Authentication
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // You'll need to download your service account key and update this path
    const serviceAccountPath = '/Users/ohalavi/Documents/GitHub2025/pacdocsign/service-account-key.json';
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account key not found at: ${serviceAccountPath}`);
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    initializeApp({
      credential: cert(serviceAccount),
      // Update with your project ID
      projectId: serviceAccount.project_id
    });
    
    console.log('🔥 Firebase Admin SDK initialized');
    return getAuth();
    
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    throw error;
  }
}

/**
 * Import users to Firebase Authentication
 */
async function importUsersToFirebase() {
  try {
    console.log('🚀 Starting Firebase user import...');
    
    // Initialize Firebase
    const auth = initializeFirebase();
    
    // Load extracted user data
    const importDataPath = '/Users/ohalavi/Documents/GitHub2025/pacdocsign/firebase-import-users.json';
    
    if (!fs.existsSync(importDataPath)) {
      throw new Error('Import data not found. Run mysql-user-extraction.js first.');
    }
    
    const importData = JSON.parse(fs.readFileSync(importDataPath, 'utf8'));
    const { users, hashConfig } = importData;
    
    console.log(`📊 Found ${users.length} users to import`);
    
    if (users.length === 0) {
      console.log('ℹ️  No users to import');
      return;
    }
    
    // Validate users before import
    const validUsers = validateUsers(users);
    console.log(`✅ ${validUsers.length} users validated for import`);
    
    // Import users in batches (Firebase limit: 1000 per batch)
    const batchSize = 1000;
    const batches = chunkArray(validUsers, batchSize);
    let totalImported = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} users)...`);
      
      try {
        const result = await auth.importUsers(batch, {
          hash: {
            algorithm: hashConfig.algorithm,
            rounds: hashConfig.rounds
          }
        });
        
        totalImported += result.successCount;
        totalErrors += result.failureCount;
        
        console.log(`   ✅ Successfully imported: ${result.successCount}`);
        
        if (result.failureCount > 0) {
          console.log(`   ❌ Failed imports: ${result.failureCount}`);
          
          // Log detailed errors
          result.errors.forEach((error, index) => {
            const user = batch[error.index];
            console.log(`      - ${user.email}: ${error.error.message}`);
          });
        }
        
      } catch (error) {
        console.error(`❌ Batch ${i + 1} failed:`, error.message);
        totalErrors += batch.length;
      }
    }
    
    // Summary
    console.log('\n📈 Import Summary:');
    console.log(`   ✅ Successfully imported: ${totalImported} users`);
    console.log(`   ❌ Failed imports: ${totalErrors} users`);
    console.log(`   📊 Total processed: ${totalImported + totalErrors} users`);
    
    // Generate import report
    const report = {
      importedAt: new Date().toISOString(),
      totalUsers: users.length,
      validUsers: validUsers.length,
      successfulImports: totalImported,
      failedImports: totalErrors,
      batches: batches.length,
      hashAlgorithm: hashConfig.algorithm
    };
    
    fs.writeFileSync(
      '/Users/ohalavi/Documents/GitHub2025/pacdocsign/firebase-import-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n💾 Import report saved to: firebase-import-report.json');
    
    if (totalImported > 0) {
      console.log('\n🎉 Firebase import completed successfully!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Test login with sample users');
      console.log('   2. Update frontend apps to use new email format');
      console.log('   3. Deploy updated authentication system');
    }
    
    return report;
    
  } catch (error) {
    console.error('💥 Firebase import failed:', error.message);
    throw error;
  }
}

/**
 * Validate users before import
 */
function validateUsers(users) {
  const validUsers = [];
  const invalidUsers = [];
  
  users.forEach(user => {
    const errors = [];
    
    // Validate required fields
    if (!user.uid) errors.push('Missing UID');
    if (!user.email) errors.push('Missing email');
    if (!isValidEmail(user.email)) errors.push('Invalid email format');
    if (!user.passwordHash) errors.push('Missing password hash');
    
    // Validate UID format
    if (user.uid && (user.uid.length < 1 || user.uid.length > 128)) {
      errors.push('Invalid UID length');
    }
    
    if (errors.length === 0) {
      validUsers.push({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified || false,
        displayName: user.displayName || null,
        disabled: user.disabled || false,
        passwordHash: Buffer.from(user.passwordHash, 'hex'),
        passwordSalt: user.passwordSalt ? Buffer.from(user.passwordSalt, 'hex') : Buffer.from(''),
        customClaims: user.customClaims || {},
        providerData: user.providerData || []
      });
    } else {
      invalidUsers.push({
        user: user.email || user.uid || 'Unknown',
        errors
      });
    }
  });
  
  if (invalidUsers.length > 0) {
    console.log(`\n⚠️  Found ${invalidUsers.length} invalid users:`);
    invalidUsers.forEach(({ user, errors }) => {
      console.log(`   - ${user}: ${errors.join(', ')}`);
    });
  }
  
  return validUsers;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Split array into chunks
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Test individual user login
 */
async function testUserLogin(email, password) {
  try {
    console.log(`🧪 Testing login for: ${email}`);
    
    // This would be done from your frontend app
    console.log('ℹ️  Login testing should be done from your frontend application');
    console.log('   Use Firebase Auth SDK: signInWithEmailAndPassword()');
    
    return true;
    
  } catch (error) {
    console.error(`❌ Login test failed for ${email}:`, error.message);
    return false;
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importUsersToFirebase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import script failed:', error);
      process.exit(1);
    });
}

export { importUsersToFirebase, testUserLogin };