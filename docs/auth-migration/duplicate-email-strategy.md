# Handling Duplicate Emails Across User Types

## 🚨 Problem: Firebase Constraint
Firebase Auth: **One email = One user account globally**
- Cannot import john@example.com as employee AND signer
- Must choose a consolidation strategy

## 📊 Current Architecture Analysis
```
employees table: email, roleID, password
contacts table: Contact_Email, password  
clients table: clientName, authorized_domains
```

## 🎯 Recommended Solution: Role Consolidation

### **Step 1: Data Audit**
```sql
-- Find duplicate emails across tables
SELECT email FROM employees 
UNION ALL 
SELECT Contact_Email FROM contacts
GROUP BY email HAVING COUNT(*) > 1;
```

### **Step 2: User Consolidation Strategy**
```javascript
// Single Firebase user with multiple roles
{
  uid: 'john123',
  email: 'john@example.com',
  customClaims: {
    roles: ['employee', 'signer'],
    permissions: {
      employee: { dashboard: true, admin: false },
      signer: { orders: true, profile: true }
    },
    activeRole: 'employee', // Default role
    primaryRole: 'employee' // Highest privilege role
  }
}
```

### **Step 3: Application Logic Updates**
```javascript
// In your apps - role switching
const switchRole = (newRole) => {
  if (user.customClaims.roles.includes(newRole)) {
    // Update activeRole in custom claims
    updateCustomClaims({ activeRole: newRole });
    // Redirect to appropriate app
    window.location = getAppUrl(newRole);
  }
};

// Role-based access
const hasPermission = (action) => {
  const activeRole = user.customClaims.activeRole;
  return user.customClaims.permissions[activeRole][action];
};
```

## 🔄 Migration Process

### **Option A: Merge Accounts (Recommended)**
1. **Audit duplicate emails** - identify conflicts
2. **Choose primary role** - usually highest privilege
3. **Merge permissions** - combine all roles into custom claims
4. **Import single Firebase user** per email
5. **Update app logic** for role switching

### **Option B: Email Modification**  
1. **Add role suffixes**: john+employee@example.com, john+signer@example.com
2. **Update all references** in database
3. **Import as separate Firebase users**
4. **Maintain separate logins** per role

## 🎯 Recommended: Option A (Merge Accounts)

### **Benefits:**
- ✅ Single sign-on across all apps
- ✅ Better user experience  
- ✅ Fewer total users (cost savings)
- ✅ Centralized permission management

### **Implementation:**
```javascript
// Migration script
const consolidateUsers = async () => {
  const duplicates = await findDuplicateEmails();
  
  for (const email of duplicates) {
    const employeeData = await getEmployee(email);
    const contactData = await getContact(email);
    
    const roles = [];
    const permissions = {};
    
    if (employeeData) {
      roles.push('employee');
      permissions.employee = mapEmployeePermissions(employeeData.roleID);
    }
    
    if (contactData) {
      roles.push('signer');  
      permissions.signer = mapSignerPermissions(contactData);
    }
    
    // Import to Firebase with combined roles
    await importUser({
      email,
      passwordHash: employeeData?.password || contactData?.password,
      customClaims: {
        roles,
        permissions,
        activeRole: roles[0],
        primaryRole: getPrimaryRole(roles)
      }
    });
  }
};
```

## 📝 Updated Stories

**Story 1** becomes:
- Enable Identity Platform
- **Audit and consolidate duplicate emails**
- Import users with merged roles
- Test multi-role authentication

This adds complexity but provides the best user experience.