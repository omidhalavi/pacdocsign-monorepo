# Monitoring Orders Screen - Full Logic Analysis

## Overview
The Monitoring Orders screen displays orders that are assigned to signers and scheduled for **today's date only**. This screen is designed for real-time monitoring of active appointments happening on the current day.

---

## 🔍 What Rows Show Up

### Primary Filter Criteria (Backend)
Located in: `packages/api/Cloud Functions/orders-service/application/order.ts` (lines 199-203)

```typescript
if (status && status === 'monitoring') {
    query.where.f_status_web = 'Assigned'
}
```

### Complete Filter Logic
The monitoring orders query applies **THREE main filters**:

1. **Status Filter**: `status = 'monitoring'`
   - Backend translates this to: `f_status_web = 'Assigned'`
   - Only shows orders with "Assigned" status

2. **Date Filter**: `filter = 'w_sql_appointment_date:{TODAY}'`
   - Automatically set to today's date using `moment().format('YYYY-MM-DD')`
   - Only shows orders scheduled for the current day

3. **Sorting**: Default sorting by `Id DESC`
   - Can be changed by user interaction with table headers

### What This Means:
**Rows that appear:**
- ✅ Orders with `f_status_web = 'Assigned'`
- ✅ Orders with `w_sql_appointment_date = TODAY`
- ✅ Orders with a signer assigned (`f_signer_id` is not null/empty)

**Rows that DON'T appear:**
- ❌ Orders from yesterday or tomorrow
- ❌ Orders with status other than "Assigned" (e.g., "Pending", "Signed", "Cancelled")
- ❌ Unassigned orders (those without a signer)

---

## ⏰ When Rows Show Up

### Initial Load
**File**: `packages/dashboard/src/Pages/Orders/MonitoringOrders.tsx` (lines 29-31)

```typescript
const allOrders: any = useRecoilValueLoadable(getMonitoringOrders);
const ordersData = allOrders?.contents?.result || [];
const total = allOrders?.contents?.result?.count || 0;
```

The component fetches monitoring orders immediately when:
1. The page is mounted/loaded
2. The Recoil selector `getMonitoringOrders` is triggered

### Auto-Refresh Mechanism
**File**: `packages/dashboard/src/Pages/Orders/MonitoringOrders.tsx` (lines 80-85)

```typescript
useEffect(() => {
  setInterval(() => {
    refresh((n: number) => ++n)
  }, 10000)
  // eslint-disable-next-line
}, [])
```

**Critical Finding**: The screen auto-refreshes **every 10 seconds** (10,000 milliseconds)

This means:
- New orders that match the criteria will appear within 10 seconds
- Status changes will be reflected within 10 seconds
- Orders that no longer match (e.g., status changed or moved to a different date) will disappear within 10 seconds

### Manual Refresh Triggers
The data also refreshes when:
1. User changes call status (line 47: `refresh((n) => ++n)`)
2. User changes order status (line 62: `refresh((n) => ++n)`)
3. User performs any action that updates the `refetchMonitoringOrders` atom

---

## 🔧 How Rows Show Up (Technical Flow)

### 1. Frontend Request
**File**: `packages/dashboard/src/Recoil/Selectors/Orders.ts` (lines 151-185)

```typescript
const getMonitoringOrders = selector({
  key: 'getMonitoringOrders',
  get: async ({ get }) => {
    get(refetchMonitoringOrders);
    const page = get(ordersPagination);
    const d = moment().format('YYYY-MM-DD')  // ← TODAY'S DATE
    const params = {
      ...page,
      orderBy: page.orderBy || 'Id',
      orderType: page.orderType || 'DESC',
      status: 'monitoring',                   // ← MONITORING STATUS
      filter: `w_sql_appointment_date:${d}`   // ← DATE FILTER
    };
    
    const res: any = await api.GET('orders/', { params });
    
    // Transform data
    res.forEach(r => {
      r.id = r.Id;
      r.name = `${r.w_Borrower_First_Name} ${r.w_Borrower_Last_Name}`;
      r.pst_time = r.w_Appointment_Time
    })
    
    return { result: res, success: true };
  }
});
```

### 2. API Endpoint
**File**: `packages/api/Cloud Functions/orders-service/controller/orders.controller.ts` (lines 62-88)

```typescript
static getAllOrders = async (req: any, res: any, next: any) => {
  let { 
    limit = 20, 
    page = 1, 
    orderBy, 
    orderType, 
    filter,        // ← Contains "w_sql_appointment_date:2025-10-30"
    status,        // ← Contains "monitoring"
    ...
  } = req.query;
  
  let [filterBy, filterValue] = filter?.split(':') || []
  
  const response = await OrdersModel.getAllOrders({
    limit, page, orderBy, orderType,
    filterBy,      // ← "w_sql_appointment_date"
    filterValue,   // ← "2025-10-30"
    status,        // ← "monitoring"
    ...
  });
  
  res.json(response);
}
```

### 3. Database Query Construction
**File**: `packages/api/Cloud Functions/orders-service/application/order.ts` (lines 103-267)

The query is built in multiple steps:

**Step 1: Base Query Setup**
```typescript
let query: any = {
    where: {},
    limit: limit,
    offset: (page - 1) * limit,
    order: [[orderBy, orderType]],
}
```

**Step 2: Apply Date Filter**
```typescript
if (filterBy && filterValue) {
    query.where[filterBy] = filterValue  // w_sql_appointment_date = '2025-10-30'
}
```

**Step 3: Apply Status Filter**
```typescript
if (status && status === 'monitoring') {
    query.where.f_status_web = 'Assigned'  // Only "Assigned" orders
}
```

**Step 4: Execute Query**
```typescript
return OrdersModel.findAndCountAll(query);
```

### 4. Frontend Display
**File**: `packages/dashboard/src/Components/Orders/MonitoringOrdersData.tsx` (lines 31-152)

The component renders a table with these columns:
- Loan/Order # (`w_Loan_Number`)
- Signer (clickable, shows signer info modal)
- Client (`w_Company_Name`)
- Borrower (combined first/last name)
- State (`w_Signing_State`)
- Local Time (`w_Appointment_Time`)
- PST Time (converted `w_Appointment_Time`)
- Docs (`w_docs_received`)
- Status (`f_status_web`)
- Call Status (`confirmation_call_status`)
- Action (buttons for various operations)

### 5. Row Coloring
**File**: `packages/dashboard/src/Components/Orders/MonitoringOrdersData.tsx` (line 195)

```typescript
getRowBackGroundColor={(row, colorOptions) => 
  getColorFromStatus(row.confirmation_call_status)
}
```

Rows are color-coded based on their `confirmation_call_status` value.

---

## 📊 Data Flow Diagram

```
[User Opens Page]
       ↓
[MonitoringOrders Component Mounts]
       ↓
[getMonitoringOrders Selector Triggered]
       ↓
[Frontend builds params:]
  - status: 'monitoring'
  - filter: 'w_sql_appointment_date:2025-10-30'
  - orderBy: 'Id', orderType: 'DESC'
       ↓
[API GET request: /orders/]
       ↓
[Backend Controller parses query params]
       ↓
[Order.getAllOrders() builds Sequelize query:]
  WHERE f_status_web = 'Assigned'
    AND w_sql_appointment_date = '2025-10-30'
  ORDER BY Id DESC
  LIMIT 20 OFFSET 0
       ↓
[MySQL executes query]
       ↓
[Results returned to frontend]
       ↓
[Data transformed and stored in Recoil state]
       ↓
[MonitoringOrdersData renders table]
       ↓
[Auto-refresh every 10 seconds] ←┐
       └─────────────────────────────┘
```

---

## 🎯 Key Insights

### 1. **Date Specificity**
The monitoring screen is designed for **TODAY ONLY**. This is intentional - it's meant for real-time monitoring of current-day appointments, not historical or future viewing.

### 2. **Status Specificity**
Only "Assigned" orders appear. This means:
- Pending orders (not yet assigned) → Won't show
- Completed/Signed orders → Won't show
- Cancelled orders → Won't show
- Only active, assigned orders → Will show

### 3. **Real-Time Updates**
The 10-second auto-refresh ensures the data is nearly real-time, which is critical for monitoring active appointments.

### 4. **Pagination**
Default limit is 20 rows per page, but users can change this through the table interface.

---

## 🔧 Customization Options

If you want to change what shows up, here are the key modification points:

### Change Date Range
**File**: `packages/dashboard/src/Recoil/Selectors/Orders.ts` (line 156)

Currently:
```typescript
const d = moment().format('YYYY-MM-DD')  // Only today
```

To show yesterday and today:
```typescript
const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD')
const today = moment().format('YYYY-MM-DD')
filter: `w_sql_appointment_date_range:${yesterday},${today}`
```

### Include Additional Statuses
**File**: `packages/api/Cloud Functions/orders-service/application/order.ts` (lines 199-203)

Currently:
```typescript
if (status && status === 'monitoring') {
    query.where.f_status_web = 'Assigned'
}
```

To include multiple statuses:
```typescript
if (status && status === 'monitoring') {
    query.where.f_status_web = {
        [Op.in]: ['Assigned', 'Pending', 'Confirmed']
    }
}
```

### Change Auto-Refresh Interval
**File**: `packages/dashboard/src/Pages/Orders/MonitoringOrders.tsx` (line 81)

Currently:
```typescript
setInterval(() => { refresh((n: number) => ++n) }, 10000)  // 10 seconds
```

To refresh every 30 seconds:
```typescript
setInterval(() => { refresh((n: number) => ++n) }, 30000)  // 30 seconds
```

---

## 📝 Summary

**What shows**: Orders with status "Assigned" scheduled for today
**When it shows**: On page load + every 10 seconds + after user actions
**How it shows**: Frontend → API → Database → Filter by date & status → Return results → Display in table with color-coding

The monitoring screen is a focused, real-time dashboard for tracking active appointments happening on the current day only.


