# Firebase User Migration

This directory contains all scripts and data files for migrating PacDocSign users from MySQL to Firebase Authentication.

## 📁 Directory Contents

### Migration Scripts
- `firebase-import-script.js` - Main script to import users to Firebase
- `mysql-user-extraction.js` - Extract users from MySQL database
- `clean-signer-passwords.js` - Clean and validate signer passwords
- `fix-firebase-import-format.js` - Fix Firebase import format issues
- `create-separate-import-files.js` - Create separate import files per user type

### User Data Files
- `firebase-employees-import.json` - Employee users (19 users)
- `firebase-clients-import.json` - Client users (1,546 users)
- `firebase-signers-import.json` - Signer users (58,290 total, 19,614 with passwords)
- `user-extraction-data.json` - Full user extraction data
- `firebase-import-users.json` - Combined Firebase import format

### Verification Files
- `verify-employees.json` - Employee data verification
- `verify-clients.json` - Client data verification  
- `verify-signers.json` - Signer data verification

### Reports
- `duplicate-emails-report.json` - Duplicate email analysis
- `import-files-summary.json` - Summary of import files

### Test Files
- `test-authentication.js` - Test authentication functionality
- `test-password-reset.cjs` - Test password reset flow
- `test-frontend-auth.html` - Frontend authentication testing

## 🚀 Quick Start

### Install Dependencies
```bash
cd migration
npm install
```

### Run Migration
```bash
# Extract users from MySQL
npm run extract

# Import to Firebase
npm run import

# Or run complete migration
npm run migrate
```

## 📊 Migration Statistics

- **Total Original Users**: 59,855
- **Total Importable Users**: 21,178
  - Employees: 19
  - Clients: 1,546
  - Signers: 19,614 (with passwords)

## 🔐 Email Strategy

Users are migrated with email prefixes to distinguish user types:
- Employees: `email+employee@domain.com`
- Signers: `email+signer@domain.com`
- Clients: `email+client@domain.com`

This prevents duplicate email conflicts across user types.

## 📝 Configuration

- `package.json` - Migration-specific dependencies
- `hash-config.json` - Password hash configuration

## ⚠️ Important Notes

1. Ensure Firebase service account key is placed in this directory before running
2. Review duplicate email report before import
3. Test with sample users before full migration
4. Keep backup of all JSON files

## 🔗 Related Documentation

See `/docs/auth-migration/` for:
- GCP authentication migration plan
- Firebase cost analysis
- Email strategy documentation
