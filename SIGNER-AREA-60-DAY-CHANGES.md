# Signer Area - 60 Day Record Visibility with 48 Hour Document Link Hiding

## Summary
Modified the signer area to show records for 60 days instead of 48 hours, while hiding document links after 48 hours from the appointment time.

## Changes Made

### 1. Backend API Changes (`packages/api/Cloud Functions/orders-service/application/order.ts`)

#### Modified `getSignerOrders` method (lines 1028-1131):

**Before:**
- Showed records only within 48 hours of appointment
- No distinction between record visibility and document access

**After:**
- Shows records within 60 days of appointment
- Added `shouldHideDocLinks` attribute to indicate if document links should be hidden (past 48 hours)
- Maintains 48-hour threshold for document access while showing full 60 days of data

**Key Changes:**
```typescript
// Changed from 48 hours to 60 days for record visibility
const sixtyDaysAgo = moment().tz('America/Los_Angeles').subtract(60, 'days').format('YYYY-MM-DD HH:mm:ss');

// Added 48-hour calculation for document link visibility
const fortyEightHoursAgo = moment().tz('America/Los_Angeles').subtract(48, 'hours').format('YYYY-MM-DD HH:mm:ss');

// Updated filter from fortyEightHourFilter to sixtyDayFilter
const sixtyDayFilter = Sequelize.literal(...);

// Added new attribute to track document link visibility
const shouldHideDocsAttribute = Sequelize.literal(
    `TIMESTAMP(...) < TIMESTAMP('${fortyEightHoursAgo}')`
);
```

**Applied to:**
- Regular signers (Role !== 'CHILD') - line 1072
- CHILD role signers (Sub_Signer_Id) - line 1107

### 2. Frontend Changes (`packages/signers/src/Components/Orders/OrdersList.tsx`)

#### Modified OrdersList component (lines 239-298):

**Before:**
- Always showed Scanback and Document links for non-completed orders

**After:**
- Conditionally shows document links based on `shouldHideDocLinks` flag
- Shows "Document access expired" message when links are hidden

**Key Changes:**
```tsx
{/* Only show document links if within 48 hours of appointment */}
{ !row?.shouldHideDocLinks && (
  <>
    <Typography>Scanback(s)</Typography>
    <Typography>Document(s)</Typography>
  </>
)}

{/* Show message if document links are hidden (past 48 hours) */}
{ row?.shouldHideDocLinks && (
  <Typography color='textSecondary'>
    Document access expired
  </Typography>
)}
```

### 3. Test Updates (`packages/api/Cloud Functions/orders-service/__test__/order.getSignerOrders.test.ts`)

**Updated test suite:**
- Changed test suite name from "48-Hour Filter" to "60-Day Filter with 48-Hour Document Access"
- Updated test cases to verify 60-day record visibility
- Added new test section "Document Link Hiding (48-Hour Threshold)"
- Updated boundary tests to check 60-day boundaries
- Added tests to verify `shouldHideDocLinks` attribute is correctly calculated

**New test cases:**
1. `should filter orders to include those within 60 days`
2. `should exclude orders older than 60 days`
3. `should mark shouldHideDocLinks as false for orders within 48 hours`
4. `should mark shouldHideDocLinks as true for orders past 48 hours but within 60 days`
5. `should mark shouldHideDocLinks as true for orders exactly at 48 hours (boundary)`

## Behavior

### Record Visibility:
- **Before:** Records visible for 48 hours after appointment
- **After:** Records visible for 60 days after appointment

### Document Link Access:
- **Within 48 hours:** Document links (Scanbacks & Documents) are visible and clickable
- **After 48 hours (but within 60 days):** 
  - Records remain visible
  - Document links are hidden
  - Message displayed: "Document access expired"

### Edge Cases Handled:
1. Open Time appointments (w_Appointment_Time_type = 'OT') - use 00:00:00
2. Null appointment times - use 00:00:00
3. Empty appointment time strings - use 00:00:00
4. Los Angeles timezone is used for all calculations
5. Works for both regular signers and CHILD role signers

## Database Query Changes

The SQL filter now uses:
```sql
-- Record visibility (60 days)
TIMESTAMP(CONCAT(w_sql_appointment_date, ' ', ...)) >= TIMESTAMP('60_days_ago')

-- Document link visibility (48 hours) - returned as attribute
TIMESTAMP(CONCAT(w_sql_appointment_date, ' ', ...)) < TIMESTAMP('48_hours_ago')
```

## API Response Structure

Each order in the response now includes:
```javascript
{
  Id: number,
  w_Appointment_Date: string,
  w_Appointment_Time: string,
  // ... other order fields
  scanbackCount: number,
  documentCount: number,
  shouldHideDocLinks: 0 | 1,  // NEW: 0 = show links, 1 = hide links
}
```

## Testing Recommendations

1. **Backend Testing:**
   - Verify orders within 60 days are returned
   - Verify orders older than 60 days are excluded
   - Verify `shouldHideDocLinks` is 0 for appointments within 48 hours
   - Verify `shouldHideDocLinks` is 1 for appointments past 48 hours

2. **Frontend Testing:**
   - Verify document links appear for recent appointments (< 48 hours)
   - Verify document links are hidden for older appointments (> 48 hours but < 60 days)
   - Verify "Document access expired" message appears when appropriate
   - Test pagination, search, and sorting still work correctly

3. **Integration Testing:**
   - Test with various appointment times (Open Time, standard times, null values)
   - Test timezone handling (Los Angeles timezone)
   - Test with both regular and CHILD role signers

## Files Modified

1. `/workspace/packages/api/Cloud Functions/orders-service/application/order.ts`
2. `/workspace/packages/signers/src/Components/Orders/OrdersList.tsx`
3. `/workspace/packages/api/Cloud Functions/orders-service/__test__/order.getSignerOrders.test.ts`

## Backwards Compatibility

The changes are backwards compatible:
- The API adds a new field (`shouldHideDocLinks`) but doesn't break existing fields
- The frontend gracefully handles missing `shouldHideDocLinks` field (treats as falsy, showing links)
- Existing functionality (search, pagination, sorting) is preserved
