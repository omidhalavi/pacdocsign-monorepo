// Test script to trigger password reset for imported user
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'pacdocsign-144304'
});

async function resetPassword() {
  try {
    const email = 'omid+employee@excersys.com';
    
    // Generate password reset link
    const link = await admin.auth().generatePasswordResetLink(email);
    
    console.log('Password reset link generated:');
    console.log(link);
    console.log('\nUser can click this link to set a new password.');
    
    // Also set a temporary password for testing
    await admin.auth().updateUser('emp_2', {
      password: 'TempPassword123!'
    });
    
    console.log('\n✅ Temporary password set: TempPassword123!');
    console.log('User can now login with this password');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

resetPassword();