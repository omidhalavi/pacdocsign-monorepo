# Email Prefixing Strategy for Firebase Migration

## 🎯 **Option 2: Email Prefixing (Simple & Clean)**

### **Email Transformation:**
```javascript
// Original emails → Firebase emails
employees: john@example.com → john+employee@example.com
contacts:  john@example.com → john+signer@example.com  
clients:   john@example.com → john+client@example.com
```

### **Benefits:**
✅ **Simple migration** - no complex role merging  
✅ **Separate user accounts** - clear isolation  
✅ **Existing app logic preserved** - minimal code changes  
✅ **Clear user types** - no role confusion  
✅ **Email still works** - Gmail ignores +suffix for delivery  

## 🔄 **Migration Process:**

### **Step 1: Database Updates**
```sql
-- Update employee emails
UPDATE employees 
SET email = CONCAT(SUBSTRING_INDEX(email, '@', 1), '+employee@', SUBSTRING_INDEX(email, '@', -1));

-- Update contact emails  
UPDATE contacts
SET Contact_Email = CONCAT(SUBSTRING_INDEX(Contact_Email, '@', 1), '+signer@', SUBSTRING_INDEX(Contact_Email, '@', -1));

-- Update any client user emails (if they exist)
-- UPDATE clients SET email = CONCAT(..., '+client@', ...);
```

### **Step 2: Firebase Import**
```javascript
// Import employees
const employees = await getEmployees();
const employeeUsers = employees.map(emp => ({
  uid: `emp_${emp.id}`,
  email: emp.email, // Already has +employee suffix
  passwordHash: Buffer.from(emp.password, 'hex'),
  customClaims: { userType: 'employee', roleID: emp.roleID }
}));

// Import contacts/signers  
const contacts = await getContacts();
const signerUsers = contacts.map(contact => ({
  uid: `signer_${contact.id}`,
  email: contact.Contact_Email, // Already has +signer suffix
  passwordHash: Buffer.from(contact.password, 'hex'),
  customClaims: { userType: 'signer' }
}));

// Import to Firebase
await auth.importUsers([...employeeUsers, ...signerUsers], {
  hash: { algorithm: 'MD5', rounds: 1 }
});
```

### **Step 3: Frontend Updates**
```javascript
// Dashboard app - users login with +employee emails
// Signers app - users login with +signer emails  
// Client app - users login with +client emails

// No role switching logic needed!
// Each app only sees its own user type
```

## 📝 **Updated Stories (Still 12 hours):**

### **Story 1: PAC-325 - Database Updates & Firebase Setup (3h)**
- Update database emails with +suffixes
- Enable Identity Platform
- Test email transformations

### **Story 2: PAC-326 - Import Users & Replace API Auth (3h)**  
- Import all user types with prefixed emails
- Replace custom session management
- Test Firebase token verification

### **Story 3: PAC-327 - Update Frontend Apps (4h)**
- Update login forms to handle +suffix emails
- Replace auth calls with Firebase SDK
- Test all app login flows

### **Story 4: PAC-328 - Deploy to Production (1h)**
- Deploy with email updates
- Monitor authentication flows
- Quick issue resolution

### **Story 5: PAC-329 - Documentation & Cleanup (1h)**
- Document email prefix strategy
- Remove old auth code
- Migration summary

## 🔑 **Key Advantages:**

1. **User Communication**: "Your login email is now john+employee@example.com"
2. **Email Delivery**: Still works - Gmail/Outlook ignore +suffix
3. **Clear Separation**: No confusion about user types
4. **Simple Logic**: Each app handles one user type
5. **Easy Rollback**: Can reverse email changes if needed

## 📧 **User Communication Strategy:**
- Send email to users before migration
- "Your employee login is now: john+employee@example.com"  
- "Your signer login is now: john+signer@example.com"
- "Same password, just add +[role] to your email"

This keeps the 12-hour timeline while cleanly solving the duplicate email problem!