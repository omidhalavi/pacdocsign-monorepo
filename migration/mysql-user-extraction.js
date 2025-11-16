#!/usr/bin/env node

/**
 * MySQL User Extraction Script for Firebase Migration
 * Extracts employees, contacts (signers), and any client users for Firebase import
 */

import mysql2 from 'mysql2/promise';
import fs from 'fs';
import crypto from 'crypto';

// Database configuration - PRODUCTION
const dbConfig = {
  host: "34.94.89.132",
  user: "app", 
  password: "5p8j7wNDekJjxrDz",
  database: "xml2db",
  connectionLimit: 10
};

/**
 * Extract all user data for Firebase migration
 */
async function extractUsersForFirebase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL database...');
    connection = await mysql2.createConnection(dbConfig);
    
    console.log('📊 Extracting user data...');
    
    // Extract employees
    const employees = await extractEmployees(connection);
    console.log(`   ✅ Found ${employees.length} employees`);
    
    // Extract clients (from contacts table)
    const clients = await extractClients(connection);
    console.log(`   ✅ Found ${clients.length} clients`);
    
    // Extract signers (from signers table)  
    const signers = await extractSigners(connection);
    console.log(`   ✅ Found ${signers.length} signers`);
    
    // Generate Firebase import data
    const firebaseUsers = generateFirebaseImportData({
      employees,
      clients,
      signers
    });
    
    // Save extraction results
    const extractionData = {
      metadata: {
        extractedAt: new Date().toISOString(),
        totalUsers: employees.length + clients.length + signers.length,
        employees: employees.length,
        clients: clients.length,
        signers: signers.length
      },
      rawData: { employees, clients, signers },
      firebaseImport: firebaseUsers
    };
    
    // Save to JSON files
    fs.writeFileSync(
      '/Users/ohalavi/Documents/GitHub2025/pacdocsign/user-extraction-data.json', 
      JSON.stringify(extractionData, null, 2)
    );
    
    fs.writeFileSync(
      '/Users/ohalavi/Documents/GitHub2025/pacdocsign/firebase-import-users.json',
      JSON.stringify(firebaseUsers, null, 2)
    );
    
    console.log('💾 Data saved to files:');
    console.log('   📄 user-extraction-data.json (full data)');
    console.log('   🔥 firebase-import-users.json (Firebase format)');
    
    // Generate duplicate email report
    generateDuplicateEmailReport({ employees, clients, signers });
    
    console.log('✅ User extraction completed successfully!');
    
    return extractionData;
    
  } catch (error) {
    console.error('❌ Error extracting users:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

/**
 * Extract employee users
 */
async function extractEmployees(connection) {
  const query = `
    SELECT 
      id,
      firstName,
      lastName, 
      email,
      roleID,
      authenticationType,
      password,
      CASE 
        WHEN password IS NOT NULL AND password != '' THEN 'md5'
        ELSE 'none'
      END as passwordType
    FROM employee 
    WHERE email IS NOT NULL 
      AND email != ''
      AND email NOT LIKE '%test%'
      AND email NOT LIKE '%demo%'
    ORDER BY id;
  `;
  
  const [rows] = await connection.execute(query);
  
  return rows.map(user => ({
    ...user,
    userType: 'employee',
    originalEmail: user.email,
    firebaseEmail: addEmailPrefix(user.email, 'employee'),
    uid: `emp_${user.id}`,
    displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
  }));
}

/**
 * Extract client users (from contacts table)
 */
async function extractClients(connection) {
  const query = `
    SELECT 
      Id,
      Contact_First_Name as firstName,
      Contact_Last_Name as lastName,
      Contact_Email as email,
      Contact_Work_Phone as workPhone,
      Contact_Cell as cellPhone,
      authenticationType,
      pass as password,
      company_name,
      Company_ID,
      status,
      CASE 
        WHEN pass IS NOT NULL AND pass != '' THEN 'md5'
        ELSE 'none' 
      END as passwordType
    FROM contacts 
    WHERE Contact_Email IS NOT NULL 
      AND Contact_Email != ''
      AND Contact_Email NOT LIKE '%test%'
      AND Contact_Email NOT LIKE '%demo%'
      AND status = 'A'
    ORDER BY Id;
  `;
  
  const [rows] = await connection.execute(query);
  
  return rows.map(user => ({
    ...user,
    userType: 'client',
    originalEmail: user.email,
    firebaseEmail: addEmailPrefix(user.email, 'client'),
    uid: `client_${user.Id}`,
    displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
  }));
}

/**
 * Extract signers (actual notary professionals who perform signings)
 */
async function extractSigners(connection) {
  // Check what tables exist to find where signers are stored
  try {
    const query = `
      SHOW TABLES;
    `;
    
    const [tables] = await connection.execute(query);
    console.log('📊 Available tables:', tables.map(t => Object.values(t)[0]));
    
    // Check if there's a signers table
    const signerTables = tables.filter(t => 
      Object.values(t)[0].toLowerCase().includes('signer') ||
      Object.values(t)[0].toLowerCase().includes('notary')
    );
    
    if (signerTables.length > 0) {
      console.log('🔍 Found potential signer tables:', signerTables.map(t => Object.values(t)[0]));
      
      // Try to extract from the main signers table
      const signerQuery = `
        SELECT 
          *
        FROM signers
        LIMIT 10;
      `;
      
      const [rows] = await connection.execute(signerQuery);
      console.log('📋 Signers table structure:', rows);
      
      // Now try to get signers with the correct column names
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        console.log('🗂️ Available columns in signers table:', columns);
        
        // Look for email-like columns
        const emailColumns = columns.filter(col => 
          col.toLowerCase().includes('email') || 
          col.toLowerCase().includes('mail')
        );
        console.log('📧 Email columns found:', emailColumns);
        
        if (emailColumns.length > 0) {
          const emailCol = emailColumns[0];
          const actualSignerQuery = `
            SELECT 
              *
            FROM signers
            WHERE ${emailCol} IS NOT NULL 
              AND ${emailCol} != ''
              AND ${emailCol} != 'na'
              AND ${emailCol} NOT LIKE '%test%'
              AND ${emailCol} NOT LIKE '%demo%'
            ORDER BY signer_id;
          `;
          
          const [signerRows] = await connection.execute(actualSignerQuery);
          console.log(`✅ Found ${signerRows.length} signers with ${emailCol}:`, signerRows);
          
          return signerRows.map(signer => ({
            ...signer,
            userType: 'signer',
            originalEmail: signer[emailCol],
            firebaseEmail: addEmailPrefix(signer[emailCol], 'signer'),
            uid: `signer_${signer.signer_id}`,
            displayName: `${signer.Signer_First || ''} ${signer.Signer_Last || ''}`.trim()
          }));
        }
      }
      
      return [];
      
    } else {
      console.log('ℹ️  No dedicated signer tables found. Signers might be stored elsewhere.');
      return [];
    }
    
  } catch (error) {
    console.log('ℹ️  Error checking for signer tables:', error.message);
    return [];
  }
}

/**
 * Add email prefix for user type
 */
function addEmailPrefix(email, userType) {
  if (!email || !email.includes('@')) {
    return email;
  }
  
  const [localPart, domain] = email.split('@');
  return `${localPart}+${userType}@${domain}`;
}

/**
 * Generate Firebase import format
 */
function generateFirebaseImportData({ employees, clients, signers }) {
  const allUsers = [...employees, ...clients, ...signers];
  
  return {
    users: allUsers
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
          originalId: user.userType === 'employee' ? user.id : user.Id,
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

/**
 * Generate duplicate email report
 */
function generateDuplicateEmailReport({ employees, clients, signers }) {
  const emailCounts = {};
  const allUsers = [...employees, ...clients, ...signers];
  
  // Count original emails
  allUsers.forEach(user => {
    const email = user.originalEmail?.toLowerCase();
    if (email) {
      emailCounts[email] = (emailCounts[email] || 0) + 1;
    }
  });
  
  const duplicates = Object.entries(emailCounts)
    .filter(([email, count]) => count > 1)
    .map(([email, count]) => ({
      email,
      count,
      users: allUsers.filter(u => u.originalEmail?.toLowerCase() === email)
    }));
  
  if (duplicates.length > 0) {
    console.log(`\n⚠️  Found ${duplicates.length} duplicate emails:`);
    duplicates.forEach(({ email, count, users }) => {
      console.log(`   📧 ${email} (${count} users)`);
      users.forEach(user => {
        console.log(`      - ${user.userType}: ${user.firebaseEmail}`);
      });
    });
    
    fs.writeFileSync(
      '/Users/ohalavi/Documents/GitHub2025/pacdocsign/duplicate-emails-report.json',
      JSON.stringify(duplicates, null, 2)
    );
    console.log('   💾 Duplicate report saved to: duplicate-emails-report.json');
  } else {
    console.log('\n✅ No duplicate emails found');
  }
}

// Run the extraction
if (import.meta.url === `file://${process.argv[1]}`) {
  extractUsersForFirebase()
    .then(() => {
      console.log('\n🎉 Migration data extraction completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Extraction failed:', error);
      process.exit(1);
    });
}

export { extractUsersForFirebase };