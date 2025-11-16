#!/usr/bin/env node

/**
 * Test Firebase Authentication for all three projects
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin for each project
const projects = [
  {
    name: 'Dashboard (Employees)',
    projectId: 'pacdoc-dashboard-prod',
    testEmail: 'omid+employee@excersys.com',
    expectedUID: 'emp_2'
  },
  {
    name: 'Clients', 
    projectId: 'pacdoc-clients-prod',
    testEmail: 'fred.simab+client@pacdocsign.com',
    expectedUID: 'client_41969'
  },
  {
    name: 'Signers',
    projectId: 'pacdoc-signers-prod', 
    testEmail: 'ohalavi+signer@me.com',
    expectedUID: 'signer_2'
  }
];

async function testAuthentication() {
  console.log('🧪 Testing Firebase Authentication for all projects...\n');
  
  for (const project of projects) {
    console.log(`📋 Testing ${project.name} (${project.projectId})`);
    
    try {
      // Initialize Firebase Admin for this project
      const app = admin.initializeApp({
        projectId: project.projectId
      }, project.projectId);
      
      const auth = admin.auth(app);
      
      // Test 1: Check if user exists by email
      try {
        const userRecord = await auth.getUserByEmail(project.testEmail);
        console.log(`✅ User found: ${userRecord.uid}`);
        console.log(`   Email: ${userRecord.email}`);
        console.log(`   Display Name: ${userRecord.displayName || 'N/A'}`);
        
        // Check custom claims
        if (userRecord.customClaims) {
          const claims = JSON.parse(userRecord.customClaims);
          console.log(`   User Type: ${claims.userType}`);
          console.log(`   Original ID: ${claims.originalId}`);
        }
        
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`❌ User not found: ${project.testEmail}`);
        } else {
          console.log(`❌ Error: ${error.message}`);
        }
      }
      
      // Test 2: Check if expected UID exists
      try {
        const userByUID = await auth.getUser(project.expectedUID);
        console.log(`✅ UID exists: ${userByUID.uid} (${userByUID.email})`);
      } catch (error) {
        console.log(`❌ Expected UID not found: ${project.expectedUID}`);
      }
      
      // Test 3: List first 10 users to verify import
      try {
        const listUsers = await auth.listUsers(10);
        console.log(`📊 Total users in project: ${listUsers.users.length} (showing first 10)`);
        
        // Clean up
        admin.app(project.projectId).delete();
        
      } catch (error) {
        console.log(`❌ Error listing users: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to initialize project: ${error.message}`);
    }
    
    console.log(''); // Empty line
  }
}

// Run tests
testAuthentication()
  .then(() => {
    console.log('🎉 Authentication tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });