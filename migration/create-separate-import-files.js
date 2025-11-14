#!/usr/bin/env node

/**
 * Create separate Firebase import files for each user type
 * Reads the main extraction file and creates individual files for employees, clients, and signers
 */

import fs from 'fs';

function createSeparateImportFiles() {
  try {
    // Read the main extraction data
    const extractionData = JSON.parse(
      fs.readFileSync('/Users/ohalavi/Documents/GitHub2025/pacdocsign/user-extraction-data.json', 'utf8')
    );

    const { employees, clients, signers } = extractionData.rawData;
    
    console.log('📊 Creating separate import files...');
    console.log(`   👥 Employees: ${employees.length}`);
    console.log(`   🏢 Clients: ${clients.length}`);  
    console.log(`   ✍️  Signers: ${signers.length}`);

    // Create Firebase import format for each user type
    function createFirebaseImport(users, userType) {
      return {
        users: users
          .filter(user => user.password && user.password.length > 0)
          .map(user => ({
            uid: user.uid,
            email: user.firebaseEmail,
            emailVerified: false,
            displayName: user.displayName || null,
            disabled: false,
            metadata: {
              creationTime: new Date().toISOString(),
              lastSignInTime: null
            },
            customClaims: {
              userType: user.userType,
              originalId: user.userType === 'employee' ? user.id : (user.Id || user.signer_id),
              roleID: user.roleID || null,
              companyName: user.company_name || null,
              migrated: true,
              migratedAt: new Date().toISOString()
            },
            passwordHash: user.password, // MD5 hash
            passwordSalt: '', // No salt used
            providerData: [{
              uid: user.firebaseEmail,
              email: user.firebaseEmail,
              providerId: 'password'
            }]
          })),
        hashConfig: {
          algorithm: 'MD5',
          rounds: 1,
          memoryCost: null,
          saltSeparator: null,
          signerKey: null
        }
      };
    }

    // Create separate files
    const employeeImport = createFirebaseImport(employees, 'employee');
    const clientImport = createFirebaseImport(clients, 'client');  
    const signerImport = createFirebaseImport(signers, 'signer');

    // Save files
    fs.writeFileSync(
      '/Users/ohalavi/Documents/GitHub2025/pacdocsign/firebase-employees-import.json',
      JSON.stringify(employeeImport, null, 2)
    );

    fs.writeFileSync(
      '/Users/ohalavi/Documents/GitHub2025/pacdocsign/firebase-clients-import.json', 
      JSON.stringify(clientImport, null, 2)
    );

    fs.writeFileSync(
      '/Users/ohalavi/Documents/GitHub2025/pacdocsign/firebase-signers-import.json',
      JSON.stringify(signerImport, null, 2)
    );

    // Create summary file
    const summary = {
      created: new Date().toISOString(),
      files: {
        employees: {
          file: 'firebase-employees-import.json',
          totalUsers: employees.length,
          usersWithPasswords: employeeImport.users.length,
          project: 'pacdoc-employees'
        },
        clients: {
          file: 'firebase-clients-import.json', 
          totalUsers: clients.length,
          usersWithPasswords: clientImport.users.length,
          project: 'pacdoc-clients'
        },
        signers: {
          file: 'firebase-signers-import.json',
          totalUsers: signers.length, 
          usersWithPasswords: signerImport.users.length,
          project: 'pacdoc-signers'
        }
      },
      totalOriginalUsers: employees.length + clients.length + signers.length,
      totalImportableUsers: employeeImport.users.length + clientImport.users.length + signerImport.users.length
    };

    fs.writeFileSync(
      '/Users/ohalavi/Documents/GitHub2025/pacdocsign/import-files-summary.json',
      JSON.stringify(summary, null, 2)
    );

    console.log('💾 Files created:');
    console.log(`   📄 firebase-employees-import.json (${employeeImport.users.length} users with passwords)`);
    console.log(`   📄 firebase-clients-import.json (${clientImport.users.length} users with passwords)`); 
    console.log(`   📄 firebase-signers-import.json (${signerImport.users.length} users with passwords)`);
    console.log(`   📄 import-files-summary.json`);
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Total Original Users: ${summary.totalOriginalUsers.toLocaleString()}`);
    console.log(`   Total Importable Users: ${summary.totalImportableUsers.toLocaleString()}`);
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Create separate Firebase projects for each user type');
    console.log('   2. Import users to respective Firebase Auth instances');
    console.log('   3. Update application configs to use appropriate projects');

    return summary;
    
  } catch (error) {
    console.error('❌ Error creating import files:', error.message);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createSeparateImportFiles()
    .then(() => {
      console.log('✅ Separate import files created successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create import files:', error);
      process.exit(1);
    });
}

export { createSeparateImportFiles };