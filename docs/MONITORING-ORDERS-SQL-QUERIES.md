# Monitoring Orders - Exact SQL Statements

## Overview
This document contains the exact SQL statements that the monitoring orders screen executes. Use these to manually verify why appointments might not be showing.

---

## 🔍 Main Query (Monitoring Orders)

### Simplified Query (Check If Records Exist)
Use this first to see if any records match the criteria:

```sql
-- Replace '2025-10-30' with today's date in YYYY-MM-DD format
SELECT 
    Id,
    w_Loan_Number,
    w_Appointment_Date,
    w_Appointment_Time,
    w_Borrower_First_Name,
    w_Borrower_Last_Name,
    w_Company_Name,
    w_Signing_State,
    w_sql_appointment_date,
    f_status_web,
    f_signer_id,
    confirmation_call_status,
    w_docs_received
FROM borrower
WHERE w_sql_appointment_date = '2025-10-30'  -- TODAY'S DATE (YYYY-MM-DD)
  AND f_status_web = 'Assigned'
  AND (f_signer_id IS NOT NULL AND f_signer_id != '')
ORDER BY Id DESC
LIMIT 20 OFFSET 0;
```

---

## 📊 Full Query with Joins (What the API Actually Runs)

The actual query includes LEFT JOINs for related tables. Here's the complete equivalent:

```sql
-- Full query with all Sequelize inclusions
SELECT 
    borrower.Id,
    borrower.w_Loan_Number,
    borrower.w_Appointment_Date,
    borrower.w_Appointment_Time,
    borrower.w_Borrower_First_Name,
    borrower.w_Borrower_Last_Name,
    borrower.w_Company_Name,
    borrower.w_Return_Tracking,
    borrower.w_docs_received,
    borrower.f_status_web,
    borrower.w_Signing_State,
    borrower.clientID,
    borrower.division_id,
    borrower.Contact_ID,
    borrower.w_sql_appointment_date,
    borrower.order_locked,
    borrower.confirmation_call_status,
    
    -- Subquery: Scanback Count
    (SELECT SUM(case when usertype = "signer" then 1 else 0 end) 
     FROM document_count 
     WHERE document_count.borrower_id = borrower.Id 
       AND status = "A") AS scanbackCount,
    
    -- Subquery: Document Count
    (SELECT SUM(case when usertype != "signer" then 1 else 0 end) 
     FROM document_count 
     WHERE document_count.borrower_id = borrower.Id 
       AND status = "A" 
       AND filename NOT LIKE "%merged.%" 
       AND filename NOT LIKE "%moved.%") AS documentCount

FROM borrower

-- LEFT JOIN for Fees
LEFT JOIN order_fees AS fees ON fees.Borrower_ID = borrower.Id

-- LEFT JOIN for Current Signer
LEFT JOIN signers AS signer ON signer.signer_id = borrower.f_signer_id

-- LEFT JOIN for Old Signer (if exists)
LEFT JOIN signers AS old_signer ON old_signer.signer_id = borrower.f_signer_id_old

WHERE borrower.w_sql_appointment_date = '2025-10-30'  -- TODAY (YYYY-MM-DD)
  AND borrower.f_status_web = 'Assigned'
  AND (borrower.f_signer_id IS NOT NULL AND borrower.f_signer_id != '')

ORDER BY 
    borrower.Id DESC,
    STR_TO_DATE(borrower.w_Appointment_Time, '%h:%i %p') ASC

LIMIT 20 
OFFSET 0;
```

---

## 🔎 Diagnostic Queries for Missing Appointments

### Query 1: Check Specific Order IDs
If you know the Order IDs that should appear:

```sql
-- Replace ORDER_ID_1 and ORDER_ID_2 with the actual IDs
SELECT 
    Id,
    w_Loan_Number,
    w_sql_appointment_date,
    f_status_web,
    f_signer_id,
    w_Appointment_Date,
    w_Appointment_Time,
    w_Borrower_First_Name,
    w_Borrower_Last_Name,
    confirmation_call_status
FROM borrower
WHERE Id IN (ORDER_ID_1, ORDER_ID_2);
```

### Query 2: Check Date Filter
Verify the appointment date format:

```sql
-- Check date format and value
SELECT 
    Id,
    w_Loan_Number,
    w_Appointment_Date,        -- Original date field
    w_sql_appointment_date,    -- SQL-formatted date field (used in filter)
    f_status_web,
    f_signer_id
FROM borrower
WHERE Id IN (ORDER_ID_1, ORDER_ID_2);
```

**Important**: The filter uses `w_sql_appointment_date` (YYYY-MM-DD format), NOT `w_Appointment_Date` (MM/DD/YYYY format).

### Query 3: Check Status Filter
Verify the status value:

```sql
-- Check current status
SELECT 
    Id,
    w_Loan_Number,
    f_status_web,
    w_sql_appointment_date,
    f_signer_id
FROM borrower
WHERE Id IN (ORDER_ID_1, ORDER_ID_2);
```

**Expected**: `f_status_web` should be exactly `'Assigned'` (case-sensitive).

### Query 4: Check Signer Assignment
Verify signer is assigned:

```sql
-- Check if signer is assigned
SELECT 
    b.Id,
    b.w_Loan_Number,
    b.f_signer_id,
    b.f_status_web,
    s.signer_id,
    s.Signer_First,
    s.Signer_Last
FROM borrower b
LEFT JOIN signers s ON s.signer_id = b.f_signer_id
WHERE b.Id IN (ORDER_ID_1, ORDER_ID_2);
```

**Expected**: `f_signer_id` should NOT be NULL and NOT be an empty string.

### Query 5: Check All Filter Conditions Together
Verify all criteria are met:

```sql
-- Replace '2025-10-30' with today's date
SELECT 
    Id,
    w_Loan_Number,
    w_sql_appointment_date,
    f_status_web,
    f_signer_id,
    CASE 
        WHEN w_sql_appointment_date != '2025-10-30' THEN '❌ Date mismatch'
        WHEN f_status_web != 'Assigned' THEN '❌ Status not Assigned'
        WHEN f_signer_id IS NULL OR f_signer_id = '' THEN '❌ No signer assigned'
        ELSE '✅ Should appear'
    END AS reason
FROM borrower
WHERE Id IN (ORDER_ID_1, ORDER_ID_2);
```

---

## 📅 Get Today's Date for SQL

To get today's date in the correct format for MySQL:

```sql
-- Get today's date in YYYY-MM-DD format
SELECT CURDATE() AS today_date;

-- Or if you need to convert timezone (PST/PDT)
SELECT DATE(CONVERT_TZ(NOW(), 'UTC', 'America/Los_Angeles')) AS today_pst;
```

---

## 🔍 Common Issues and Checks

### Issue 1: Date Format Mismatch
**Problem**: `w_sql_appointment_date` might be in wrong format or NULL.

**Check**:
```sql
SELECT 
    Id,
    w_sql_appointment_date,
    w_Appointment_Date,
    CASE 
        WHEN w_sql_appointment_date IS NULL THEN 'NULL date'
        WHEN w_sql_appointment_date != CURDATE() THEN 'Not today'
        ELSE 'Date OK'
    END AS date_status
FROM borrower
WHERE Id IN (ORDER_ID_1, ORDER_ID_2);
```

### Issue 2: Status Not Exactly 'Assigned'
**Problem**: Status might have extra spaces, different case, or be different value.

**Check**:
```sql
SELECT 
    Id,
    f_status_web,
    LENGTH(f_status_web) AS status_length,
    BINARY f_status_web = 'Assigned' AS exact_match
FROM borrower
WHERE Id IN (ORDER_ID_1, ORDER_ID_2);
```

### Issue 3: Signer Not Assigned
**Problem**: `f_signer_id` might be NULL or empty string.

**Check**:
```sql
SELECT 
    Id,
    f_signer_id,
    CASE 
        WHEN f_signer_id IS NULL THEN 'NULL signer'
        WHEN f_signer_id = '' THEN 'Empty signer'
        WHEN f_signer_id = '0' THEN 'Zero signer'
        ELSE 'Signer assigned'
    END AS signer_status
FROM borrower
WHERE Id IN (ORDER_ID_1, ORDER_ID_2);
```

### Issue 4: Pagination Issue
**Problem**: Orders might be on a different page.

**Check** (without pagination):
```sql
SELECT COUNT(*) AS total_matching_orders
FROM borrower
WHERE w_sql_appointment_date = CURDATE()
  AND f_status_web = 'Assigned'
  AND (f_signer_id IS NOT NULL AND f_signer_id != '');
```

---

## 🔧 Quick Fix Queries (Use with Caution!)

### Fix 1: Update Status to 'Assigned'
```sql
-- Only run if you're sure these should be 'Assigned'
UPDATE borrower
SET f_status_web = 'Assigned'
WHERE Id IN (ORDER_ID_1, ORDER_ID_2)
  AND f_status_web != 'Assigned';
```

### Fix 2: Update Appointment Date
```sql
-- Only run if you're sure these should show for today
UPDATE borrower
SET w_sql_appointment_date = CURDATE()
WHERE Id IN (ORDER_ID_1, ORDER_ID_2);
```

### Fix 3: Verify Signer Assignment
```sql
-- Check if signer exists
SELECT b.Id, b.f_signer_id, s.signer_id, s.Signer_First, s.Signer_Last
FROM borrower b
LEFT JOIN signers s ON s.signer_id = b.f_signer_id
WHERE b.Id IN (ORDER_ID_1, ORDER_ID_2);
```

---

## 📝 Step-by-Step Investigation Process

1. **Get Today's Date**:
   ```sql
   SELECT CURDATE() AS today;
   ```

2. **Check Specific Orders**:
   ```sql
   SELECT Id, w_sql_appointment_date, f_status_web, f_signer_id
   FROM borrower
   WHERE Id IN (ORDER_ID_1, ORDER_ID_2);
   ```

3. **Run Main Query with Today's Date**:
   ```sql
   -- Replace CURDATE() with actual date if different
   SELECT * FROM borrower
   WHERE w_sql_appointment_date = CURDATE()
     AND f_status_web = 'Assigned'
     AND (f_signer_id IS NOT NULL AND f_signer_id != '')
   ORDER BY Id DESC;
   ```

4. **Compare Results**: See if your two orders appear in step 3.

5. **Identify Mismatch**: Use diagnostic queries above to find which condition is failing.

---

## ⚠️ Important Notes

1. **Date Format**: The filter uses `w_sql_appointment_date` (YYYY-MM-DD), not `w_Appointment_Date` (MM/DD/YYYY).

2. **Status Exact Match**: Status must be exactly `'Assigned'` (case-sensitive, no extra spaces).

3. **Signer Required**: Orders must have a non-null, non-empty `f_signer_id`.

4. **Pagination**: Default is 20 rows per page, sorted by `Id DESC`.

5. **Auto-Refresh**: The frontend refreshes every 10 seconds, so changes might take up to 10 seconds to appear.

---

## 🎯 Quick Reference

Replace these values in the queries above:
- `ORDER_ID_1`, `ORDER_ID_2` → Your actual order IDs
- `'2025-10-30'` or `CURDATE()` → Today's date in YYYY-MM-DD format
- `'Assigned'` → Exact status value (case-sensitive)

